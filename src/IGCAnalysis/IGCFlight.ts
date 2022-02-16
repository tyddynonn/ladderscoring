import { LatLong } from "../calcs/DistanceCalcsTS";
import IGCParser from "igc-parser";
import IGCUtilities, { TimeZone } from "./IGCUtilities";
import { Log } from "../services/Logging";


export interface ENLPref {
    detect: 'On' | 'Off';
    threshold: number;
    duration: number;
}

export const defaultENLPref: ENLPref = {
    detect: 'On',
    threshold: 500,
    duration: 2
}

export interface ThermalInfo {
    entryTime: number,  // time in seconds
    entryIndex: number;
    exitTime: number;
    exitIndex: number;
}
interface ItakeOffAlts {
    pressure: number | null;
    gps: number | null;
}
export default class IGCFlight  {

    constructor(flight: IGCParser.IGCFile) {
        this.IGCfile = flight;
        var firstFix = 0;
        this.clearFlight();

        let i = 0;
        while ((i < flight.fixes.length) && (!flight.fixes[i].valid)) {
            i++;
        }
        this.hasPressure = (flight.fixes[i].pressureAltitude !== null);

        let fixCount = flight.fixes.length;
        this.recordInterval = Math.round((flight.fixes[fixCount - 1].timestamp - flight.fixes[0].timestamp) / (fixCount * 1000));

        if (this.hasPressure) {
            this.takeOff.pressure = flight.fixes[0].pressureAltitude;
        }
        i = 0;

        while ((i < flight.fixes.length) && (!flight.fixes[i].valid)) {
            i++;
        }

        this.takeOff.gps = flight.fixes[i].gpsAltitude;

        // work out takeoff & landing positions...
        i = 1;
        let j = flight.fixes.length - 1;

        //CF190719 - use a const to allow tweak of delta alt detection
        const deltaAlt = 5;
        var cuSum = 0;
        if (this.hasPressure) {
            i = 1;
            do {
                cuSum = cuSum + (flight.fixes[i].pressureAltitude ?? 0) - (flight.fixes[i-1].pressureAltitude ?? 0);
                i++;
            }
            while ((cuSum < deltaAlt) && (i < flight.fixes.length));
            cuSum = 0;
            do {
                cuSum = cuSum + (flight.fixes[j - 1].pressureAltitude ?? 0) - (flight.fixes[j].pressureAltitude ?? 0);
                j--;
            }
            while ((cuSum < deltaAlt) && (j > 1));
        }
        else {
            // use GPS alts
            do {
                i++;
            }
            while ((!flight.fixes[i].valid) && (i < flight.fixes.length));

            do {
                cuSum = cuSum + (flight.fixes[i].gpsAltitude ?? 0) - (flight.fixes[i - 1].gpsAltitude ?? 0);
                i++;
            }
            while ((cuSum < deltaAlt) && (i < flight.fixes.length));
            do {
                j--;
            }
            while ((!flight.fixes[j].valid) && (j > 2));
            cuSum = 0;
            do {
                cuSum = cuSum + (flight.fixes[j - 1].gpsAltitude ?? 0) - (flight.fixes[j].gpsAltitude ?? 0);
                j--;
            }
            while ((cuSum < deltaAlt) && (j > 1));
        }
        this.takeOffIndex = i - 1;
        this.landingIndex = j;

        this.secondPass();

    }

    // properties...

    IGCfile: IGCParser.IGCFile;

    unixStart: number[] = [];
    turnRate: number[] = [];
    groundSpeed: number[]=[];

    timeZone: TimeZone = {
        zoneAbbr: 'UTC',
        offset: 0,
        zoneName: 'UTC'
    };
    takeOff: ItakeOffAlts = {
        pressure: null,
        gps: null
    };
    baseElevation: number | null = null;
    engineRunList: LatLong[][] = [];
    glidingRuns: { start: number[], end: number[] } = { start: [], end: [] };

    takeOffIndex: number = 0;
    landingIndex: number = 0;
    stoppedIndex: number = 0;

    hasPressure: boolean = false;
    recordInterval: number = 0;


    setBaseElevation(elevation: number) {
        this.baseElevation = elevation;
    }

