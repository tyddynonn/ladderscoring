//given the igc data and task returns speed, distance flown
//Also calculates data on individual thermals

import * as IGCParser from "glana-igc-parser"
import IGCFlight, { ThermalInfo } from "./IGCFlight";
import IGCUtilities, { DistanceBearing } from "./IGCUtilities";

import {TaskModel,  emptyTaskPoint } from "../models/TaskModel";
import { DistanceCalcs, LatLong, Line } from "../calcs/DistanceCalcsTS";
import{ITaskPoint} from "../models/ITaskPoint";
import {Sector} from "../models/Sector";
import { IWind } from "..";
import { KM2NM, METRE2FOOT } from "../Globals";
import { isIntersect } from "../lib/Utility";


interface SectorLimits {
    max: number;
    min: number;
}

interface AssessmentResult {
    completed: boolean;
    landout: boolean;
    landoutposition: LatLong | null | undefined;
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
    { completed: false, landout: false, landoutposition: null, timeTaken: 0, npoints: 0, turnIndices: [], totalScoreDistance: 0, legScoreDistances: [], bestPoint: 0,
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
                            limits.max = bisector + sectordef.angle2/ 2;
                            limits.min = bisector - sectordef.angle2/ 2;
                        }
                }
                limits.max = (limits.max + 360) % 360;
                limits.min = (limits.min + 360) % 360;
                //console.log(`_getSectorLimits: point ${pointindex} (${task.points[pointindex].name} Limits max ${limits.max} Min ${limits.min}`)
                sectorLimits.push(limits);

            }
        }
        return sectorLimits;

    }

    private static legSize(task: IGCParser.Task, legNumber: number): number {
        let dist = 0;
        // task.numTurnpoints excludes start & finish
        if (legNumber > 0 && legNumber <= task.numTurnpoints + 1) {
            dist = IGCUtilities.toPoint(IGCUtilities.latLongFromPoint(task.points[legNumber]), IGCUtilities.latLongFromPoint(task.points[legNumber+1])).distance;
            //console.log(`legSize for leg ${legNumber} from ${task.points[legNumber].name} to ${task.points[legNumber+1].name} is ${dist.toFixed(1)}`)
        }
        return dist;
    }
    private static _assessSection(task: TaskModel, flight: IGCFlight, startIndex: number, endIndex: number, sectorLimits: SectorLimits[]): AssessmentResult {
        var pointindex = startIndex;
        var curLeg = -1;
        var startstatus: DistanceBearing;
        var startIndexLatest: number = 0;
        var distanceToNext: number = 0;
        var status: DistanceBearing;
        var nextstatus: DistanceBearing;

        var turned = false;
        var scoringDistances: Array<number> = [];
        var bestSoFar = 0;
        var bestIndex = 0;
        var bestLeg = 0;
        var currentDistance;
        var tpindices: Array<number> = [];
        var completed = true;
        var landout = false;
        var landoutLeg = 0;
        var landoutposition: LatLong | null = null;

        var tasktime = 0;

        var igcfile = flight.IGCfile;
        var result: AssessmentResult = this.emptyAssessment;

        var inSector: Array<boolean> = [];
        var TPEntries: Array<Array<number>> = [];

        interface TPDistance { distance: number, index: number };
        var TPDistances: Array<Array<TPDistance>> = [];



        //console.log(`assessSection from ${startIndex} to ${endIndex}`);

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

        function checkFinish(status: DistanceBearing, limits: SectorLimits, sector: Sector ) {
            if (status.distance < sector.radius1) {
                if (sector.angle1===180) {     //it's a ring
                    return true;
                }
                else {
                    return (IGCUtilities.checkSector(status.bearing, limits));
                }
            }
            else {
                return false;
            }
        }

        function validStart(startsector:Sector, flightsegment:Line):boolean {
            // check whether a departure of the start zone is a valid start
            return startsector.line ? isIntersect(flightsegment,startLine) : true;
        }
            let taskStartTPIndex = 0;
            let startPoint = task.turnpoints[taskStartTPIndex];
  
            let numLegs = task.turnpoints.length-1;

            const MAX_TPS = 12

            let legdistances = []
            for (let i = 0; i < MAX_TPS; i++) {
                legdistances.push({ distance: 9999, index: 0 })
                scoringDistances.push(0);
            }

            for (var xx = 0; xx < MAX_TPS; xx++) {
                tpindices.push(0);
                inSector.push(false);
                TPEntries.push([]);
                // set up the TPDistances arrays...TPDistance[n] has an array by Leg of [{distance, index}] 
                TPDistances.push(legdistances);
            }
            // make a defintion of the start line
            let startPosition:LatLong =  AnalyseTask.latLongFromTaskPoint(task.turnpoints[0])
            let startLineLength = task.turnpoints[0].sector.radius1;

            let start = IGCUtilities.targetPoint(startPosition, startLineLength, sectorLimits[0].max);
            let end = IGCUtilities.targetPoint(startPosition, startLineLength, sectorLimits[0].min);
            let startLine:Line={
                Start:  start,
                End: end,
                }

                // this version allows for a restart from any leg except the last....
                do {
                    if (curLeg < numLegs)    {   // not on last leg...
                        // are we in the Start Zone?
                        startstatus = IGCUtilities.toPoint(AnalyseTask.latLongFromTaskPoint(task.turnpoints[0]), IGCUtilities.latLongFromFix(igcfile.fixes[pointindex])); //check if in start zone
                        if ((IGCUtilities.checkSector(startstatus.bearing, sectorLimits[0])) && (startstatus.distance < task.turnpoints[0].sector.radius1))                       
                        {
                            if (!inSector[0]) {
                                //console.log(`Entered Start zone at index ${pointindex}, leg ${curLeg}/${numLegs}, time ${flight.IGCfile.fixes[pointindex].time}`);
                            }
                            inSector[0] = true;
                        }
                        else {
                            if (inSector[0]) {
                                // we were in the start zone and now aren't...
                                inSector[0]=false;

                                // here we need to check if the departure was by crossing the start line...
                                let flightSegment:Line = {
                                    Start: IGCUtilities.latLongFromFix(igcfile.fixes[pointindex-2]),
                                    End: IGCUtilities.latLongFromFix(igcfile.fixes[pointindex+2])
                                }                                
                                //console.log(`Check for Start at index ${pointindex}, leg ${curLeg}/${numLegs}, time ${flight.IGCfile.fixes[pointindex].time}`);
                                if (validStart(task.turnpoints[0].sector, flightSegment)) {
                                    curLeg = 1; //we're now on the first leg
                                    startIndexLatest = pointindex; //and this is our latest recorded start
                                    tpindices[0] = startIndexLatest;
                                    //CF220108 - correct for sector sizes
                                    let sectorAdj = (startPoint.sector.line ? 0 : startPoint.sector.radius1) + task.turnpoints[1].sector.radius1;
                                    distanceToNext = IGCUtilities.toPoint(AnalyseTask.latLongFromTaskPoint(startPoint), AnalyseTask.latLongFromTaskPoint(task.turnpoints[1])).distance - sectorAdj;
                                    //console.log(`Started at index ${pointindex}, time ${igcfile.fixes[pointindex].time}, distance to ${task.turnpoints[taskStartTPIndex + 1].TP?.Trigraph}=${distanceToNext.toFixed(1)}`);
                                }
                            }
                        }
                    }
                    if ((curLeg > 0) && (curLeg <= numLegs)) { // if started

                        turned = false;
                        // check if we are in any TP sector...(not including Start)

                        for (let TPIndex = 1; TPIndex < task.turnpoints.length; TPIndex++) {

                            status = IGCUtilities.toPoint(IGCUtilities.latLongFromFix(igcfile.fixes[pointindex]), AnalyseTask.latLongFromTaskPoint(task.turnpoints[TPIndex]));

                            let sectorstatus = false;
                            if (TPIndex === task.turnpoints.length - 1) { // If we are checking the finish...
                                sectorstatus = checkFinish(status, sectorLimits[TPIndex], task.turnpoints[TPIndex].sector)
                            }
                            else {
                                sectorstatus = IGCUtilities.inSector(task.turnpoints[TPIndex].sector, status, sectorLimits[TPIndex]);
                            }
                            if (sectorstatus) {
                                // We are in the sector
                                if (!inSector[TPIndex]) {
                                    // just entered this sector
                                    inSector[TPIndex] = true;
                                    TPEntries[TPIndex].push(pointindex);
                                    TPDistances[TPIndex][curLeg].distance = 0;
                                    TPDistances[TPIndex][curLeg].index = 0;
                                    //console.log(`Entered sector for TP${TPIndex} at index ${pointindex}, time ${igcfile.fixes[pointindex].time}`)
                                    if (TPIndex === curLeg) {
                                        turned = true;
                                    }
                                }
                            }
                            else {
                                inSector[TPIndex] = false; // not in this sector
                            }

                            if (TPDistances[TPIndex][curLeg].distance !== 0) {
                                // check we are now closer to the target TP - if so update info
                                if (status.distance < TPDistances[TPIndex][curLeg].distance) {
                                    TPDistances[TPIndex][curLeg].distance = status.distance;
                                    TPDistances[TPIndex][curLeg].index = pointindex;
                                }
                            }

                            if (TPIndex===curLeg) {
                                // we are checking the current target TP so we can update the Scoring distance..
                                let sd = (task.turnpoints[curLeg].legDistance ?? 0) - status.distance;
                                if (sd > scoringDistances[curLeg]) scoringDistances[curLeg]=sd;
                                //console.log(`ScoringDist on leg ${curLeg} is now ${scoringDistances[curLeg].toFixed(1)}`)
                            }
                        }


                        if (turned) {
                            //console.log(`Turned TP${curLeg} at index ${pointindex},  time ${igcfile.fixes[pointindex].time}, BSF=${bestSoFar.toFixed(1)},  DTN=${distanceToNext.toFixed(1)}`)
                            bestSoFar = distanceToNext;
                            bestIndex = pointindex;
                            tpindices[curLeg] = pointindex;

                            // here we need to take account of the set sector sizes...
                            scoringDistances[curLeg] = (task.turnpoints[curLeg].sectorDistance ?? 0);
                            //scoringDistances[curLeg] = (task.turnpoints[curLeg].legDistance ?? 0);

                            //console.log(`AnalyseTask: Turned on leg ${curLeg} Leg Dist ${task.turnpoints[curLeg].legDistance?.toFixed(1)}, ScoreDistance ${scoringDistances[curLeg].toFixed(1)}`)
                            curLeg++;
                            let nextLegSize = (curLeg < task.turnpoints.length) ? 
                                IGCUtilities.toPoint(AnalyseTask.latLongFromTaskPoint(task.turnpoints[curLeg - 1]), AnalyseTask.latLongFromTaskPoint(task.turnpoints[curLeg])).distance
                                :
                                0                         
                            // here we need to adjust based on sector sizes...

                            let sectoradj = (curLeg < task.turnpoints.length) ?                             
                                    (task.turnpoints[curLeg - 1].sector.line ? 0 : task.turnpoints[curLeg - 1].sector.radius1) 
                                    + 
                                    (task.turnpoints[curLeg].sector.line ? 0: task.turnpoints[curLeg].sector.radius1)
                                :
                                    0

                            distanceToNext += nextLegSize-sectoradj;

                            //console.log(`After turn, curLeg=${curLeg}, BI=${bestIndex}, BSF=${bestSoFar.toFixed(1)},  DTN=${distanceToNext.toFixed(1)}`)
                        }
                        else {
                            nextstatus = (curLeg < task.turnpoints.length) ?
                                IGCUtilities.toPoint(IGCUtilities.latLongFromFix(igcfile.fixes[pointindex]), AnalyseTask.latLongFromTaskPoint(task.turnpoints[curLeg]))
                                :
                                { bearing: 0, distance: 0 };        // no next TP - we've finished...

                            currentDistance = distanceToNext - nextstatus.distance;
                            //console.log(`Index ${pointindex} at ${utils.unixToString(flight.recordTime[pointindex])} not turned, leg ${curLeg} DTN= ${distanceToNext.toFixed(1)}, CD=${currentDistance.toFixed(1)}, Dist to go = ${nextstatus.distance.toFixed(1)}, bestSoFar ${bestSoFar.toFixed(1)}`)

                            if (currentDistance > bestSoFar) {
                                bestSoFar = currentDistance;
                                bestIndex = pointindex;
                                bestLeg = curLeg;
                            }
                        }
                    }
                    pointindex++;
                }
                while (pointindex < endIndex)

                if (bestSoFar === 0) { //allow for crossing start line then going backwards
                    curLeg = 0;
                }
                if ((bestLeg === curLeg) && (curLeg < numLegs)) { //ignore this if the best distance was at the last TP, don't bother if finished
                    bestSoFar = distanceToNext - IGCUtilities.getTrackData(IGCUtilities.latLongFromFix(igcfile.fixes[bestIndex]),
                        AnalyseTask.latLongFromTaskPoint(task.turnpoints[curLeg])).distance; //recalculate using ellipsoid model
                }
                if (bestLeg > curLeg) {
                    curLeg = bestLeg;
                }

                //console.log(`Start at index ${startIndexLatest}`)
                //for (let j = 1; j < task.coords.length; j++) {
                //    console.log(`TP${j} (${task.names[j]}) Entries:`);
                //    if (TPEntries[j].length === 0) {
                //        console.log(`\tNot Entered`);
                //        for (let k = 0; k < TPDistances[j].length; k++) {
                //            console.log(`\t\tClosest approach on leg ${k} was ${TPDistances[j][k].distance.toFixed(1)} at index ${TPDistances[j][k].index}`)

                //        }
                //    }
                //    else {
                //        TPEntries[j].forEach((value, index) => {
                //            console.log(`\tEntered at index ${value}`);
                //        });
                //    }
                //}

                //Analysis:
                // walk the TPEntries Array in order. If each entry has an index entry greater than the previous index, all good
                // If one entry was Not Entered (but the finish was reached), Abandoned
                // if more than one TP not reached, Landout.

     
            let lastTPindex = startIndexLatest;

            let numTPs =   task.turnpoints.length;
            completed = false;
            landout = false;
            landoutposition = null;

            let missedTPs = [];

            lastTPindex = startIndexLatest

            for (let tpindex = 1; tpindex < numTPs; tpindex++) {
                // entries will contain the indices of any sector entries later than the current index, in ascending order
                let entries = TPEntries[tpindex].filter((val) => { return val > lastTPindex }).sort((a, b) => { return a - b });
                if (entries.length > 0) {
                    lastTPindex = entries[0];
                    tpindices[tpindex] = entries[0];       // this fills in tpindices for TPs after a missed TP
                }
                else {
                    missedTPs.push(tpindex);            // we missed this one
                }
            }

            // tpindices now has entry indices for each TP, or zero if not entered
            
            // If no missed TPs, completed
            // if 1 missed TP, landout
            // Abanonment not permitted 

              switch (missedTPs.length) {
                case 0: {
                    completed = true;
                    break;
                }

                default: {
                    // any TPs missed, landout
                    landout = true;
                    landoutLeg = missedTPs[0];
                    break;
                }
            }

            //console.log(`Completed ${completed}, Landout ${landout}, LandoutLeg ${landoutLeg}, Abandoned ${abandoned}, AbandonedLeg ${abandonedleg}`);

            //TPDistances array has closest approaches to TP by leg, zero if actually reached

            tasktime = Math.max((igcfile.fixes[tpindices[task.turnpoints.length - 1]].timestamp - igcfile.fixes[startIndexLatest].timestamp) / 1000,0);
            if (completed) {

                //console.log(`Task completed in ${tasktime} seconds, distance=${bestSoFar.toFixed(1)}`);
            }
            else {
                // if not completed, must be a landout
                    //+console.log(`Landout on leg ${landoutleg} at ${flight.latLong[bestIndex].lat.toFixed(3)}, ${flight.latLong[bestIndex].lng.toFixed(3)}, index ${bestIndex}, total distance=${bestSoFar.toFixed(1)} `);
                    let lastindex = bestIndex;
                    landoutposition = IGCUtilities.latLongFromFix(igcfile.fixes[lastindex])
                    tasktime = Math.max((igcfile.fixes[bestIndex].timestamp - igcfile.fixes[startIndexLatest].timestamp) / 1000,0);
                }

        return {
            completed: completed,
            landout: landout,
            landoutposition: landoutposition,
            npoints: curLeg,
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
                        //console.log(`thermal at ${i},  from ${flight.IGCfile.fixes[thermalData.entryIndex].time} to ${flight.IGCfile.fixes[thermalData.exitIndex].time}, 
                        //    (${thisClimbTime} seconds), total climb now ${thermalClimb}`)

                        thermalCount++;
                    }
                    i = thermalData.exitIndex;
                }
            }
            while (i < endIndex);
            windInfo = AnalyseTask.getWindInfo(flight, startIndex, endIndex);
            //console.log(`getThermalCount: found ${thermalCount} thermals, circling time ${circleTime} sec, Height Gain ${(thermalClimb*METRE2FOOT).toFixed(0)} ft`)
            //console.log(`Average Climb ${((thermalClimb/circleTime)*1.9426025694).toFixed(1)} kt`)

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
                
                //var x = (flight.latLong[index + 1].lng - flight.latLong[index].lng) * Math.cos(Math.PI * (flight.latLong[index + 1].lat + flight.latLong[index].lat) / 360);
                //var y = (flight.latLong[index + 1].lat - flight.latLong[index].lat);
                //var vectorY = 1000 * y * Math.PI * EARTHRAD / 180 / (flight.recordTime[index + 1] - flight.recordTime[index]);
                //var vectorX = 1000 * x * Math.PI * EARTHRAD / 180 / (flight.recordTime[index + 1] - flight.recordTime[index]);



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
            //console.log(`getWindInfo: Speed ${(3.6 * circleData.magnitude).toFixed(1)}, direction ${circleData.direction.toFixed(0)}`)
            return {
                windstrength: 3.6 * circleData.magnitude * KM2NM,
                winddirection: circleData.direction
            };
        }
    }
export {AnalyseTask, AssessmentResult,IThermalResult}