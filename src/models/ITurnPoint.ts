export interface ITurnPoint {
    Trigraph: string;
    PilotID?: number;
    BGANo?: number | null;
    Name: string;
    TurnPoint?: string;
    Desc?: string;
    NGRE?: number;
    NGRN?: number;
    Lat_Degrees?: number;
    Lat_Minutes?: number;
    NS?: "N" | "S";
    Lon_Degrees?: number;
    Lon_Minutes?: number;
    EW?: "E" | "W";
    NonUK?: boolean;
    Altitude?: number;
    Deleted?: boolean;
    ID?: number;
    Latitude: number;
    Longitude: number;
    Point?: null;
}
