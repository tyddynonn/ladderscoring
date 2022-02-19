// export interface ISector {
//     radius1: number;
//     angle1: number;
//     radius2: number;
//     angle2: number;
//     line: boolean;
//     sectorDescription: (() => string) | string;
//     clone:(()=> ISector);
//}

export interface ISetSectors {
    FAI: boolean | undefined;
    Barrels: boolean | undefined;
    Variable: boolean | undefined;
}

export function cloneSector(sector: Sector):Sector {
    return new Sector(
        sector.radius1,
        sector.angle1,
        sector.radius2,
        sector.angle2,
        sector.line
    )
}
export class Sector  {
    constructor(
        radius1: number = 0.5,
        angle1: number =180,
        radius2: number=20,
        angle2: number=90,
        line: boolean=false 
    ) {
        this.radius1 = radius1;
        this.angle1 = angle1;
        this.radius2 = radius2;
        this.angle2 = angle2;
        this.line = line;
    }

    radius1: number;
    angle1: number;
    radius2: number;
    angle2: number;
    line: boolean;

    get sectorDescription(): string {
        if (this.line) {
            return `${this.radius1.toFixed(1)} km Line`
        }
        if (this.angle1===90 && this.radius2===0 && this.angle2==0) {
            return(`${this.radius1.toFixed(1)} km Start Zone`)
        }
        if (this.radius1 === 0 ) {
            // FAI 
            return `FAI ${this.radius2} km Sector`
        }
        if (this.radius1 === 0.5 && this.angle1 === 180) {
            return `0.5 km Barrel with ${this.radius2} km ${this.angle2} degree Sector`
        }
        if (this.angle1 === 180) {
            return (`${this.radius1.toFixed(1)} km Ring`)
        }
        // something else...
        return `Radius1=${this.radius1}, Angle1=${this.angle1}, Radius2=${this.radius2}, Angle2=${this.angle2}`
    }

}
export const StartSector = () => { return new Sector(5, 90, 0, 0, false) };      // 5km line
export const FinishSector = () => { return new Sector(1.5, 180, 0, 0, false) }; // 1.5km ring
export const FAISector = () => { return new Sector(0, 0, 20, 90, false) };
export const BarrelSector = () => { return new Sector(0.5, 180, 20, 90, false) };


