import IGCParser from "glana-igc-parser";
import { LatLong } from "../calcs/DistanceCalcsTS";
import { Sector } from "../models/Sector";

//Contains general purpose calculations- not necessarily exclusive to this application
const EARTHRAD = 6378.137; //  Earth radius major axis km
const MINRAD = 6356.752; //earth radius minor axis
var startElevation;

export interface DistanceBearing {
    distance: number;
    bearing: number;
}
export interface TimeZone {
    zoneAbbr: string;
    offset: number;
    zoneName: string;

}
export function timezoneDefault(zone: TimeZone) {
    zone.zoneAbbr = 'UTC';
    zone.offset = 0;
    zone.zoneName = 'UTC';
}
interface SectorLimits {
    max: number;
    min: number;
}
export default class IGCUtilities {

     static pad =  function (n: number) {
        return (n < 10) ? ("0" + n.toString()) : n.toString();
    }

    static showFormat = function (coords:LatLong) {
        var latdegrees = Math.abs(coords.Latitude);
        var latdegreepart = Math.floor(latdegrees);
        var latminutepart = 60 * (latdegrees - latdegreepart);
        var latdir = (coords.Latitude > 0) ? "N" : "S";
        var lngdegrees = Math.abs(coords.Longitude);
        var lngdegreepart = Math.floor(lngdegrees);
        var lngminutepart = 60 * (lngdegrees - lngdegreepart);
        var lngdir = (coords.Longitude > 0) ? "E" : "W";
        return latdegreepart.toString() + "&deg;" + latminutepart.toFixed(3) + "&prime;" + latdir + " " + lngdegreepart.toString() + "&deg;" + lngminutepart.toFixed(3) + "&prime;" + lngdir;
    }

    static showDate = function (timestamp:number) {
        var daynames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var monthnames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var localdate = new Date(1000 * timestamp);
        return daynames[localdate.getUTCDay()] + " " + localdate.getUTCDate() + " " + monthnames[localdate.getUTCMonth()] + " " + localdate.getUTCFullYear();
    }


    static getUnixTime= function (hhmmss: string) { //Once the date is displayed we are just tracking offset from midnight
        var utime = 3600 * parseInt(hhmmss.substr(0, 2)) + 60 * parseInt(hhmmss.substr(2, 2)) + parseInt(hhmmss.substr(4, 2));
        return utime;
    }

    static parseLatLong = function (latLongString:string):LatLong {
        var latitude = parseFloat(latLongString.substring(0, 2)) +
            parseFloat(latLongString.substring(2, 7)) / 60000.0;
        if (latLongString.charAt(7) === 'S') {
            latitude = -latitude;
        }
        var longitude = parseFloat(latLongString.substring(8, 11)) +
            parseFloat(latLongString.substring(11, 16)) / 60000.0;
        if (latLongString.charAt(16) === 'W') {
            longitude = -longitude;
        }

        return  {
            Latitude: latitude,
            Longitude: longitude
        };
    }
    static latLongFromPoint(point: IGCParser.TaskPoint): LatLong {
        let latlng: LatLong = {
            Latitude: 0,
            Longitude: 0
        };

        try {
            latlng =
            {
                Latitude: point.latitude,
                Longitude: point.longitude
            }
        }
        catch (ex) {
            console.log(`latLongfromPoint: ${ex} for ${point}`);
            debugger;
        }
        return latlng;
    }
    static latLongFromFix(fix: IGCParser.BRecord): LatLong {
        let latlng: LatLong = {
            Latitude: 0,
            Longitude: 0
        };

        try {
            latlng=
                {
                    Latitude: fix.latitude,
                    Longitude: fix.longitude
                }
        }
        catch (ex) {
            console.log(`latLongfromFix: ${ex} for ${fix}`);
            debugger;
        }
        return latlng;
        
    }
    static getUnixDate = function (ddmmyy: string) {
        var day = parseInt(ddmmyy.substr(0, 2), 10);
        var month = parseInt(ddmmyy.substr(2, 2), 10) - 1;
        // The IGC specification has a built-in Millennium Bug (2-digit year).
        // I will arbitrarily assume that any year before "80" is in the 21st century.
        var year = parseInt(ddmmyy.substr(4, 2), 10);
        if (year < 80) {
            year += 2000;
        }
        else {
            year += 1900;
        }
        var jsdate = new Date(Date.UTC(year, month, day)); //This is the only time we use the Date object- easiest way to get day of the week.
        return jsdate.getTime() / 1000;
    }

