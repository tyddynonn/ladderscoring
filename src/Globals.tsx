﻿export const API_HOST = 'https://localhost:44352'
export const API_URL = `${API_HOST}/API`
//export const API_URL = 'https://staging.bgaladder.net/api'


export enum API_ENDPOINTS {
    GLIDERS = 'GLIDERS',
    TP = 'TP',
    TPS = 'TPS',
    ADDTP = 'ADDWAYPOINT',
    ACTIVEPILOTS = 'ACTIVEPILOTS',
    LAUNCHPOINTS = 'LAUNCHPOINTS',
    CLUBS = 'CLUBS',
    REGIONS = 'REGIONS',
    DAILYSCORES = 'DAILYSCORES',
    FLIGHT = 'FLIGHT',
    DELETEFLIGHT='DELETEFLIGHT',
    FLIGHTIGC='FLIGHTIGC',
    SEASONS = 'SEASONS',
    LOCALLADDERS = 'LOCALLADDERS',
    SUBMITFLIGHT = 'SUBMITFLIGHT',
    UPLOADLOGGERFILE = 'UPLOADLOGGERFILE',
    COMMENTS = 'GETCOMMENTS',
    REMOVECOMMENT = 'REMOVECOMMENT',
    POSTCOMMENT = 'POSTCOMMENT',
    FLAGFLIGHT = 'FLAGFLIGHT',

}

export const METRE2FOOT = 3.2808399;
export const  KM2MILES = 0.62137119224;
export const  MPS2KNOT = 1.9426025694;
export const  MPS2FPM = 196.8503937;
export const  KM2NM = 0.53961;
export const DEG2RAD = Math.PI/180;
export const TASKLETTERS = 'ABCDEFGHIJ';
