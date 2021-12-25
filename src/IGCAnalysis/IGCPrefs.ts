
export const METRE2FOOT = 3.2808399;
export const KM2MILES = 0.62137119224;
export const MPS2KNOT = 1.9426025694;
export const MPS2FPM = 196.8503937;
export const KM2NM = 0.53961;

export interface IENLPrefs {
    detect: 'On' | 'Off';
    threshold: number;
    duration: number;
}
interface IAltPrefs {
    altsource: 'P' | 'G';
    altref: 'QFE' | 'QNH';
}
export interface ISectors {
    startrad: number;
    finrad: number;
    tprad: number;
    sector_rad: number;
    sector_angle: number;
    use_sector: boolean;
    use_barrel: boolean;
    finishtype: 'line' | 'circle';
}

interface IShowAlt {
    showval: number;
    descriptor: string;
}
export default class IGCPrefs {
    //This module sets up user display preferences and also handles unit conversion since
    //all internal records and calculations are in metres
    constructor() {}

    static distance: string = 'km';
    static units = {
        altitude: 'mt',
        climb: 'kt',
        cruise: 'kt',
        task: 'kph',
        distance: 'km'
    };

    static sectorDefaults: ISectors = {
        startrad: 5, //start line radius
        finrad: 5, //finish line radius
        tprad: 0.5, //'beer can' radius
        sector_rad: 20, //tp sector radius
        sector_angle: 90, //tp sector
        use_sector: true,
        use_barrel: true,
        finishtype: "line"
    };

    static sectors: ISectors = IGCPrefs.sectorDefaults;

    static altPrefs: IAltPrefs = {
        altsource: 'P',
        altref: 'QFE'
    };

    static enlPrefs: IENLPrefs = {
        detect: 'On',
        threshold: 500,
        duration: 12
    };
    
    private static enlRealityCheck(enl: IENLPrefs): boolean {
        var configerror = "";
        if (enl.detect === 'On') {
            if ((enl.threshold < 1) || (enl.threshold > 999)) {
                configerror += "\nIllegal threshold value";
            }
            if ((enl.duration < 2) || (enl.duration > 100)) {
                configerror += "\nUnrealistic time value";
            }
        }
        if (configerror.length > 0) {
            alert(configerror);
            return false;
        }
        else {
            return true;
        }
    }

    private static sectorsRealityCheck(newVals: ISectors): boolean {
        var configerror = "";

        if (!(newVals.startrad > 0)) {
            configerror = "\nStart radius needed";
        }
        if (!(newVals.finrad > 0)) {
            configerror += "\nFinish radius needed";
        }
        if ((newVals.use_barrel === false) && (newVals.use_sector === false)) {
            configerror += "\nSelect circle and/or sector for TPs";
        }
        if ((newVals.use_barrel === true) && (!(newVals.tprad > 0))) {
            configerror += "\nTP circle radius needed";
        }
        if ((newVals.use_sector === true) && (!(newVals.sector_rad > 0))) {
            configerror += "\nTP sector radius needed";
        }
        if (configerror.length > 0) {
            alert(configerror);
            return false;
        }
        else {
            return true;
        }
    }

     static storePreference(name: string, value:any) {
        if (window.localStorage) {
            try {
                localStorage.setItem(name, value);
            }
            catch (e) {
                console.log("error");
                // If permission is denied, ignore the error.
            }
        }
    }

    static setSectorDefaults() {
        this.sectors = this.sectorDefaults;
        }

    static setSectors(newsectors: ISectors, savevals: boolean): boolean {
            if (this.sectorsRealityCheck(newsectors)) {
                this.sectors = newsectors;
                if (savevals) {
                    this.storePreference('sectordefs', JSON.stringify(newsectors));
                }
                return true;
            }
            else {
                return false;
            }
        }

     static setEnl(newenl: IENLPrefs, savevals: boolean): boolean {
            if (this.enlRealityCheck(newenl)) {
                this.enlPrefs = newenl;
                if (savevals) {
                    this.storePreference('enlprefs', JSON.stringify(newenl));
                }
                return true;
            }
            else {
                return false;
            }
        }

