// Test data...
import {IWind} from '../src/models/IWind';
import {IScoringConfig} from '../src/models/IScoringConfig';
import {AssessmentResult} from '../src/IGCAnalysis/AnalyseTask';
import { ScoreIGCResult } from '../src/IGCAnalysis/ScoreFlight';
import { ITaskPoint } from '../src';

export const TestTaskTPs: ITaskPoint[] = [

        {
            "title": "Start",
            "TP": {
                "Trigraph": "POC",
                "PilotID": 0,
                "BGANo": 440,
                "Name": "POCKLINGTON",
                "TurnPoint": "A/F R/Ws 19/31",
                "Desc": "Wolds GC site",
                "NGRE": 479.239990234375,
                "NGRN": 448.42999267578125,
                "Lat_Degrees": 53,
                "Lat_Minutes": 55.558998107910156,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 47.6870002746582,
                "EW": "W",
                "NonUK": false,
                "Altitude": 87,
                "Deleted": false,
                "ID": 1037,
                "Latitude": 53.92598342895508,
                "Longitude": -0.794783353805542,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'Start',
                "radius1": 5,
                "angle1": 90,
                "radius2": 0,
                "angle2": 90,
                "line": true,
            },
            legDistance: 0,
            sectorDistance: 0,
        },
        {
            "title": "TP 1",
            "TP": {
                "Trigraph": "FRI",
                "PilotID": 0,
                "BGANo": 235,
                "Name": "FRIDAYTHORPE",
                "TurnPoint": "A166/B1251",
                "Desc": "Y shaped junction E side of village, 8 NMl W of Great Driffield",
                "NGRE": 487.760009765625,
                "NGRN": 459.0799865722656,
                "Lat_Degrees": 54,
                "Lat_Minutes": 1.218000054359436,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 39.720001220703125,
                "EW": "W",
                "NonUK": false,
                "Altitude": 102,
                "Deleted": false,
                "ID": 539,
                "Latitude": 54.020301818847656,
                "Longitude": -0.6620000004768372,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'TP1',
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 13.64276693304613,
            "sectorDistance": 13.14276693304613
        },
        {
            "title": "TP 2",
            "TP": {
                "Trigraph": "BUS",
                "PilotID": 0,
                "BGANo": 1200,
                "Name": "BURTON UPON STATHER",
                "TurnPoint": "T-junction",
                "Desc": "B1430 T-junction in middle of village E of River Trent 1 NMl N of Flixborough, 4 NMl NNW of Scunthorpe. Note CTA 2 NMl to the SW",
                "NGRE": 487.0299987792969,
                "NGRN": 417.80999755859375,
                "Lat_Degrees": 53,
                "Lat_Minutes": 38.97200012207031,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 41.0890007019043,
                "EW": "W",
                "NonUK": false,
                "Altitude": 197,
                "Deleted": false,
                "ID": 232,
                "Latitude": 53.649532318115234,
                "Longitude": -0.6848166584968567,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'TP2',
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 41.29468756045629,
            "sectorDistance": 40.29468756045629
        },
        {
            "title": "TP 3",
            "TP": {
                "Trigraph": "GAI",
                "PilotID": 0,
                "BGANo": 237,
                "Name": "GAINSBOROUGH",
                "TurnPoint": "A631/River Bridge",
                "Desc": "Bridge over river Trent on SW side of Town",
                "NGRE": 481.4200134277344,
                "NGRN": 389.04998779296875,
                "Lat_Degrees": 53,
                "Lat_Minutes": 23.523000717163086,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 46.62799835205078,
                "EW": "W",
                "NonUK": false,
                "Altitude": 56,
                "Deleted": false,
                "ID": 549,
                "Latitude": 53.392051696777344,
                "Longitude": -0.7771332859992981,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'TP3',
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 29.303423549300142,
            "sectorDistance": 28.303423549300142
        },
        {
            "title": "TP 4",
            "TP": {
                "Trigraph": "NWK",
                "PilotID": 0,
                "BGANo": 395,
                "Name": "NEWARK",
                "TurnPoint": "A1/A46",
                "Desc": "NE side of Newark-on-Trent.",
                "NGRE": 481.3599853515625,
                "NGRN": 355.8299865722656,
                "Lat_Degrees": 53,
                "Lat_Minutes": 5.611000061035156,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 47.189998626708984,
                "EW": "W",
                "NonUK": false,
                "Altitude": 39,
                "Deleted": false,
                "ID": 978,
                "Latitude": 53.0935173034668,
                "Longitude": -0.7864999771118164,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'TP4',
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 33.230025927891525,
            "sectorDistance": 32.230025927891525
        },
        {
            "title": "TP 5",
            "TP": {
                "Trigraph": "SBY",
                "PilotID": 0,
                "BGANo": 478,
                "Name": "SALTBY",
                "TurnPoint": "R/W Triangle",
                "Desc": "Centre of 3 runways at Buckminster GC site. Glider aerobatics carried out over airfield 1000 to 4000 feet.  Alternative points SXB, SB2, BVR, GRA.",
                "NGRE": 486,
                "NGRN": 326,
                "Lat_Degrees": 52,
                "Lat_Minutes": 49.71799850463867,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 42.86000061035156,
                "EW": "W",
                "NonUK": false,
                "Altitude": 480,
                "Deleted": false,
                "ID": 1140,
                "Latitude": 52.828633333333336,
                "Longitude": -0.7143333333333334,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'TP5',
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 29.873979851722062,
            "sectorDistance": 28.873979851722062
        },
        {
            "title": "TP 6",
            "TP": {
                "Trigraph": "OAE",
                "PilotID": 0,
                "BGANo": null,
                "Name": "OAKHAM E",
                "TurnPoint": "A606/A6003 rbout",
                "Desc": "E side of town, W end of Rutland Water",
                "NGRE": 487.09259033203125,
                "NGRN": 308.5152893066406,
                "Lat_Degrees": 52,
                "Lat_Minutes": 40.042999267578125,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 42.81399917602539,
                "EW": "W",
                "NonUK": false,
                "Altitude": 330,
                "Deleted": false,
                "ID": 1508,
                "Latitude": 52.66738510131836,
                "Longitude": -0.7135666608810425,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'TP6',
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 17.944022897306496,
            "sectorDistance": 16.944022897306496
        },
        {
            "title": "Finish",
            "TP": {
                "Trigraph": "POC",
                "PilotID": 0,
                "BGANo": 440,
                "Name": "POCKLINGTON",
                "TurnPoint": "A/F R/Ws 19/31",
                "Desc": "Wolds GC site",
                "NGRE": 479.239990234375,
                "NGRN": 448.42999267578125,
                "Lat_Degrees": 53,
                "Lat_Minutes": 55.558998107910156,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 47.6870002746582,
                "EW": "W",
                "NonUK": false,
                "Altitude": 87,
                "Deleted": false,
                "ID": 1037,
                "Latitude": 53.92598342895508,
                "Longitude": -0.794783353805542,
                "Point": null
            },
            "sector": {
                "sectorDescription": 'Finish',
                "radius1": 1.5,
                "angle1": 180,
                "radius2": 0,
                "angle2": 180,
                "line": false
            },
            "legDistance": 140.17632844129378,
            "sectorDistance": 138.17632844129378
        }
    ]

export const TestTask ={
    "Legs": 0,
    "Title": "Task F",
    "turnpoints": [
        {
            "title": "Start",
            "TP": {
                "Trigraph": "POC",
                "PilotID": 0,
                "BGANo": 440,
                "Name": "POCKLINGTON",
                "TurnPoint": "A/F R/Ws 19/31",
                "Desc": "Wolds GC site",
                "NGRE": 479.239990234375,
                "NGRN": 448.42999267578125,
                "Lat_Degrees": 53,
                "Lat_Minutes": 55.558998107910156,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 47.6870002746582,
                "EW": "W",
                "NonUK": false,
                "Altitude": 87,
                "Deleted": false,
                "ID": 1037,
                "Latitude": 53.92598342895508,
                "Longitude": -0.794783353805542,
                "Point": null
            },
            "sector": {
                "radius1": 5,
                "angle1": 90,
                "radius2": 0,
                "angle2": 90,
                "line": true
            }
        },
        {
            "title": "TP 1",
            "TP": {
                "Trigraph": "FRI",
                "PilotID": 0,
                "BGANo": 235,
                "Name": "FRIDAYTHORPE",
                "TurnPoint": "A166/B1251",
                "Desc": "Y shaped junction E side of village, 8 NMl W of Great Driffield",
                "NGRE": 487.760009765625,
                "NGRN": 459.0799865722656,
                "Lat_Degrees": 54,
                "Lat_Minutes": 1.218000054359436,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 39.720001220703125,
                "EW": "W",
                "NonUK": false,
                "Altitude": 102,
                "Deleted": false,
                "ID": 539,
                "Latitude": 54.020301818847656,
                "Longitude": -0.6620000004768372,
                "Point": null
            },
            "sector": {
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 13.64276693304613,
            "sectorDistance": 13.14276693304613
        },
        {
            "title": "TP 2",
            "TP": {
                "Trigraph": "BUS",
                "PilotID": 0,
                "BGANo": 1200,
                "Name": "BURTON UPON STATHER",
                "TurnPoint": "T-junction",
                "Desc": "B1430 T-junction in middle of village E of River Trent 1 NMl N of Flixborough, 4 NMl NNW of Scunthorpe. Note CTA 2 NMl to the SW",
                "NGRE": 487.0299987792969,
                "NGRN": 417.80999755859375,
                "Lat_Degrees": 53,
                "Lat_Minutes": 38.97200012207031,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 41.0890007019043,
                "EW": "W",
                "NonUK": false,
                "Altitude": 197,
                "Deleted": false,
                "ID": 232,
                "Latitude": 53.649532318115234,
                "Longitude": -0.6848166584968567,
                "Point": null
            },
            "sector": {
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 41.29468756045629,
            "sectorDistance": 40.29468756045629
        },
        {
            "title": "TP 3",
            "TP": {
                "Trigraph": "GAI",
                "PilotID": 0,
                "BGANo": 237,
                "Name": "GAINSBOROUGH",
                "TurnPoint": "A631/River Bridge",
                "Desc": "Bridge over river Trent on SW side of Town",
                "NGRE": 481.4200134277344,
                "NGRN": 389.04998779296875,
                "Lat_Degrees": 53,
                "Lat_Minutes": 23.523000717163086,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 46.62799835205078,
                "EW": "W",
                "NonUK": false,
                "Altitude": 56,
                "Deleted": false,
                "ID": 549,
                "Latitude": 53.392051696777344,
                "Longitude": -0.7771332859992981,
                "Point": null
            },
            "sector": {
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 29.303423549300142,
            "sectorDistance": 28.303423549300142
        },
        {
            "title": "TP 4",
            "TP": {
                "Trigraph": "NWK",
                "PilotID": 0,
                "BGANo": 395,
                "Name": "NEWARK",
                "TurnPoint": "A1/A46",
                "Desc": "NE side of Newark-on-Trent.",
                "NGRE": 481.3599853515625,
                "NGRN": 355.8299865722656,
                "Lat_Degrees": 53,
                "Lat_Minutes": 5.611000061035156,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 47.189998626708984,
                "EW": "W",
                "NonUK": false,
                "Altitude": 39,
                "Deleted": false,
                "ID": 978,
                "Latitude": 53.0935173034668,
                "Longitude": -0.7864999771118164,
                "Point": null
            },
            "sector": {
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 33.230025927891525,
            "sectorDistance": 32.230025927891525
        },
        {
            "title": "TP 5",
            "TP": {
                "Trigraph": "SBY",
                "PilotID": 0,
                "BGANo": 478,
                "Name": "SALTBY",
                "TurnPoint": "R/W Triangle",
                "Desc": "Centre of 3 runways at Buckminster GC site. Glider aerobatics carried out over airfield 1000 to 4000 feet.  Alternative points SXB, SB2, BVR, GRA.",
                "NGRE": 486,
                "NGRN": 326,
                "Lat_Degrees": 52,
                "Lat_Minutes": 49.71799850463867,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 42.86000061035156,
                "EW": "W",
                "NonUK": false,
                "Altitude": 480,
                "Deleted": false,
                "ID": 1140,
                "Latitude": 52.828633333333336,
                "Longitude": -0.7143333333333334,
                "Point": null
            },
            "sector": {
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 29.873979851722062,
            "sectorDistance": 28.873979851722062
        },
        {
            "title": "TP 6",
            "TP": {
                "Trigraph": "OAE",
                "PilotID": 0,
                "BGANo": null,
                "Name": "OAKHAM E",
                "TurnPoint": "A606/A6003 rbout",
                "Desc": "E side of town, W end of Rutland Water",
                "NGRE": 487.09259033203125,
                "NGRN": 308.5152893066406,
                "Lat_Degrees": 52,
                "Lat_Minutes": 40.042999267578125,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 42.81399917602539,
                "EW": "W",
                "NonUK": false,
                "Altitude": 330,
                "Deleted": false,
                "ID": 1508,
                "Latitude": 52.66738510131836,
                "Longitude": -0.7135666608810425,
                "Point": null
            },
            "sector": {
                "radius1": 0.5,
                "angle1": 180,
                "radius2": 20,
                "angle2": 45,
                "line": false
            },
            "legDistance": 17.944022897306496,
            "sectorDistance": 16.944022897306496
        },
        {
            "title": "Finish",
            "TP": {
                "Trigraph": "POC",
                "PilotID": 0,
                "BGANo": 440,
                "Name": "POCKLINGTON",
                "TurnPoint": "A/F R/Ws 19/31",
                "Desc": "Wolds GC site",
                "NGRE": 479.239990234375,
                "NGRN": 448.42999267578125,
                "Lat_Degrees": 53,
                "Lat_Minutes": 55.558998107910156,
                "NS": "N",
                "Lon_Degrees": 0,
                "Lon_Minutes": 47.6870002746582,
                "EW": "W",
                "NonUK": false,
                "Altitude": 87,
                "Deleted": false,
                "ID": 1037,
                "Latitude": 53.92598342895508,
                "Longitude": -0.794783353805542,
                "Point": null
            },
            "sector": {
                "radius1": 1.5,
                "angle1": 180,
                "radius2": 0,
                "angle2": 180,
                "line": false
            },
            "legDistance": 140.17632844129378,
            "sectorDistance": 138.17632844129378
        }
    ],
    "TaskID": 38,
    "CompetitionID": 1,
    "TaskDate": "2021-08-28",
    "SubTaskOf": 0
}
export const TestScoringConfig:IScoringConfig = {
    "CompetitionID": 0,
    "DistancePoints": 5,
    "SpeedPoints": 0.05,
    "MinimumSpeed": 50,
    "CompletionFactor": 1.1,
    "UseTaskDistance": true,
    "UseMinDistance": true,
    "CompleteForSpeed": true
}

export const TestWind : IWind = {
    windstrength: 5,
    winddirection: 44,
}

