// @ts-ignore
import  * as GeographicLib from 'geographiclib';
import { IWind } from '..';
import { DEG2RAD } from '../Globals';
import IGCUtilities, { DistanceBearing } from '../IGCAnalysis/IGCUtilities';
import {ITaskPoint} from '../models/ITaskPoint';
import {ITurnPoint} from '../models/ITurnPoint';
import {TaskModel} from '../models/TaskModel';
import { Log } from '../services/Logging';

export type LatLong = {
    Latitude: number;
    Longitude: number;
}
export type Line = {
    Start: LatLong,
    End: LatLong
}

export class DistanceCalcs {

    static updateDistances(tm:TaskModel):void {
        // recalculate distances....
        let TPs = tm.turnpoints;
        let maxTPindex = TPs.length - 1;

        for (let i = maxTPindex; i > 0; i--) {

            if (TPs[i].TP !== null) {
                let prev = this.prevTP(TPs, i);
                Log(`updateDistances: Setting distance for index ${i} with TP ${tm.turnpoints[i].TP?.Trigraph} and prevTP ${prev.TP?.Trigraph}`)
                Log(`updateDistances:TP at ${tm.turnpoints[i].TP?.Latitude.toFixed(3)}, ${tm.turnpoints[i].TP?.Longitude.toFixed(3)}`)
                Log(`updateDistances: Prev at ${prev.TP?.Latitude.toFixed(3)}, ${prev.TP?.Longitude.toFixed(3)}`)
                // sector adjustment reduces leg size by the radius of the current and previous sectors
  
                let sectorAdj = (TPs[i].sector.line ? 0 : TPs[i].sector.radius1) + (prev.sector.line ? 0 : prev.sector.radius1)
                let legDistance = Math.max( DistanceCalcs.getDistance(TPs[i], prev),0 );
                Log(`updateDistances: Leg ${i} has legDistance ${legDistance.toFixed(1)}, sector adj ${sectorAdj.toFixed(1)}`)
                TPs[i].legDistance = (TPs[i] && prev) ? legDistance : 0;
                TPs[i].sectorDistance = Math.max(legDistance-sectorAdj,0);
            }
        }
    }

    
    static legHCdistance(tm: TaskModel, leg:number, scoredist: number, wind:IWind = {winddirection:0, windstrength:0}, handicap:number=100):number {
        Log(`leghcDistance: Leg${leg} from ${tm.turnpoints[leg-1].TP?.Trigraph} to ${tm.turnpoints[leg].TP?.Trigraph} dist ${(tm.turnpoints[leg].legDistance ?? 0).toFixed(1)}`)
        let adjHandicap = handicap + this.windicap(tm.turnpoints[leg-1].TP, tm.turnpoints[leg].TP,wind);
        let adjDist = scoredist * 100/adjHandicap;

        Log(`leghcDistance: HC ${handicap}, adjHC ${adjHandicap.toFixed(1)} adjDist ${adjDist.toFixed(1)}`)
        return adjDist;
    }
    static handicappedDistance(tm:TaskModel, wind: IWind = {winddirection:0, windstrength:0}, handicap:number=100, useSectorDistance=false): number {
                // code for per-leg handicapping by wind
            let dist = 0;
            let lastindex = tm.turnpoints.length-1;
            
            for (let leg=1; leg<lastindex; leg++) {
                dist += this.legHCdistance(tm, leg, useSectorDistance ? (tm.turnpoints[leg].sectorDistance ?? 0) :(tm.turnpoints[leg].legDistance ?? 0), wind, handicap)
            }
            return dist;
    }

    static windicap(fromTP:ITurnPoint | null, toTP: ITurnPoint|null, wind:IWind):number {
        // returns the adjustment to the base handicap for this leg
        if (fromTP===null || toTP===null || wind.windstrength===0)  return 0;
            let legdata = IGCUtilities.toPoint({Latitude:fromTP.Latitude, Longitude: fromTP.Longitude}, {Latitude:toTP.Latitude, Longitude: toTP.Longitude})
            let legCourseRadians = legdata.bearing*DEG2RAD;
            let windDirectionRadians = wind.winddirection*DEG2RAD;
            let windFactor = (wind.windstrength/46);
            let windFactorSquared = Math.pow(windFactor, 2)
            let theta = legCourseRadians-windDirectionRadians;
            let sinThetaSquared = Math.pow(Math.sin(theta),2);
            let term1 = Math.sqrt((1-windFactorSquared*sinThetaSquared));
            let term2 = 1 + windFactor*Math.cos(theta);
            let handicapadjustment = 100*(term1-term2);

            return handicapadjustment;

    }
    static prevTP(tm: ITaskPoint[], index:number): ITaskPoint {
        if (index <= 0) return tm[0];
        let tp = null;

        for (let i = index - 1; i >= 0; i--) {
            if (tm[i].TP !== null) {
                tp = tm[i];
                break;
            }
        }
        return tp as ITaskPoint;
    }
    static nextTP(tm: ITaskPoint[], index: number): ITaskPoint {
        if (index >= tm.length - 1) return tm[tm.length - 1];
        let tp = null;

        for (let i = index + 1; i < tm.length; i++) {
            if (tm[i].TP !== null) {
                tp = tm[i];
                break;
            }
        }
        return tp as ITaskPoint;
    }

    //***************************************************************************************

    static getDistance(fromTP:ITaskPoint, toTP:ITaskPoint):number {
        // calculate the distance between two TPs in km - from and to are TaskPoint objects
        return (fromTP && toTP) ? this.getDistanceTP(fromTP.TP!, toTP.TP!) : 0
    }
    //***************************************************************************************
    static getDistanceTP(fromTP: ITurnPoint, toTP: ITurnPoint): number {
        // calculate the distance between two TPs in km - from and to are TP objects
        var dist = 0;
        if ((fromTP && toTP) && (fromTP?.Trigraph !== toTP?.Trigraph)) {       // if either is not defined, return a 0
            dist = this.getDistanceLatLong(
                { Latitude: fromTP!.Latitude, Longitude: fromTP!.Longitude },
                { Latitude: toTP!.Latitude, Longitude: toTP!.Longitude });
        }
        return dist;
    }
    //***************************************************************************************
    static getDistanceLatLong(p1:LatLong, p2:LatLong):number {
        // distance in km between the two points
        const geod = GeographicLib.Geodesic.WGS84;
        let r = geod.Inverse(p1.Latitude, p1.Longitude, p2.Latitude, p2.Longitude);
        return (r.s12??0) / 1000;
    }
}


