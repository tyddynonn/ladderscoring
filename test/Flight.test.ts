import { assessFlight, loadFlight, scoreFlight, ScoreIGCResult, TaskModel } from "../src";
import { AnalyseTask } from "../src/IGCAnalysis/AnalyseTask";
import IGCFlight from "../src/IGCAnalysis/IGCFlight";

import { TestScoringConfig, TestTaskTPs, TestWind } from "./TestData";
import { CompletedFlight, CompletedFlightAnalysis, CompletedFlightScore, CompletedGliderHandicap} from "./CompletedFlight";
import { LandoutFlight, LandoutFlightAnalysis, LandoutFlightScore, LandoutGliderHandicap } from './LandoutFlight'
import {IGCParserNS } from "igc-parser-cf";

// test(`Import IGC file creates an IGCParser.IGCFlight Object`, ()=> {
//     expect(loadFlight(CompletedFlight, true)).toBeInstanceOf(IGCParser)
// });

let completedflt:IGCParserNS.IGCFile;
let landoutflt:IGCParserNS.IGCFile;
let task:TaskModel;

beforeAll(()=>{
    completedflt = loadFlight(CompletedFlight, true);
    landoutflt = loadFlight(LandoutFlight, true);
    task = new TaskModel(TestTaskTPs);

});
test(`Completed Flight gives correct Analysis Result`, ()=>{
    let flt = new IGCFlight(completedflt);
    expect(AnalyseTask.assessTask(flt, task)).toEqual(CompletedFlightAnalysis)
});

test(`Completed Flight gives correct Score`, async () =>{
    let analysis = await assessFlight(completedflt,task);
    let score: ScoreIGCResult | undefined = undefined;
    if (analysis) {
        score = await scoreFlight(task,analysis, TestWind, CompletedGliderHandicap, TestScoringConfig )
    }
    expect(score).toEqual(CompletedFlightScore);
})

test(`Landout Flight gives correct Analysis Result`, ()=>{
    let flt = new IGCFlight(landoutflt);
    expect(AnalyseTask.assessTask(flt, task)).toEqual(LandoutFlightAnalysis)    
});

test(`Landout Flight gives correct Score`, async () =>{
    let analysis = await assessFlight(landoutflt,task);
    let score: ScoreIGCResult | undefined = undefined;
    if (analysis) {
        score = await scoreFlight(task,analysis, TestWind, LandoutGliderHandicap, TestScoringConfig )
    }
    expect(score).toEqual(LandoutFlightScore);
})
