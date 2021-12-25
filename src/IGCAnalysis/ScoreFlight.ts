import IGCParser from "glana-igc-parser"
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

export async function scoreIGC(task: TaskModel, assessment:AssessIGCResult, wind: IWind, gliderHandicap: number):Promise<ScoreIGCResult> {
    
    // here we have to do the sums per leg in case there was a landout. 
    //console.log(`ScoreIGC with assessment `, assessment)
      let hcDistance = 0;
      let legdist = 0;
      assessment.legScoringDistance.forEach((dist, leg) => {
        if (dist > 0) {
            legdist =  DistanceCalcs.legHCdistance(task, leg, dist, wind, gliderHandicap);
            hcDistance += legdist;
            //console.log(`ScoreIGC: Leg${leg} from ${task.turnpoints[leg-1].TP?.Trigraph} to ${task.turnpoints[leg].TP?.Trigraph} dist ${(task.turnpoints[leg].legDistance ?? 0).toFixed(1)}, 
            //hc ${gliderHandicap}, adjDist ${legdist.toFixed(1)}`)
        }
    })
   
    let distpoints = hcDistance *5;
    let hcspeed = hcDistance*3600/assessment.timeTaken;

    let speedpoints = 0;
    if (assessment.taskCompleted && hcDistance> gliderHandicap && hcspeed > 50) {
        speedpoints = (hcspeed-50) * 0.05 * hcDistance;
    }

    let totalpoints = (distpoints + speedpoints) * (assessment.taskCompleted ? 1.1 : 1.0);
    
    let scoreResult:ScoreIGCResult = {
        taskDistance: task.TaskDistance,
        hcDistance:hcDistance,
        scoreDistance: 0,
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

