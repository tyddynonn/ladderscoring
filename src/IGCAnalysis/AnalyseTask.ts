//given the igc data and task returns speed, distance flown
//Also calculates data on individual thermals

import {IGCParserNS}  from "igc-parser-cf"
import IGCFlight, { ThermalInfo } from "./IGCFlight";
import IGCUtilities, { DistanceBearing } from "./IGCUtilities";

import {TaskModel,  emptyTaskPoint } from "../models/TaskModel";
import { DistanceCalcs, LatLong, Line } from "../calcs/DistanceCalcsTS";
import{ITaskPoint} from "../models/ITaskPoint";
import {ISector, Sector} from "../models/Sector";
import { IWind } from "..";
import { KM2NM, METRE2FOOT } from "../Globals";
import { isIntersect } from "../lib/Utility";
import { Log, LogAssert } from "../services/Logging";


interface SectorLimits {
    max: number;
    min: number;
}

interface AssessmentResult {
    completed: boolean;
    landout: boolean;
    landoutposition: LatLong | null | undefined;
    landouttime: string | undefined;
    npoints: number;
    turnIndices: number[];
    totalScoreDistance: number;
    legScoreDistances: number[];        // per leg
    bestPoint: number;
    timeTaken: number;
    thermalResult: IThermalResult;
}

 interface IThermalResult {
    circleTime: number;
    heightGain: number;
    windInfo: IWind;
}
class AnalyseTask {

    constructor() { }

    private static emptyAssessment: AssessmentResult = 
    { completed: false, landout: false, landoutposition: null, landouttime: undefined, timeTaken: 0, npoints: 0, turnIndices: [], totalScoreDistance: 0, legScoreDistances: [], bestPoint: 0,
    thermalResult: {circleTime:0,heightGain:0, windInfo: {winddirection:0, windstrength: 0}}
    };

    private static latLongFromTaskPoint(taskpoint: ITaskPoint):LatLong {
        
        return taskpoint.TP ? {Latitude: taskpoint.TP?.Latitude, Longitude:taskpoint.TP?.Longitude} : {Latitude:0 , Longitude:0}
    }

    private static _getSectorLimits(task: TaskModel): SectorLimits[] {
        var heading;
        var bearingOut;
        var bisector;
        var sectorLimits = [];

        if (task !== null) {

            let startPointIndex = 0;
            let finishPointIndex = task.turnpoints.length-1;
            let numLegs = task.turnpoints.length;


            for (let pointindex = startPointIndex; pointindex <= finishPointIndex; pointindex++) {
                let point = task.turnpoints[pointindex];

                let prevPoint = pointindex > startPointIndex ? task.turnpoints[pointindex - 1] : emptyTaskPoint;
                let nextPoint = pointindex < finishPointIndex ? task.turnpoints[pointindex + 1] : emptyTaskPoint;

                let limits: SectorLimits = { max: 0, min: 0 }

                switch (pointindex) {
                    case startPointIndex:   // start zone
                        heading = IGCUtilities.getTrackData(AnalyseTask.latLongFromTaskPoint(point), AnalyseTask.latLongFromTaskPoint(nextPoint)).bearing;
                        limits.max = heading - 90;
                        limits.min = heading + 90;
                        break;

                    case finishPointIndex:   // finish line
                        heading = IGCUtilities.getTrackData(AnalyseTask.latLongFromTaskPoint(prevPoint), AnalyseTask.latLongFromTaskPoint(point)).bearing;
                        limits.max = heading - 90;
                        limits.min = heading + 90;
                        break;
                    default:
                        let leginfo = IGCUtilities.getTrackData(AnalyseTask.latLongFromTaskPoint(point), AnalyseTask.latLongFromTaskPoint(nextPoint));

                        let prevleginfo = IGCUtilities.getTrackData(AnalyseTask.latLongFromTaskPoint(prevPoint), AnalyseTask.latLongFromTaskPoint(point));

                        let sectordef = task.turnpoints[pointindex].sector;
                        if (!sectordef.line) {
                            bearingOut = (leginfo.bearing + 180) % 360;
                            bisector = prevleginfo.bearing + (bearingOut - prevleginfo.bearing) / 2;
                            if (Math.abs(bearingOut - prevleginfo.bearing) < 180) {
                                bisector = (bisector + 180) % 360;
                            }
                            limits.max = bisector + sectordef.angle2;
                            limits.min = bisector - sectordef.angle2;
                        }
                }
                limits.max = (limits.max + 360) % 360;
                limits.min = (limits.min + 360) % 360;
                //Log(`_getSectorLimits: point ${pointindex} (${task.points[pointindex].name} Limits max ${limits.max} Min ${limits.min}`)
                sectorLimits.push(limits);

            }
        }
        Log(`Sector Limits: `, sectorLimits)
        return sectorLimits;

    }