     static getStoredValues () {
            try {
                var storedAltitudeUnit = localStorage.getItem("altitudeUnit");
                if (storedAltitudeUnit) {
                    this.units.altitude = storedAltitudeUnit;
                }
                var storedLengthUnit = localStorage.getItem("lengthUnit");
                if (storedLengthUnit) {
                    this.distance = storedLengthUnit;
                }
                var storedClimbUnit = localStorage.getItem("climbUnit");
                if (storedClimbUnit) {
                    this.units.climb = storedClimbUnit;
                }
                var storedCruiseUnit = localStorage.getItem("cruiseUnit");
                if (storedCruiseUnit) {
                    this.units.cruise = storedCruiseUnit;
                }
                var storedTaskUnit = localStorage.getItem("taskUnit");
                if (storedTaskUnit) {
                    this.units.task = storedTaskUnit;
                }
                var storedSectors = localStorage.getItem("sectordefs");
                if (storedSectors) {
                    this.sectors = JSON.parse(storedSectors);
                }
                var storedEnlPrefs = localStorage.getItem("enlprefs");
                if (storedEnlPrefs) {
                    this.enlPrefs = JSON.parse(storedEnlPrefs);
                }
                var storedAltPrefs = localStorage.getItem("altPrefs");
                if (storedAltPrefs) {
                    this.altPrefs = JSON.parse(storedAltPrefs);
                }
            }
            catch (e) {
                // If permission is denied, ignore the error.
                console.log("error");
            }
        }

        static showCruise(speed: number): string {
            var retval='';
            switch (this.units.cruise) {
                case 'kph':
                    retval = Math.round(speed) + "\u00A0km/hr";
                    break;
                case 'kt':
                    retval = Math.round(KM2NM * speed) + "\u00A0kt";
                    break;
                case 'mph':
                    retval = Math.round(KM2MILES * speed) + "\u00A0miles/hr";
                    break;
            }
            return retval;
        }

        static showDistance (distance: number):string {
            var retvalue ='';
            if (this.units.distance === 'km') {
                retvalue = distance.toFixed(1) + "\u00A0Km";
            }
            else {
                var miles = distance * KM2MILES;
                retvalue = miles.toFixed(1) + "\u00A0miles";
            }
            return retvalue;
        }

        static showTaskSpeed (speed: number):string { //takes speed in km/hr, converts if needed 
            var descriptor='';
            if (this.units.task === 'mph') {
                speed *= KM2MILES;
                descriptor = "\u00A0miles/hr";
            }
            else {
                descriptor = "\u00A0km/hr";
            }
            return speed.toFixed(2) + descriptor;
        }

        static showClimb (climbRate: number): string {
            var retval='';
            switch (this.units.climb) {
                case 'kt':
                    climbRate *= MPS2KNOT;
                    retval = climbRate.toFixed(1) + "\u00A0knots";
                    break;
                case 'mps':
                    retval = climbRate.toFixed(1) + '\u00A0m/s';
                    break;
                case 'fpm':
                    climbRate *= MPS2FPM;
                    retval = Math.round(climbRate) + "\u00A0ft/min";
            }
            if (climbRate > 0) {
                retval = "+" + retval;
            }
            return retval;
        }

        static displayAlt(metres: number): IShowAlt {
            var retval=0;
            var descriptor;
            if (this.units.altitude == 'ft') {
                retval = Math.round(METRE2FOOT * metres);
                descriptor = "\u00A0feet";
            }
            else {
                retval = Math.round(metres);
                descriptor = "\u00A0metres";
            }
            return {
                showval: retval,
                descriptor: descriptor
            };
        }

        static setAltUnits (value: string) {
            this.units.altitude = value;
            this.storePreference("altitudeUnit", value);
        }

        static setLengthUnits(value: string) {
            this.units.distance = value;
            this.storePreference("lengthUnit", value);
        }

        static setClimbUnits (value: string) {
            this.units.climb = value;
            this.storePreference("climbUnit", value);
        }

        static setCruiseUnits (value: string) {
            this.units.cruise = value;
            this.storePreference("cruiseUnit", value);
        }

        static setTaskUnits( value: string) {
            this.units.task = value;
            this.storePreference("taskUnit", value);
        }


        static setAltPrefs (altRef: 'QFE' | 'QNH', altSource: 'P' | 'G') {
            this.altPrefs.altref = altRef;
            this.altPrefs.altsource = altSource;
            this.storePreference("altPrefs", JSON.stringify(this.altPrefs));
        }
    }


