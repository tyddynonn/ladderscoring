
import IGCParser from "glana-igc-parser";
import {DateTime} from 'luxon';

import { LatLong } from "../calcs/DistanceCalcsTS";
import {ITurnPoint} from "../models/ITurnPoint";
import { TaskModel} from "../models/TaskModel";
import { AnalyseTask,  AssessmentResult } from "./AnalyseTask";
import IGCFlight, { defaultENLPref } from "./IGCFlight";
import IGCUtilities from "./IGCUtilities";

export interface ITaskTP {
    taskIndex: number;
    calcIndex: number;
    coords: LatLong;
    name: string | null;
    tp: ITurnPoint;
    reached: boolean;
}

export interface AssessIGCResult {

    flightDate: Date | null;
    loggerFlightDate: Date | null;
    flightLoaded: boolean,

    taskCompleted: boolean,
    legScoringDistance: number[],      // this is per leg....
    totalScoringDistance: number;
    speed: number,

    gpsLandout: boolean,
    landoutPosition: ITurnPoint | null;
    usedTPs: ITaskTP[],
    missingTPs: ITaskTP[],
    TPTimes: string[],
    StartTime: string | undefined,
    FinishTime: string | undefined,
    LandingTime: string | undefined,

    secondPilot: string |null ,
    gliderReg: string,
    gliderType: string | null
    timeTaken: number;
    heightLoss: number;
    assessment: AssessmentResult | null,
    flightException: boolean,
    errorArray: string[],

}

export async function assessIGC(igcfile: IGCParser.IGCFile, task:TaskModel): Promise<AssessIGCResult> {

    let assessResult: AssessIGCResult = {
        errorArray: [],
        usedTPs:  [],
        missingTPs: [],

        taskCompleted: false,
        totalScoringDistance: 0,
        legScoringDistance: [],
        speed:0,

        flightException: false,
        flightLoaded: false,
        gpsLandout: false,
        landoutPosition: null,
        loggerFlightDate: new Date(),
        flightDate: new Date(),
        secondPilot: null,
        gliderReg: '',
        gliderType: null,
        timeTaken: 0,
        heightLoss: 0,
        StartTime: undefined,
        FinishTime: undefined,
        LandingTime: undefined,
        TPTimes: [],
        assessment: null,
    }
        
        async function analyseflight(igcflight:IGCFlight, task:TaskModel ):Promise<AssessmentResult> {
        // does the analysis of an IGCFlight instance
            return AnalyseTask.assessTask(igcflight, task)
        }   // analysefight...

        try {
            let igcflight = new IGCFlight(igcfile);
            igcflight.getEngineRuns(defaultENLPref);

            let fDate = DateTime.fromISO(igcfile.date);

            assessResult.loggerFlightDate = fDate.toJSDate();
            assessResult.flightLoaded = true;
            // CF190415 - extract Crew Member 2 if present

            if (igcfile.copilot !== null) {
                assessResult.secondPilot = igcfile.copilot;
            }
            assessResult.gliderReg = igcfile.registration ?? '';

            assessResult.gliderType = igcfile.gliderType;

            assessResult.flightDate = assessResult.loggerFlightDate;
            let analysis = await analyseflight(igcflight, task);
            assessResult.assessment=analysis;
            
            // fill in TP times
            analysis.turnIndices.forEach(tpindex=>{
                if (tpindex!==0) {
                    assessResult.TPTimes.push(igcfile.fixes[tpindex].time);
                }
            })
            assessResult.StartTime = assessResult.TPTimes[0];

            var taskcompleted = analysis.completed;
            assessResult.timeTaken = analysis.timeTaken;
            assessResult.legScoringDistance = analysis.legScoreDistances;
            
            if (taskcompleted) { 
                    // task was completed
                assessResult.taskCompleted = true;
                //** the dist should depened on whether we are using task dist or sector dist */
                let dist = task.TaskDistance;                
                assessResult.totalScoringDistance = dist;
                assessResult.speed = dist*3600/analysis.timeTaken;
                assessResult.FinishTime = assessResult.TPTimes[task.turnpoints.length-1]
                }
            else {
                // Landout....
                assessResult.gpsLandout = true;
                assessResult.totalScoringDistance=analysis.totalScoreDistance;
                assessResult.speed = analysis.totalScoreDistance*3600/analysis.timeTaken;
                assessResult.LandingTime = igcfile.fixes[analysis.bestPoint].time;


                if (analysis.npoints > 0) {
                    //let taskEndIndex = analysis.assessment.bestPoint;
                    let landoutPosition = IGCUtilities.latLongFromFix(igcfile.fixes[analysis.bestPoint]);
                    assessResult.landoutPosition =
                    {
                        Trigraph: 'LLL',
                        Name: 'LandedPosition',
                        Latitude: landoutPosition.Latitude,
                        Longitude: landoutPosition.Longitude
                    };                                   
                }
            }
        }

        catch (ex) {
            assessResult.flightException = true;

            assessResult.errorArray.push((ex as any).message);
        }
        finally {
            return assessResult;
        }   // finally
}