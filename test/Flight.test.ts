import IGCParser from "igc-parser";
import { loadFlight, TaskModel } from "../src";
import { AnalyseTask } from "../src/IGCAnalysis/AnalyseTask";
import IGCFlight from "../src/IGCAnalysis/IGCFlight";
import { Log } from "../src/services/Logging";
import { CompletedFlight, CompletedFlightAnalysis, TestTask, TestTaskTPs } from "./TestData";
import { LandoutFlight } from "./TestData";

// test(`Import IGC file creates an IGCParser.IGCFlight Object`, ()=> {
//     expect(loadFlight(CompletedFlight, true)).toBeInstanceOf(IGCParser)
// });

test(`Completed Flight gives correct Analysis Result`, ()=>{
    let flt = loadFlight(CompletedFlight, true);
    let igcflight = new IGCFlight(flt);
    let task = new TaskModel(TestTaskTPs);
    Log(`test task is `, task)
    expect(AnalyseTask.assessTask(igcflight, task)).toEqual(CompletedFlightAnalysis)

});