    private static legSize(task: IGCParserNS.Task, legNumber: number): number {
        let dist = 0;
        // task.numTurnpoints excludes start & finish
        if (legNumber > 0 && legNumber <= task.numTurnpoints + 1) {
            dist = IGCUtilities.toPoint(IGCUtilities.latLongFromPoint(task.points[legNumber]), IGCUtilities.latLongFromPoint(task.points[legNumber+1])).distance;
            //Log(`legSize: leg ${legNumber} from ${task.points[legNumber].name} to ${task.points[legNumber+1].name} is ${dist.toFixed(1)}`)
        }
        return dist;
    }
    private static _assessSection(task: TaskModel, flight: IGCFlight, startIndex: number, endIndex: number, sectorLimits: SectorLimits[]): AssessmentResult {

        // Jan 2022 algorithm
 
        var pointindex = startIndex;
        var currentLeg = -1;
        var startIndexLatest: number = 0;
        var distanceToNext: number = 0;
        var status: DistanceBearing;
        var nextstatus: DistanceBearing;

            var scoringDistances: Array<number> = [];
        var bestSoFar = 0;
        var bestIndex = 0;
        var bestLeg = 0;
        var currentDistance;
        var tpindices: Array<number> = [];
        var completed = false;
        var landout = false;
        var landoutLeg = 0;
        var landoutposition: LatLong | null = null;
        let landouttime: string | undefined = undefined;

        var tasktime = 0;

        var igcfile = flight.IGCfile;
        var result: AssessmentResult = this.emptyAssessment;

        var inSector: Array<boolean> = [];
        var TPEntries: Array<Array<number>> = [];

        interface TPDistance { distance: number, index: number };
        var TPDistances: Array<Array<TPDistance>> = [];

        Log(`assessSection from ${startIndex} (${flight.IGCfile.fixes[startIndex].time}) to ${endIndex} (${flight.IGCfile.fixes[endIndex].time})`);

        /* Note that task definition has
         *  [0] = takeoff
         *  [1] = start
         *  [..]= Turnpoints
         *  [n-1] = finish
         *  [n] = landing
         *  numPoints is number of TPs excluding start & finish
         *  So on Leg n, the target TP is [n+1]
         *  
         *  curLeg = -1 initially
         *          0 - in Start Sector
         *          1 - First Leg
         *          ...
         *  
         * sectorLimits[] has sector defs for each point
         *      0 - Start
         *      1 - TP1
         *      
         */

        function checkFinish(status: DistanceBearing, limits: SectorLimits, sector: ISector ) {
            let result = false;
            //Log(`checkFinish: status `, status, ` with sector defn `, sector)
            if (status.distance < sector.radius1) {
                if (sector.angle1===180) {     //it's a ring
                    result= true;
                }
                else {
                    result = IGCUtilities.checkSector(status.bearing, limits);
                }
            }
            return result;
        }

        function validStart(startsector:ISector, flightsegment:Line, startLine: Line):boolean {
            // check whether a departure of the start zone is a valid start
            return startsector.line ? isIntersect(flightsegment,startLine) : true;
        }

        function checkSector(task:TaskModel, leg: number, position: LatLong, time: string): boolean {
            let sectorstatus = false;
            try {
                if (leg > -1 && leg <task.turnpoints.length) {
                    switch (leg) {

                        case 0: {
                            // start sector
                            let status = IGCUtilities.toPoint(AnalyseTask.latLongFromTaskPoint(task.turnpoints[0]), position); //check if in start zone
                            sectorstatus = IGCUtilities.checkSector(status.bearing, sectorLimits[0]) && (status.distance < task.turnpoints[0].sector.radius1); 
                            break;                        
                        }
                        case task.turnpoints.length-1: {
                            //Finish
                            let status = IGCUtilities.toPoint(position, AnalyseTask.latLongFromTaskPoint(task.turnpoints[leg]));
                            sectorstatus = checkFinish(status, sectorLimits[leg], task.turnpoints[leg].sector)
                            break;
                        }
                        default: {
                            // intermediate TP
                            let status = IGCUtilities.toPoint(position, AnalyseTask.latLongFromTaskPoint(task.turnpoints[leg]));
                            sectorstatus = IGCUtilities.inSector(task.turnpoints[leg].sector, status, sectorLimits[leg]);
                            //Log(`${time} : TP${leg} distance: ${status.distance.toFixed(1)} bearing ${status.bearing} sectorlimits ${sectorLimits[leg].min} to ${sectorLimits[leg].max}`)
                            break;
                        }
                    }
                }
            }
        catch (e) {
            Log(`checkSector for leg ${leg}: Exception ${(e as Error).message}`)
            debugger;
        }
            return sectorstatus;
        }

        function getLegSize(leg: number): number {

            let nextLegSize = (leg < task.turnpoints.length) ? 
            IGCUtilities.toPoint(AnalyseTask.latLongFromTaskPoint(task.turnpoints[leg - 1]), AnalyseTask.latLongFromTaskPoint(task.turnpoints[leg])).distance
        :
            0  
            return nextLegSize;
        }
        try {
        // Start of Analysis
            let taskStartTPIndex = 0;
            let numLegs = task.turnpoints.length-1;

            let startPoint = task.turnpoints[taskStartTPIndex];
            const MAX_TPS = 12

            for (let i = 0; i < MAX_TPS; i++) {
                scoringDistances.push(0);
                tpindices.push(0);
                inSector.push(false);
            }

            // make a definition of the start line
            let startPosition:LatLong =  AnalyseTask.latLongFromTaskPoint(startPoint)
            let startLineLength = startPoint.sector.radius1;


            let startlinestart = IGCUtilities.targetPoint(startPosition, startLineLength, sectorLimits[0].max);
            let startlineend = IGCUtilities.targetPoint(startPosition, startLineLength, sectorLimits[0].min);
            let startLine:Line={
                Start:  startlinestart,
                End: startlineend,
            }

            // this version allows for a restart from any leg except the last....

            let lastDetectedStart = 0;
            let currentLegSize = 0;     // once we are task, the length of the current leg...

            do {
                // Set up whether we are in zones
                let position = IGCUtilities.latLongFromFix(igcfile.fixes[pointindex]);
                let time = igcfile.fixes[pointindex].time;

                let inStart = checkSector(task, 0, position, time);
                let inTarget = (currentLeg > 0) ? checkSector(task, currentLeg,  position, time) : false;
                let inTP1 = checkSector(task, 1,  position, time);
                

                if (currentLeg > 0) {
                    // we have started...
                    if (inStart) {
                        if (!inSector[0]) Log(`AnalyseTask: Reentered Start Zone from leg ${currentLeg} at index ${pointindex},  time ${time}, BSF=${bestSoFar.toFixed(1)},  DTN=${distanceToNext.toFixed(1)}`)
                        inSector[0]=true;
                        if (currentLeg===1) {
                            // back in the start sector whilst on the first leg, restarting
                             currentLeg=0;
                        }
                    }
                    else {
                        // have we just left the start zone?
                        if (inSector[0]) {
                        // we've just left the start sector, save for a possible restart
                        Log(`AnalyseTask: Saving possible restart from leg ${currentLeg} at index ${pointindex},  time ${time}, `)
                        inSector[0]=false;
                        lastDetectedStart=pointindex;
                        }
                    }

                    if (inTarget) {
                        // we've reached the current target TP
                        Log(`AnalyseTask: Turned TP${currentLeg} at index ${pointindex},  time ${time}, BSF=${bestSoFar.toFixed(1)},  DTN=${distanceToNext.toFixed(1)}`)

                        bestSoFar = distanceToNext;
                        bestIndex = pointindex;
                        tpindices[currentLeg] = pointindex
                        // and we can't now be restarting
                        lastDetectedStart=0;
                        
                        scoringDistances[currentLeg] = (task.turnpoints[currentLeg].legDistance ?? 0);


                        if (currentLeg===numLegs) {
                            // we've finished!
                            Log(`AnalyseTask: Completed at index ${pointindex},  time ${time}, BSF=${bestSoFar.toFixed(1)},  DTN=${distanceToNext.toFixed(1)}`)
                            completed=true;
                        }
                        currentLeg++;
                        currentLegSize =  getLegSize(currentLeg);
                        distanceToNext += currentLegSize;                        
                        Log(`AnalyseTask: Now on Leg ${currentLeg} of ${numLegs} `)
                        
                    }

                    else if (inTP1) {
                        // we are in TP1 - are we restarting?
                        if (lastDetectedStart !== 0) {
                            // yep, it's a restart
                            Log(`AnalyseTask: Restarting from leg ${currentLeg} at index ${pointindex},  time ${time}`);
                             startIndexLatest = lastDetectedStart;
                             tpindices[0] = lastDetectedStart;
                             tpindices[1] = pointindex;     // and we are in TP1
                             lastDetectedStart = 0;     // so we don't repeat this section
                             currentLeg=2;
                        }
                    }
                    // just on the leg - update distances
                    nextstatus = (currentLeg < task.turnpoints.length) ?
                        IGCUtilities.toPoint(position, AnalyseTask.latLongFromTaskPoint(task.turnpoints[currentLeg]))
                        :
                        { bearing: 0, distance: 0 };        // no next TP - we've finished...

                    // currentDistance is how far we have come on task so far
                    // distancethisleg is how far we have come up the current leg

                    currentDistance = distanceToNext - nextstatus.distance;
                    if (!completed && currentLeg>0) {

                        let distancethisleg = currentLegSize - nextstatus.distance;
                        scoringDistances[currentLeg] = Math.max(scoringDistances[currentLeg], distancethisleg);

                        if (currentDistance > bestSoFar) {
                            bestSoFar = currentDistance;
                            bestIndex = pointindex;
                            bestLeg = currentLeg;
                        }
                    }
                }

                else {
                    // we haven't yet started....
                    if (inStart) {
                        inSector[0] = true; // now in the start sector
                        currentLeg = 0;
                    }
                    else if (inSector[0]===true) {
                        // just left the start sector
                        inSector[0]=false;
                        let flightSegment:Line = {
                            Start: IGCUtilities.latLongFromFix(igcfile.fixes[pointindex-2]),
                            End: IGCUtilities.latLongFromFix(igcfile.fixes[pointindex+2])
                        }                                
                        if (validStart(startPoint.sector, flightSegment, startLine)) {
                            startIndexLatest = pointindex;       // this is our latest recorded start
                            tpindices[0] = startIndexLatest;
                            currentLeg = 1; //we're now on the first leg
                            currentLegSize = getLegSize(currentLeg);
                            distanceToNext = currentLegSize;
                            Log(`AnalyseTask: Started at index ${pointindex}, time ${time}, distance to ${task.turnpoints[taskStartTPIndex + 1].TP?.Trigraph}=${distanceToNext.toFixed(1)}`);
                 
                        }
                    }
                }

                pointindex++;
            }
            while ((pointindex < endIndex) && !completed)

            // now work out how we did...
            if (bestSoFar === 0) { //allow for crossing start line then going backwards
                currentLeg = 0;
            }

            if ((bestLeg === currentLeg) && (currentLeg < numLegs)) { //ignore this if the best distance was at the last TP, don't bother if finished
                bestSoFar = distanceToNext - IGCUtilities.getTrackData(IGCUtilities.latLongFromFix(igcfile.fixes[bestIndex]),
                    AnalyseTask.latLongFromTaskPoint(task.turnpoints[currentLeg])).distance; //recalculate using ellipsoid model
            }
            if (bestLeg > currentLeg) {
                currentLeg = bestLeg;
            }


            
            if (completed) {
                tasktime = Math.max((igcfile.fixes[tpindices[numLegs]].timestamp - igcfile.fixes[startIndexLatest].timestamp) / 1000,0);
                Log(`AnalyseTask: Task completed in ${tasktime} seconds, distance=${bestSoFar.toFixed(1)}`);
            }
            else {
                // if not completed, must be a landout
                landout=true;
                landoutposition = IGCUtilities.latLongFromFix(igcfile.fixes[bestIndex]);
                landouttime = igcfile.fixes[bestIndex].time
                tasktime = Math.max((igcfile.fixes[bestIndex].timestamp - igcfile.fixes[startIndexLatest].timestamp) / 1000,0);
                Log(`AnalyseTask: Landout on leg ${bestLeg}, position ${igcfile.fixes[bestIndex].latitude.toFixed(3)}, ${igcfile.fixes[bestIndex].longitude.toFixed(3)}, index ${bestIndex}, time ${igcfile.fixes[bestIndex].time}, total distance=${bestSoFar.toFixed(1)} `);
                }
            }
            catch(e){
                Log(` Exception in _assessSection: ${(e as Error).message}`)
            }
        return {
            completed: completed,
            landout: landout,
            landoutposition: landoutposition,
            landouttime: landouttime,
            npoints: currentLeg,
            turnIndices: tpindices,
            legScoreDistances: scoringDistances,
            totalScoreDistance: bestSoFar,
            bestPoint: bestIndex,
            timeTaken: tasktime,            
            thermalResult: this.getThermalCount(flight,startIndexLatest, endIndex)
        };

    }