    private  secondPass() {
        var interval = Math.ceil(15 / this.recordInterval); //getting 15 second average turn rate
        var j:number;
        var turnList: number[] = []; //rolling list of last 30 seconds worth of turn changes

        var cuSum = 0;
        var prevBearing = IGCUtilities.toPoint(IGCUtilities.latLongFromFix(this.IGCfile.fixes[0]), IGCUtilities.latLongFromFix(this.IGCfile.fixes[1])).bearing;
        var nextBearing;
        var deltaBearing;
        var speedToHere;
        var travelled;
        this.turnRate.push(0);
        this.groundSpeed.push(0);


        for (j = 1; j < this.IGCfile.fixes.length - 1; j++) {

            nextBearing = IGCUtilities.toPoint(IGCUtilities.latLongFromFix(this.IGCfile.fixes[j]), IGCUtilities.latLongFromFix(this.IGCfile.fixes[j+1])).bearing;
            deltaBearing = Math.round((360 + nextBearing - prevBearing) % 360);
            if (Math.abs(deltaBearing) > 180) {
                deltaBearing -= 360;
            }
            prevBearing = nextBearing;
            cuSum += deltaBearing;
            turnList.push(deltaBearing);
            if (turnList.length > interval) {
                cuSum -= turnList.shift() ?? 0;
                let timediff = (this.IGCfile.fixes[j].timestamp - this.IGCfile.fixes[j - interval].timestamp) / 1000;
                this.turnRate.push(cuSum / timediff);

                travelled = IGCUtilities.toPoint(IGCUtilities.latLongFromFix(this.IGCfile.fixes[j]), IGCUtilities.latLongFromFix(this.IGCfile.fixes[j - interval])).distance;

                speedToHere = 3600 * travelled / timediff; //ground speed kph
                this.groundSpeed.push(speedToHere);
            }
            else {
                this.turnRate.push(0);
                this.groundSpeed.push(0);
            }
        }
        //CF190626 - work out when glider came to a halt
        // work backwards from last record to landing, looking for point where speed >20 kph
        // CF190718 - don't assume stopped must be after landing!
        for (let i = this.groundSpeed.length - 1; i > 0; i--) {
            if (this.groundSpeed[i] > 20) {
                this.stoppedIndex = i + 1;
                break;
            }
        }
}

    private  clearFlight() {
        this.unixStart.length = 0;
        this.turnRate.length = 0;
        this.timeZone.zoneAbbr = 'UTC';
        this.timeZone.offset = 0;
        this.timeZone.zoneName = 'UTC';
        this.takeOff.pressure = null;
        this.takeOff.gps = null;
        this.baseElevation = null;
    }


    getEngineRuns(enlpref: ENLPref) {
            var i = 0;
            var startIndex = null;
            var timeInterval;
            var engineRun = [];
            var landingIndex = this.IGCfile.fixes.length - 1;
            this.engineRunList.length = 0;
            this.glidingRuns.start.length = 0;
            this.glidingRuns.end.length = 0;

            this.glidingRuns.start.push(0);

            let flight = this.IGCfile;
        if (enlpref.detect === 'On') {
            let enlThreshold = enlpref.threshold / 1000;
                do {
                    if ((this.IGCfile.fixes[i].enl ?? 0) > enlThreshold) {
                        engineRun.push(IGCUtilities.latLongFromFix(flight.fixes[i]));
                        if (startIndex === null) {
                            startIndex = i;
                        }
                    }
                    else {
                        if (startIndex !== null) {
                            timeInterval = flight.fixes[i - 1].timestamp - flight.fixes[startIndex].timestamp;
                            if (timeInterval >= enlpref.duration * 1000) {
                                this.glidingRuns.end.push(startIndex);
                               this.glidingRuns.start.push(i);
                                this.engineRunList.push(engineRun);
                            }
                            engineRun = [];
                            startIndex = null;
                        }
                    }
                    i++;
                }
                while (i < landingIndex); //ignore taxying post landing
                this.glidingRuns.end.push(landingIndex);
            }
        }

        showEngineRuns () {
            Log(this.engineRunList);
        }

        getTakeOffIndex() {
            return this.takeOffIndex;
        }

        getLandingIndex() {
            return this.landingIndex;
        }

        getStoppedIndex () {
            return this.stoppedIndex;
        }

        getThermalInfo(index: number): ThermalInfo {
            var bottomIndex = index;
            var topIndex = index;
            do {
                bottomIndex--;
            }
            while ((Math.abs(this.turnRate[bottomIndex]) > 3) && (bottomIndex > this.takeOffIndex));
            do {
                topIndex++;
            }
            while ((Math.abs(this.turnRate[topIndex]) > 5) && (topIndex < this.landingIndex));
            return {
                entryTime: this.IGCfile.fixes[bottomIndex].timestamp / 1000 + this.timeZone.offset,
                entryIndex: bottomIndex,
                exitTime: this.IGCfile.fixes[topIndex].timestamp/1000 + this.timeZone.offset,
                exitIndex: topIndex
            };
        }

        getClimb (index:number): number | null {
            var recordCount = Math.round(30 / this.recordInterval);
            if ((index < (this.takeOffIndex + recordCount)) || (this.recordInterval > 4) || (index > this.landingIndex)) {
                return null;
            }
            else {
                let interval = (this.IGCfile.fixes[index].timestamp - this.IGCfile.fixes[index-recordCount].timestamp)/1000
                if (this.hasPressure) {
                    return (this.IGCfile.fixes[index].pressureAltitude ?? 0) - (this.IGCfile.fixes[index - recordCount].pressureAltitude ?? 0) / interval;
                }
                else {
                    return (this.IGCfile.fixes[index].gpsAltitude ?? 0) - (this.IGCfile.fixes[index - recordCount].gpsAltitude ?? 0) / interval;
                }
            }
        }
    }