    static unixToString = function (timestamp: number) {
        return IGCUtilities.pad(Math.floor(timestamp / 3600)) + ":" + IGCUtilities.pad(Math.floor((timestamp / 60) % 60)) + ":" + IGCUtilities.pad(timestamp % 60);
    }

    static unixToPaddedString = function (seconds: number) {
        if (seconds < 3600) {
            return Math.floor(seconds / 60) + "mins " + IGCUtilities.pad(seconds % 60) + "secs";
        }
        else {
            return Math.floor(seconds / 3600) + "hrs " + IGCUtilities.pad(Math.floor((seconds / 60) % 60)) + "mins " + IGCUtilities.pad(seconds % 60) + "secs";
        }
    }

    static getTrackData = function (start: LatLong, end: LatLong): DistanceBearing { //Vincenty method: maximum accuracy
        var lat1 = start.Latitude * Math.PI / 180;
        var lat2 = end.Latitude * Math.PI / 180;
        var deltaLon = (end.Longitude - start.Longitude) * Math.PI / 180;
        var flattening = (EARTHRAD - MINRAD) / EARTHRAD;
        var tanU1 = (1 - flattening) * Math.tan(lat1); //U is reduced latitude
        var cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
        var sinU1 = tanU1 * cosU1;
        var tanU2 = (1 - flattening) * Math.tan(lat2); //U is reduced latitude
        var cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2);
        var sinU2 = tanU2 * cosU2;
        var lambda1 = deltaLon;
        var lambda2;
        var iteration = 0;
        var sinLambda;
        var cosLambda;
        var sinsq;
        var cossq;
        var sigma;
        var sinSigma;
        var cosSigma;
        var sinAlpha;
        var cos2M;
        var C;
        var g11;