    static assessTask(flight: IGCFlight, task: TaskModel) {
            var assessment: AssessmentResult = this.emptyAssessment;
            var tempAssess;
            var bestLength = 0;
            var i;
        let sectorLimits = this._getSectorLimits(task);
            Log(`AssessTask: glidingRuns: `, flight.glidingRuns, `engineRuns: `, flight.engineRunList)
            if ( (flight.engineRunList.length === 0)) {
                assessment = this._assessSection(task, flight, flight.getTakeOffIndex(), flight.getStoppedIndex(), sectorLimits);
            }
            else {
                for (i = 0; i < flight.glidingRuns.start.length; i++) {
                    tempAssess = AnalyseTask._assessSection(task, flight, flight.glidingRuns.start[i], flight.glidingRuns.end[i], sectorLimits);
                    if (tempAssess.totalScoreDistance > bestLength) {
                        bestLength = tempAssess.totalScoreDistance;
                        assessment = tempAssess;
                    }
                }
            }
            return assessment;
        }

    static getThermalCount(flight:IGCFlight, startIndex: number, endIndex: number): IThermalResult {
            let i = startIndex;            
            let thermalData:ThermalInfo;
            let circleTime = 0;
            let thermalClimb = 0;
            let thermalCount = 0;
            let thisClimbTime: number=0;
            let windInfo:IWind;

            do {
                do {
                    i++;
                }
                while ((Math.abs(flight.turnRate[i]) < 6) && (i < endIndex));
                if (i < endIndex) {

                    thermalData = flight.getThermalInfo(i);
                    thisClimbTime = (flight.IGCfile.fixes[thermalData.exitIndex].timestamp - flight.IGCfile.fixes[thermalData.entryIndex].timestamp) / 1000;

                    if (thisClimbTime > 30) {
                        circleTime += thisClimbTime;
                        if (flight.takeOff.pressure === null) {
                            thermalClimb += ((flight.IGCfile.fixes[thermalData.exitIndex].gpsAltitude ?? 0) - (flight.IGCfile.fixes[thermalData.entryIndex].gpsAltitude ?? 0));
                        }
                        else {
                            thermalClimb += ((flight.IGCfile.fixes[thermalData.exitIndex].pressureAltitude?? 0) - (flight.IGCfile.fixes[thermalData.entryIndex].pressureAltitude ?? 0));
                        }
                        // Log(`getThermmalCount: thermal at ${i},  from ${flight.IGCfile.fixes[thermalData.entryIndex].time} to ${flight.IGCfile.fixes[thermalData.exitIndex].time}, 
                        //     (${thisClimbTime} seconds), total climb now ${thermalClimb}`)

                        thermalCount++;
                    }
                    i = thermalData.exitIndex;
                }
            }
            while (i < endIndex);
            windInfo = AnalyseTask.getWindInfo(flight, startIndex, endIndex);
            //Log(`getThermalCount: found ${thermalCount} thermals, circling time ${circleTime} sec, Height Gain ${(thermalClimb*METRE2FOOT).toFixed(0)} ft`)
            //Log(`Average Climb ${((thermalClimb/circleTime)*1.9426025694).toFixed(1)} kt`)

            return {
                circleTime: circleTime,
                heightGain: thermalClimb,
                windInfo: windInfo
            };
        }

