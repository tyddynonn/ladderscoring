// Library to manage IGC files and score by TSC rules

import IGCParser from "igc-parser";

import {assessIGC,  AssessIGCResult } from "./IGCAnalysis/AssessIGC";
import {scoreIGC, ScoreIGCResult} from "./IGCAnalysis/ScoreFlight";
import { IScoringConfig } from "./models/IScoringConfig";

import {IWind} from './models/IWind'
import {TaskModel} from "./models/TaskModel";



// Interfaces required:

// loadFlight - load a logger file & parse using IGCParser, return a IGCFile object
// assessFlight - determine whether the loaded flight went round the supplied task (which includes the sector defs)
// scoreFlight - score the flight using a defined handicap (including windicapping)

const loadFlight = (flt: string | string[], lenient: boolean=false):IGCParser.IGCFile => {    
    let file = Array.isArray(flt) ? flt.join('\n') : flt;
    return IGCParser.parse(file, {lenient: lenient});
}
const assessFlight = async (igcflight: IGCParser.IGCFile, task:TaskModel): Promise<AssessIGCResult> => {
    return assessIGC(igcflight, task);
}

const scoreFlight = async (task: TaskModel, assessment: AssessIGCResult,  wind: IWind, gliderHandicap: number, config:IScoringConfig): Promise<ScoreIGCResult | undefined> => {
    return scoreIGC(task,assessment, wind, gliderHandicap, config)
    }

export {loadFlight, assessFlight, scoreFlight, TaskModel}

export {AssessIGCResult} from "./IGCAnalysis/AssessIGC";
export {ScoreIGCResult} from "./IGCAnalysis/ScoreFlight";
export {IScoringConfig} from './models/IScoringConfig';

export {Sector, ISetSectors, StartSector, FinishSector, FAISector, BarrelSector} from './models/Sector';
export {IWind} from './models/IWind'
export {ITaskPoint} from './models/ITaskPoint'
export {ITurnPoint} from './models/ITurnPoint'
export {DistanceCalcs, LatLong, Line} from './calcs/DistanceCalcsTS'