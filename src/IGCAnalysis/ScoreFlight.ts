
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
    totalPoints: number;
    errors: string[];
}

import { IScoringConfig } from "../models/IScoringConfig";

export async function scoreIGC(task: TaskModel, assessment:AssessIGCResult, wind: IWind, gliderHandicap: number, config: IScoringConfig):Promise<ScoreIGCResult> {
    
    // here we have to do the sums per leg in case there was a landout. 
    //console.log(`ScoreIGC with assessment `, assessment)
    let scoreDistance = 0;
    let hcDistance = 0;
    let legdist = 0;
    




    //console.log(`scoreIGC for Task ${task.description} with hc ${gliderHandicap} and UseTaskDistance ${config.UseTaskDistance} `)

        // if the config is to use sector distances (config.UseTaskDistance=false) then we need to reduce the totalScoringDistance in the assessment by the appropriate amount for each reached TP
        // note the legScoringDistance array is already corrected for sector sizes...
    let totalScoreDistanceAdj = 0;
    assessment.legScoringDistance.forEach((dist, leg) => {
    if (dist > 0) {
        // if not using sectors
        //      correct the legScoringdistance back to the LegDistance by adding in the sector sizes
        //      (can't use the task.LegDistanceSectors in case the leg wasn't completed)
        // then 
        //  use the legScoringDistance to do the windicapping
        //  sum the legScoringDistances to get the totalScoringDistance and put this into the assessment
        
        if (config.UseTaskDistance) {
            // correct the legScoringDistance to use the defined sectors:
            // we must have rounded the previous TP (as dist >0 )  , but might not have reached the next
            let adj = task.turnpoints[leg-1].sector.line ? 0 : task.turnpoints[leg-1].sector.radius1;
            if (assessment.TPTimes[leg]) {
                // reached the next one too
                adj += task.turnpoints[leg].sector.line ? 0 : task.turnpoints[leg].sector.radius1;
            }
            dist = dist + adj;
        }

        totalScoreDistanceAdj += dist;       
        legdist =  DistanceCalcs.legHCdistance(task, leg, dist, wind, gliderHandicap);
        hcDistance += legdist;
        scoreDistance +=dist;

        // console.log(`
        //         Leg ${leg} from ${task.turnpoints[leg-1].TP?.Trigraph} to ${task.turnpoints[leg].TP?.Trigraph} 
        //         dist ${(task.turnpoints[leg].legDistance ?? 0).toFixed(1)},
        //         sectDist ${(task.turnpoints[leg].sectorDistance ?? 0).toFixed(1)},               
        //         hc Distance ${legdist.toFixed(1)}`)
    }
    })
    // correct the value returned in the Assessment...
    assessment.totalScoringDistance = totalScoreDistanceAdj;

    //console.log(`totalScoreDistanceAdj=${totalScoreDistanceAdj.toFixed(1)}`)
    let distpoints = hcDistance * config.DistancePoints;
    let hcspeed = assessment.timeTaken > 0 ? hcDistance*3600/assessment.timeTaken : 0;

    let speedpoints = 0;

    if ((hcspeed>config.MinimumSpeed)
        &&
        (config.UseMinDistance ? (hcDistance> gliderHandicap):true)
        &&
        (config.CompleteForSpeed ? assessment.taskCompleted : true)
        ) {
            speedpoints = Math.max( ((hcspeed-config.MinimumSpeed) * config.SpeedPoints * hcDistance),0);
        }

    let totalpoints = (distpoints + speedpoints) * (assessment.taskCompleted ? config.CompletionFactor : 1.0);
    
    let scoreResult:ScoreIGCResult = {
        taskDistance: task.TaskDistance,
        hcDistance:hcDistance,
        scoreDistance: scoreDistance,
        completed: assessment.taskCompleted,
        taskTime: assessment.timeTaken,
        hcSpeed: hcspeed,
        distancePoints: distpoints,
        speedPoints:speedpoints,
        totalPoints: totalpoints,
        errors: []
    }

    return scoreResult;

}