        static getWindInfo(flight: IGCFlight, thermalStart: number, thermalEnd: number):IWind {

            function getVectors(index: number) { //Private function.  Gets x and y vectors to next fix point
                //Use Pythagoras, as distances are small, and we're doing lots of calculations
                var EARTHRAD = IGCUtilities.getEarthSize();
                
                var x = (flight.IGCfile.fixes[index + 1].longitude - flight.IGCfile.fixes[index].longitude) * Math.cos(Math.PI * (flight.IGCfile.fixes[index + 1].latitude + flight.IGCfile.fixes[index].latitude) / 360);
                var y = (flight.IGCfile.fixes[index + 1].latitude - flight.IGCfile.fixes[index].latitude);

                var vectorY = 1000 * y * Math.PI * EARTHRAD / 180 / ((flight.IGCfile.fixes[index + 1].timestamp - flight.IGCfile.fixes[index].timestamp)/1000);
                var vectorX = 1000* x * Math.PI * EARTHRAD / 180 / ((flight.IGCfile.fixes[index + 1].timestamp - flight.IGCfile.fixes[index].timestamp)/1000);
                return {
                    xVector: vectorX,
                    yVector: vectorY
                };
            }
            var xVectors = [];
            var yVectors = [];
            var cuSumX = 0;
            var cuSumY = 0;
            var vectors;
            var xMean;
            var yMean;
            var i = thermalStart;
            do {
                if (Math.abs(flight.turnRate[i]) > 6) {
                    vectors = getVectors(i);
                    xVectors.push(vectors.xVector);
                    cuSumX += vectors.xVector;
                    yVectors.push(vectors.yVector);
                    cuSumY += vectors.yVector;
                }
                i++;
            }
            while (i < thermalEnd);
            xMean = cuSumX / xVectors.length;
            yMean = cuSumY / yVectors.length;
            // We now have an array of vectors for all fix points in the thermal
            //If we assume constant airspeed and constant wind speed these should plot into a circle.
            //The vector from the origin to the circle centre represents wind speed and direction
            //So we now perform a regression analysis to find it
            var circleData = IGCUtilities.kasaRegress(xVectors, yVectors, xMean, yMean);
            //Log(`getWindInfo: Speed ${(3.6 * circleData.magnitude).toFixed(1)}, direction ${circleData.direction.toFixed(0)}`)
            return {
                windstrength: 3.6 * circleData.magnitude * KM2NM,
                winddirection: circleData.direction
            };
        }
    }
export {AnalyseTask, AssessmentResult,IThermalResult}