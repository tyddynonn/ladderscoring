// Task details as returned from /api/flight

import { TPDetails } from "./TPDetails";

export interface TaskDetails {
    "TaskTPs": string[];
    "TP_OK": boolean[];
    "Barrels": number[];
    "TaskDescription": string;
    "LoggerEvidence": boolean;
    "PhotoEvidence": boolean;
    "TaskEvidence": string;
    "Format": string | null;
    "Task": string | null;
    "Declared": boolean;
    "strDeclared": string;
    "ValidationResult": {
        "StatusID": number;
        "StatusDescription": string;
        "ReasonID": number;
        "ReasonDescription": string;
    },
    "LoggerValidation": string;
    "TaskDistance": number;
    "SectorType": string;
    "TaskShape": string;
    "ShapeFactor": number;
    "ShapeFactor2": number;
    "TaskFormat": string;
    "FAITriangleTPs": TPDetails[];
}