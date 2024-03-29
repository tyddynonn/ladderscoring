﻿import {ITurnPoint} from './ITurnPoint';
import {cloneSector,  ISector} from './Sector';

export interface ITaskPoint {
    title: string;
    TP: ITurnPoint | null;
    sector: ISector;
    legDistance: number | undefined;   // distance from the previous selected TP, without adj for sector
    sectorDistance: number|undefined;   // adjusted for sector size...    
}

export function cloneTaskPoint(tp:ITaskPoint):ITaskPoint {
        return {
            title: tp.title,
            //reached:false,
            TP: tp.TP,
            sector: cloneSector(tp.sector),
            legDistance: undefined,
            sectorDistance:undefined                    
        }        
    }
