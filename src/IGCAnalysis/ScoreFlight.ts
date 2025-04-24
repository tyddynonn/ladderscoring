import { DistanceCalcs } from "../calcs/DistanceCalcsTS";
import {IWind} from "../models/IWind"
import {TaskModel} from "../models/TaskModel"
import { AssessIGCResult } from "./AssessIGC"

export interface ScoreIGCResult {
    taskDistance: number;   // the basic task distance
    hcDistance: number;     // the distance after windicapping was applied
    scoreDistance: number;  // the scoring distance (=hcDistance if completed)
    completed: boolean;
    taskTime: number;       // time on task in seconds
    hcSpeed: number;        // handicapped speed over the task
    distancePoints: number;
    speedPoints: number;
    penaltyPoints: number;  // can be set externally
    penaltyNotes?: string
    totalPoints: number;
    errors: string[];
}

import { IScoringConfig } from "../models/IScoringConfig";
import { Log } from "../services/Logging";

export async function scoreIGC(task: TaskModel, assessment:AssessIGCResult, wind: IWind, gliderHandicap: number, config: IScoringConfig):Promise<ScoreIGCResult | undefined> {
    
    // here we have to do the sums per leg in case there was a landout. 
    let scoreDistance = 0;
    let hcDistance = 0;
    let legdist = 0;
    
    Log(`scoreIGC for Task ${task.description} with hc ${gliderHandicap} and UseTaskDistance ${config.UseTaskDistance} with assessment `, assessment)

        // if the config is to use sector distances (config.UseTaskDistance=false) then we need to reduce the totalScoringDistance in the assessment by the appropriate amount for each reached TP
        // note the legScoringDistance array is not corrected for sector sizes...

    try {
        let totalScoreDistanceAdj = 0;
        assessment.legScoringDistance.forEach((dist, leg) => {
        if (dist > 0) {
            // if using sectors
            //      correct the legScoringdistance back to the LegDistance by subtracting the sector sizes
            //      (can't use the task.LegDistanceSectors in case the leg wasn't completed)
            // then 
            //  use the legScoringDistance to do the windicapping
            //  sum the legScoringDistances to get the totalScoringDistance and put this into the assessment
            
            if (!config.UseTaskDistance) {
                Log (`scoreIGC: correcting sector adjusment for leg ${leg}`)
                // correct the legScoringDistance to use the defined sectors:
                // we must have rounded the previous TP (as dist >0 )  , but might not have reached the next
                let adj = task.turnpoints[leg-1].sector.line ? 0 : task.turnpoints[leg-1].sector.radius1;
                if (assessment.TPTimes[leg]) {
                    // reached the next one too
                    adj += task.turnpoints[leg].sector.line ? 0 : task.turnpoints[leg].sector.radius1;
                }
                dist = dist - adj;
                Log (`scoreIGC: corrected distance is  ${dist.toFixed(1)}`)
            }


            totalScoreDistanceAdj += dist;       
            legdist =  DistanceCalcs.legHCdistance(task, leg, dist, wind, gliderHandicap);
            hcDistance += legdist;
            scoreDistance +=dist;

            // Log      (`
            //         Leg ${leg} from ${task.turnpoints[leg-1].TP?.Trigraph} to ${task.turnpoints[leg].TP?.Trigraph} 
            //         dist ${(task.turnpoints[leg].legDistance ?? 0).toFixed(1)},
            //         sectDist ${(task.turnpoints[leg].sectorDistance ?? 0).toFixed(1)},               
            //         hc Distance ${legdist.toFixed(1)}`)
        }
        })
        // correct the value returned in the Assessment...
        assessment.totalScoringDistance = totalScoreDistanceAdj;
        
        let hcspeed = assessment.timeTaken > 0 ? hcDistance*3600/assessment.timeTaken : 0;

        let score = doScore(config, gliderHandicap, hcDistance, hcspeed,assessment.taskCompleted)
                
        let scoreResult:ScoreIGCResult = {
            taskDistance: task.TaskDistance,
            hcDistance:hcDistance,
            scoreDistance: scoreDistance,
            completed: assessment.taskCompleted,
            taskTime: assessment.timeTaken,
            hcSpeed: hcspeed,
            distancePoints: score.DistancePoints ?? 0,
            speedPoints:score.SpeedPoints ?? 0,
            penaltyPoints:0,
            totalPoints: score.TotalPoints ?? 0,
            errors: []
        }

        Log(`Scoring result is `, scoreResult)
        return scoreResult;
    }
    catch (e) {
        Log(`scoreIGC exception: ${(e as Error).message}`) 
        return undefined;       
        }
}
export interface IPoints {
    SpeedPoints?: number
    DistancePoints?: number
    PenaltyPoints?: number
    TotalPoints?:number
}
export function doScore(config:IScoringConfig, gliderHandicap: number, hcdistance:number, hcspeed: number, completed:boolean): IPoints {

    const distpoints = config.SpeedOnly ? 0 : (hcdistance * config.DistancePoints);
    let speedpoints = 0;

    if ((hcspeed>config.MinimumSpeed)
        &&
        (config.UseMinDistance ? (hcdistance> gliderHandicap):true)
        &&
        (config.CompleteForSpeed ? completed: true)
        ) {
            speedpoints = Math.max( ((hcspeed-config.MinimumSpeed) * config.SpeedPoints * hcdistance),0);
        }
    let totalpoints = (distpoints + speedpoints) * (completed ? config.CompletionFactor : 1.0) ;

    return {SpeedPoints: speedpoints, DistancePoints: distpoints, TotalPoints: totalpoints}

}