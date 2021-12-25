export interface PilotDetails {

    "PilotID": number;
    "Name": string;
    "Forename": string;
    "Surname": string;
    "ClubID": string;
    "Sex": string | null
    "eMail": string | null;
    "Password": string | null;
    "Active": boolean;
    "LPCode": number | null;
    "AltClubID": string | null;
    "LastLogin": Date | null;
}