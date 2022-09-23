export const METRE2FOOT = 3.2808399;
export const  KM2MILES = 0.62137119224;
export const  MPS2KNOT = 1.9426025694;
export const  MPS2FPM = 196.8503937;
export const  KM2NM = 0.53961;
export const DEG2RAD = Math.PI/180;
export const TASKLETTERS = 'ABCDEFGHIJ';

export const AUTH_API_HOST =  process.env.NODE_ENV === 'production' ? 
    process.env.REACT_APP_ENV==='staging' ?
        'https://lsapistaging.bgaladder.net' 
        :
        'https://lsapi.bgaladder.net' 
    :          
    'https://localhost:44352'



export const API_HOST =  process.env.NODE_ENV === 'production' ? 
    process.env.REACT_APP_ENV==='staging' ?
        'https://lsapistaging.bgaladder.net' 
        :
        'https://lsapi.bgaladder.net'
    :          
    'https://localhost:44352'


export const API_URL = `${API_HOST}/API`
export const AUTH_API_URL = `${AUTH_API_HOST}/API`
export const GLANA_URL =  `https://glana.bgaladder.net/?bgaBaseUrl=${encodeURI(API_HOST)}&bgaUserid=0&bgaID=`

// these are endpoints for the ScoringAPI

export enum API_ENDPOINTS {
    USERS = 'USERS',
    SAVEUSER = 'SAVEUSER',
    DELETEUSER = 'DELETEUSER',

    GETPREFS = 'GETPREFS',
    SAVEPREFS = 'SAVEPREFS',

    COMPETITIONS = 'COMPETITIONS',
    SCORERCOMPS = 'SCORERCOMPS',
    SAVECOMPETITION = 'SAVECOMPETITION',
    DELETECOMPETITION = 'DELETECOMPETITION',
    SCORINGCONFIG = `SCORINGCONFIG`,
    WINDS = 'CONTESTWIND',

    COMPETITORS = 'COMPETITORS',
    SAVECOMPETITOR = 'SAVECOMPETITOR',
    DELETECOMPETITOR = 'DELETECOMPETITOR',

    TASKS = 'TASKS',        // key is CompetitionID
    SAVETASK = 'SAVETASK',
    DELETETASK = 'DELETETASK',
    TASKWITHTPS = 'TASKWITHTPS',    // key is taskID, returns {task: task, tasktps: tasktps}
    COMPTASKS = 'COMPTASKS',       // key is compid, returns array of {task: task, tasktps: tasktps}
    TASKTPS = 'TASKTPS',        // key is TaskID
    SAVETASKTP = 'SAVETASKTP',
    DELETETASKTP = 'DELETETASKTP',  // Keys are TaskID, Index

    FLIGHTS = 'FLIGHTS', // key is CompetitionID
    SAVEFLIGHT = 'SAVEFLIGHT',
    DELETEFLIGHT = 'DELETEFLIGHT',   //key is flight id

    LOGFILE = 'LOGFILE',    // key is logfileID
    SAVELOGFILE = 'SAVELOGFILE',
    DELETELOGFILE = 'DELETELOGFILE',
    IGCFILE = 'LOGFILECONTENTS',

    COMPCLASSES = 'COMPCLASSES',
    SAVECOMPCLASS = 'SAVECOMPCLASS',
    DELETECOMPCLASS = 'DELETECOMPCLASS',

    SERILOGS = 'SERILOGS',
    CLEARLOG = 'CLEARSERILOG',
    SERIAUDITLOGS = 'SERIAUDITLOGS',
    CLEARAUDITLOG = 'CLEARSERIAUDITLOG',

    GETELEVATION = 'GETELEVATION',
}
