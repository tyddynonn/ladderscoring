import { immerable, produce } from 'immer';

import {ITaskPoint, cloneTaskPoint} from './ITaskPoint'
import { Sector } from './Sector';
import { LatLong, DistanceCalcs } from '../calcs/DistanceCalcsTS';
import {ITurnPoint} from './ITurnPoint';
import { IWind } from './IWind';
import { TASKLETTERS } from '../Globals';

export class TaskModel {
    [immerable] = true;
    
    constructor(tps: ITaskPoint[] = []) {
        // if the tps array is non empty, seed the task with those TPs
        this.turnpoints=[];
        if (tps.length>0 ){
            tps.forEach(tp => {
                this.turnpoints.push(cloneTaskPoint(tp))
            }); 
            setTitles(tps);
            DistanceCalcs.updateDistances(this);           
        }
    }
    CompetitionID?: number;
    TaskID?:  string | number;
    TaskDate?: string;      //ISO Date
    turnpoints: ITaskPoint[];
    Legs: number = 0;
    Title: string = '';
    SubTaskOf?: string | number;

    clear() {
        this.turnpoints = [];
        this.Legs = 0;
    }
     get description():string {
        let desc = '';
        this.turnpoints.forEach(tp => {
            desc += tp.TP!==null ? `${tp.TP.Trigraph} - ` : `NULL - ` ;            
        })
        if (desc.length>0 ) {
            desc = desc.slice(0,-3);    // remove trailing dash
        }
        return desc;        
    }

    insertTP( tp:ITaskPoint, index:number) {
        this.turnpoints.splice(index,0,tp);
        makesubTasks(this);
    }
    deleteTP(index:number) {
        this.turnpoints.splice(index,1);
        makesubTasks(this);
    }

    get TaskDistance() {
        var dist = 0;
        this.turnpoints.map((tp: ITaskPoint) => {
            dist += (tp.legDistance === undefined) ? 0 : tp.legDistance;
        });
        return dist;
    }

    get TaskDistanceSectors() {        
        var dist = 0;
        this.turnpoints.map((tp: ITaskPoint) => {
            dist += (tp.sectorDistance === undefined) ? 0 : tp.sectorDistance;
        });
        return dist;
    }

    get usedTPs():ITurnPoint[] {
        let points:ITurnPoint[] = [];
        this.turnpoints.map((tp) => {
            if (tp.TP !== null) {
                points.push(tp.TP);
            }
        })
        return points;
    }

    get usedPoints(): LatLong[] {
        let tps = this.usedTPs;
        let points: LatLong[] = []
        tps.map((tp) => {
            points.push({ Latitude: tp.Latitude, Longitude: tp.Longitude });
        });
        return points;
    }

    get SubTasks():TaskModel[] {
        return makesubTasks(this);
    }

} // class

function makesubTasks(tm:TaskModel) {
    let tpcount = tm.turnpoints.length-2;     // tpcount is number of TPs excluding start & finish
    let subTasks:TaskModel[] = [];

    if (tpcount>1) {     // there are only subsTasks if there is more than one TP in this task
        for (let i=1; i<tpcount; i++) { 
            // there are as many subTasks as tpCount-1
            //console.log(`subTasks: Creating subTask ${i}`)
            let subtaskTPs:ITaskPoint[] = []
            // generate the list of TPs in this subtask
            subtaskTPs.push(cloneTaskPoint(  tm.turnpoints[0]));     // start is always same
            for (let j=1; j<=i; j++) {
                //console.log(`subTasks: Adding TP ${tm.turnpoints[j].TP?.Trigraph} to subTask`)
                subtaskTPs.push(cloneTaskPoint(  tm.turnpoints[j])); // add as many TPs as appropriate
            }
            subtaskTPs.push(cloneTaskPoint(tm.turnpoints[tm.turnpoints.length-1])); // Finish is the same
            let subTask = new TaskModel(subtaskTPs)
            DistanceCalcs.updateDistances(subTask);
            subTask.Title = `Task ${TASKLETTERS.substr(i-1,1)}`;
            subTask.SubTaskOf = tm.TaskID;
            subTask.CompetitionID = tm.CompetitionID;

            subTasks.push(subTask);
        }
        tm.Title = `Task ${TASKLETTERS.substr(tpcount-1,1)}`
    }
    return subTasks;
}

const setTitles = (taskpoints: ITaskPoint[]): void => {
    taskpoints.forEach((tp, index) => {
        switch (index) {
            case 0:
                tp.title = 'Start';
                break;
            case taskpoints.length - 1:
                tp.title = 'Finish';
                break;
            default:
                tp.title = `TP ${index}`;
                break;
        }
    })
}
export const emptyTaskPoint: ITaskPoint = 
{
    title: 'Empty',
    TP: null,
    sector: new Sector( .5, 45, 0, 0, false),
    reached: false,
    legDistance: undefined,
    sectorDistance: undefined,
}
export const startPoint: ITaskPoint = 
{
    title: 'Start',
    TP: null,
    sector: new Sector( 5, 90, 0, 0, true),
    reached: false,
    legDistance: undefined,
    sectorDistance: undefined,
}