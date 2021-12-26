# LadderScoring

A Library for scoring IGC files in accordance with BGA Ladder rules, with the addition of Windicapping

The Scoring rules used are:

- Distance Points: 5 points per handicapped km 
- Speed Points: 
    - If 
        - The task was completed; and
        - The handicapped distance achieved was greater than the glider handicap; and
        - The handicapped speed was greater than 50 kph
    - then (handicapped speed-50) \* handicapped distance \* 0.05

- Bonus Points:
    - If the task was completed, then (Distance Points + Speed Points) * 0.1


## Installation


```
npm install --save ladderscoring
```

or

```
yarn add ladderscoring
```

Include the module in your project:

```jsx
import { TaskModel, assessFlight, AssessIGCResult, scoreFlight, ScoreIGCResult, IWind, .... } from 'ladderscoring';

```

# Acknowledgements

To user eidge for [glana-igc-parser](https://github.com/eidge/igc-parser)

# Interfaces

- IGCFile
    See [glana-igc-parser](https://github.com/eidge/igc-parser)

- AssessIGCResult 

    - The result of running an assessment on an IGCFile

    ```
    interface AssessIGCResult {

        flightDate: Date | null;
        loggerFlightDate: Date | null;
        flightLoaded: boolean,

        taskCompleted: boolean,
        legScoringDistance: number[],      // this is per leg....
        totalScoringDistance: number;
        speed: number,

        gpsLandout: boolean,                
        landoutPosition: ITurnPoint | null;
        usedTPs: ITaskTP[],
        missingTPs: ITaskTP[],
        TPTimes: string[],
        StartTime: string | undefined,
        FinishTime: string | undefined,
        LandingTime: string | undefined,

        secondPilot: string |null ,
        gliderReg: string,
        gliderType: string | null
        timeTaken: number;
        heightLoss: number;
        assessment: AssessmentResult | null,
        flightException: boolean,
        errorArray: string[],
    }
    ```
- ScoreIGCResult

    ```
    interface ScoreIGCResult {
    taskDistance: number;   // the basic task distance
    hcDistance: number;     // the distance after windicapping was applied
    scoreDistance: number;  // the scoring distance (=hcDistance if completed)
    completed: boolean;
    taskTime: number;       // time on task in seconds
    hcSpeed: number;        // handicapped speed over the task
    distancePoints: number; // using the Scoring Rules.
    speedPoints: number;
    totalPoints: number;
    errors: string[];
    }
   ```
- IWind: used to set the Contest wind for windicapping. Leave undefined for no windicapping
    ```
    {
        windstrength: number;   // in knots
        winddirection: number;  // in degrees true
    }
    ```

- ITaskPoint
    - Definition of a turnpoint in a Task
    ``` 
    ITaskPoint {
    title: string;                      // eg 'Start', 'Finish'...
    TP: ITurnPoint | null;              // the actual Turnpoint
    sector: Sector;                     // the Sector definition used at this point
    legDistance: number | undefined;    // distance from the previous selected TP, without adj for sector
    sectorDistance: number|undefined;   // adjusted for sector size...    
    }
    ```

- ITurnPoint
    - Definition of a Turnpoint. The interface defines all the properties used by a BGA Ladder Turnpoint, but the only ones used by this library are

        ```
        ITurnPoint {
        Trigraph: string;
        Name: string;
        Latitude: number;
        Longitude: number;
        }
        ```
# Classes

- TaskModel - defines the task against which the flight will be assessed. You should create a TaskModel then pass it to the assessFlight and scoreFlight APIs

    - Properties 
    ```
        CompetitionID?: number;      The ID of the competion in which this task is used (see ladderscoringweb)
        TaskID?:  string | number;   Unique ID for this task
        TaskDate?: string;           Date of this task in ISO (YYYY-MM-DD) form
        turnpoints: ITaskPoint[];    Array of points for this task, in order
        Title: string = '';          A name for this task
        SubTaskOf?: string | number; which larger task this one is derived from, or zero
    ```

- Sector - defines a sector as used in the Taskmodel. Create with

    ```
    sector = new Sector(
        radius1: number = 0.5,
        angle1: number =180,
        radius2: number=20,
        angle2: number=90,
        line: boolean=false )
    ```

    Angles in degrees, distances in km.

# API

-  `loadFlight (flt: string | string[]):IGCParser.IGCFile` 

    Takes an IGC file as either a single string or as an array of lines and parses it into an IGCFile object.

-  `assessFlight = async (igcflight: IGCParser.IGCFile, task:TaskModel): Promise<AssessIGCResult>`

    Takes an IGCFile object and assesses it against a TaskModel, producing an AssessIGCResult with the results of the analysis. 

- `scoreFlight = async (task: TaskModel, assessment: AssessIGCResult,  wind: IWind, gliderHandicap: number): Promise<ScoreIGCResult>`

    Takes an AssessIGCResult and scores it against the given TaskModel, applying windicapping as appropriate. Set the wind strength to zero for no windicapping.