        do {
            sinLambda = Math.sin(lambda1);
            cosLambda = Math.cos(lambda1);
            sinsq = (cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda);
            sinSigma = Math.sqrt(sinsq);
            if (sinSigma === 0) {
                return {
                    distance: 0,
                    bearing: 0
                }; // co-incident points
            }
            cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
            sigma = Math.atan2(sinSigma, cosSigma);
            sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
            cossq = 1 - sinAlpha * sinAlpha;
            cos2M = cosSigma - 2 * sinU1 * sinU2 / cossq;
            if (isNaN(cos2M)) {
                cos2M = 0;
            }
            C = flattening / 16 * cossq * (4 + flattening * (4 - 3 * cossq));
            lambda2 = lambda1;
            lambda1 = deltaLon + (1 - C) * flattening * sinAlpha * (sigma + C * sinAlpha * (cos2M + C * cosSigma * (-1 + 2 * cos2M * cos2M)));
            iteration++;
        }
        while ((Math.abs(lambda2 - lambda1) > 1e-12) && (iteration < 100));
        if (iteration > 99) {
            alert("Distance out of range: check coordinates");
        }
        var uSq = cossq * (EARTHRAD * EARTHRAD - MINRAD * MINRAD) / (MINRAD * MINRAD);
        var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
        var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
        var deltaSigma = B * sinSigma * (cos2M + B / 4 * (cosSigma * (-1 + 2 * cos2M * cos2M) - B / 6 * cos2M * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2M * cos2M)));

        var d = MINRAD * A * (sigma - deltaSigma);
        var fwdAz = Math.atan2(cosU2 * sinLambda, cosU1 * sinU2 - sinU1 * cosU2 * cosLambda); //initial bearing
        var brng = Math.round((360 + fwdAz * 180 / Math.PI) % 360);
        //var revAz = Math.atan2(cosU1*sinLambda, -sinU1*cosU2+cosU1*sinU2*cosλ); //final bearing
        return {
            distance: d,
            bearing: brng
        };
    }

    static toPoint= function (start:LatLong, end:LatLong): DistanceBearing { //fast version- used where speed critical
        var lat1 = start.Latitude * Math.PI / 180;
        var lat2 = end.Latitude * Math.PI / 180;
        var lon1 = start.Longitude * Math.PI / 180;
        var lon2 = end.Longitude * Math.PI / 180;
        var deltaLat = lat2 - lat1;
        var deltaLon = lon2 - lon1;
        var a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = EARTHRAD * c;
        var y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        var brng = (360 + Math.atan2(y, x) * 180 / Math.PI) % 360;
        return {
            distance: d,
            bearing: brng
        };
    }

    static targetPoint = function (start: LatLong, distance: number, bearing: number): LatLong {
        var lat1 = start.Latitude * Math.PI / 180;
        var lng1 = start.Longitude * Math.PI / 180;
        var radbrng = bearing * Math.PI / 180;
        var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / EARTHRAD) + Math.cos(lat1) * Math.sin(distance / EARTHRAD) * Math.cos(radbrng));
        var lng2 = lng1 + Math.atan2(Math.sin(radbrng) * Math.sin(distance / EARTHRAD) * Math.cos(lat1), Math.cos(distance / EARTHRAD) - Math.sin(lat1) * Math.sin(lat2));
        var retlat = lat2 * 180 / Math.PI;
        var retlng = lng2 * 180 / Math.PI;
        retlng = (retlng + 540) % 360 - 180;
        return {
            Latitude: retlat,
            Longitude: retlng
        };
    }

    static kasaRegress = function (xVectors: number[], yVectors: number[], xMean: number, yMean: number) { //Kasa method for circular regression
        var i;
        var xi;
        var yi;
        var mxx = 0;
        var myy = 0;
        var zi;
        var mxy = 0;
        var mxz = 0;
        var myz = 0;
        var g12;
        var g22;
        var d1;
        var d2;
        var xOffset;
        var yOffset;
        var centreX;
        var centreY;
        var magnitude;
        var direction;

        for (i = 0; i < xVectors.length; i++) {
            xi = xVectors[i] - xMean;
            yi = yVectors[i] - yMean;
            mxx += xi * xi;
            myy += yi * yi;
            zi = xi * xi + yi * yi;
            mxy += xi * yi;
            mxz += xi * zi;
            myz += yi * zi;
        }
        mxx /= xVectors.length;
        myy /= xVectors.length;
        mxy /= xVectors.length;
        mxz /= xVectors.length;
        myz /= xVectors.length;
        let g11 = Math.sqrt(mxx);
        g12 = mxy / g11;
        g22 = Math.sqrt(myy - g12 * g12);
        d1 = mxz / g11;
        d2 = (myz - g12 * d1) / g22;
        yOffset = d2 / g22 / 2;
        xOffset = (d1 - yOffset * g12) / g11 / 2;
        centreX = xOffset + xMean;
        centreY = yOffset + yMean;
        magnitude = Math.sqrt(centreX * centreX + centreY * centreY);
        direction = 180 * Math.atan(centreX / centreY) / Math.PI;
        if (centreY > 0) {
            direction = (direction + 180) % 360;
        }
        else {
            direction = (direction + 360) % 360;
        }
        return {
            magnitude: magnitude,
            direction: direction
        };
    }

    static getEarthSize = function () {
        return EARTHRAD;
    }
    static samePoint(point1: LatLong, point2: LatLong): boolean {
        return (point1.Latitude===point2.Latitude && point1.Longitude===point2.Longitude)
    }

    static inSector(sector: Sector, status: DistanceBearing, sectorLimits: SectorLimits): boolean {
        if (sector.radius1 > 0 && (status.distance < sector.radius1)) {
            return true;        // inside barrel
        }
        return ((status.distance < sector.radius2) && this.checkSector(status.bearing, sectorLimits))
    }

    static checkSector(target: number, comparison: SectorLimits): boolean {
        var min = comparison.min;
        var max = comparison.max;
        if (min > max) {
            max += 360;
            if (target < comparison.max) {
                target += 360;
            }
        }
        return ((target > min) && (target < max));
    }
};