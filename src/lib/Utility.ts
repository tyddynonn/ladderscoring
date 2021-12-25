/**  Format a Lat/Long for display
 * @param { object } point - point with Latitude & Longitude properties
 * @param {boolean } decimal - optional flag to use decimal degrees
 * @returns { string }  Position in DD MM.MMM or DD.DDD format
 */

// @ts-ignore
import magellan from 'magellan'
import { LatLong, Line } from '../calcs/DistanceCalcsTS';

interface IPoint {
    Latitude: number; Longitude: number;
}

export function formatPosition(point: IPoint, decimal?: boolean): string {
    var result = 'Invalid Position';
    if (point && point.Latitude && point.Longitude && !isNaN(point.Latitude) && !isNaN(point.Longitude)) {
        result = formatLatLng(point.Latitude, point.Longitude, decimal);
    }
    return result;
}
/**  Format a Lat/Long for display
 * @param { number } latitude - the latitude
 * @param {number } longitude - the logitude
 * @param {boolean } decimal - optional flag to use decimal degrees
 * @returns { string }  Position in DD MM.MMM or DD.DDD format
 */
export function formatLatLng(latitude: number, longitude:number, decimal?:boolean):string {
    var result = 'Invalid Position';
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        result = formatLat(latitude, decimal) + ' ' + formatLng(longitude, decimal);
    }
    return result;
}
/**  Format a Latitude for display
 * @param { number } latitude - the latitude
 * @param {boolean } decimal - optional flag to use decimal degrees
 * @returns { string }  Position in DD MM.MMMH or DD.DDD format
 */
export function formatLat(latitude: number, decimal?:boolean):string {
    var result = '';
    if (latitude && !isNaN(latitude)) {
        if (decimal) {
            result = latitude.toFixed(3);
        }
        else {
            var latdegrees = Math.abs(latitude);
            var latdegreepart = Math.floor(latdegrees);
            var latminutepart = 60 * (latdegrees - latdegreepart);
            result = latdegreepart.toLocaleString('en', { minimumIntegerDigits: 2, minimumFractionDigits: 0, useGrouping: false })
                + ' '
                + latminutepart.toLocaleString('en', { minimumIntegerDigits: 2, minimumFractionDigits: 3, useGrouping: false })
                + ((latitude > 0) ? "N" : "S");
        }
    }
    return result;
}
/**  Format a Longitude for display
 * @param { number } longitude - the longitude
 * @param {boolean } decimal - optional flag to use decimal degrees
 * @returns { string }  Position in DD MM.MMMH or DD.DDD format
 */
function formatLng(longitude:number, decimal?:boolean):string {
    var result = '';
    if (longitude && !isNaN(longitude)) {
        if (decimal) {
            result = longitude.toFixed(3);
        }
        else {
            var lngdegrees = Math.abs(longitude);
            var lngdegreepart = Math.floor(lngdegrees);
            var lngminutepart = 60 * (lngdegrees - lngdegreepart);
            result = lngdegreepart.toLocaleString('en', { minimumIntegerDigits: 2, minimumFractionDigits: 0, useGrouping: false })
                + ' '
                + lngminutepart.toLocaleString('en', { minimumIntegerDigits: 2, minimumFractionDigits: 3, useGrouping: false })
                + ((longitude > 0) ? 'E' : 'W');
        }
    }
    return result;
}

/** Unformat a Latitude or Longitude
 * @param { string } value - Position in DD MM.MMMH or DD.DDD format
 * @param { boolean } decimal - optional flag to use decimal degrees
 * @returns { number }  decimal value or NaN
 */
function unformatLatLng(value:string, decimal?:boolean):number {
    var result = NaN;
    if (decimal) {
        result = parseFloat(value);
    }
    else {
        // its in DD MMM.MMMH format
        var hemi = value.slice(-1); // get hemisphere character off the end
        var parts = value.slice(0, -1).split(' ');
        if (parts.length === 2) {
            result = (parseInt(parts[0] + parseFloat(parts[1]) / 60)) * (hemi === 'S' || hemi === 'W' ? -1 : 1);
        }
    }
    return result;
}

/**
 * Parse a string for Latitude
 * 
 * @param {string} value - the string to parse
 * @return {object} - object with properties lat, valid and error
 */
function parseLatitude(value: string): { lat: number; valid: boolean; error: string} {
    var result = {
        lat: NaN,
        valid: false,
        error: ''
    };
    var lat = magellan(value).latitude();
    if (lat === null) {
        result.error = 'Could not understand ' + value + ' as a Latitude';
    }
    else {
        result.lat = lat.toDD();
        result.valid = true;
    }
    return result;
}

/**
 * Parse a string for Longitude
 * 
 * @param {string} value - the string to parse
 * @return {object} - object with properties lng, valid and error
 */
function parseLongitude(value: string): { lng: number; valid: boolean; error: string } {
    var result = {
        lng: NaN,
        valid: false,
        error: ''
    };

    var lng = magellan(value).longitude();
    if (lng === null) {
        result.error = 'Could not understand ' + value + ' as a Longitude';
    }
    else {
        result.lng = lng.toDD();
        result.valid = true;
    }
    return result;
}


// Line crossing detection from https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function

 function Turn(p1:LatLong , p2:LatLong, p3:LatLong) {
    let a = p1.Longitude; let b = p1.Latitude; 
    let c = p2.Longitude; let d = p2.Latitude;
    let e = p3.Longitude; let f = p3.Latitude;
    let A = (f - b) * (c - a);
    let B = (d - b) * (e - a);
    return (A > B + Number.EPSILON) ? 1 : (A + Number.EPSILON < B) ? -1 : 0;
  }
  
//   export function isIntersect(p1:LatLong, p2:LatLong, p3:LatLong, p4:LatLong):boolean {
//     return (Turn(p1, p3, p4) != Turn(p2, p3, p4)) && (Turn(p1, p2, p3) != Turn(p1, p2, p4));
//   }

  export function isIntersect(line1: Line, line2: Line):boolean {
    return (Turn(line1.Start, line2.Start, line2.End) != Turn(line1.End, line2.Start, line2.End)) && 
            (Turn(line1.Start,line1.End,line2.Start) != Turn(line1.Start,line1.End, line2.End));
  }