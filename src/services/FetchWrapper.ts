import { IToken } from "../Auth/Auth";
import { API_ENDPOINTS, API_URL } from "../Globals";

export interface HttpResponse<T> extends Response {
    parsedBody?: T;
}

export async function http<T>(request: RequestInfo): Promise<HttpResponse<T>> {
    const response: HttpResponse<T> = await fetch(request);

    try {
        // may error if there is no body
        response.parsedBody = await response.json();

    } catch (ex) { }

    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response;
}

export async function get<T>(
    path: string,
    token?: IToken | null,
    args: RequestInit = { method: "get" },

): Promise<HttpResponse<T>> {
    if (token) args.headers = { Authorization: 'Bearer ' + token?.access_token ?? '' }
    return await http<T>(new Request(path, args));
};

export async function post<T>(
    path: string,
    body: any,
    token: IToken | null = null,
    args: RequestInit = { method: "post", body: JSON.stringify(body) }
): Promise<HttpResponse<T>> {
    let headers = new Headers();
    headers.append( 'content-type', 'application/json' )
    if (token) headers.append('Authorization', 'Bearer ' + token?.access_token ?? '')
    //if (token) args.headers=  { Authorization: 'Bearer ' + token?.access_token ?? '' }
    //return await http<T>(new Request(`${API_URL}/${endpoint}`,args))
    args.headers = headers;
    return await http<T>(new Request(path, args));
};

export async function put<T>(
    path: string,
    body: any,
    token: IToken | null = null,
    args: RequestInit = { method: "put", body: JSON.stringify(body) }
): Promise<HttpResponse<T>> {
    if (token) args.headers = { Authorization: 'Bearer ' + token?.access_token ?? '' }
    return await http<T>(new Request(path, args));
};

export async function getItem<T>(endpoint: API_ENDPOINTS | string, queryString?: string, token: IToken | null = null) {
   //console.log(`getItem for ${endpoint}`)
    //console.log(`getItem querying ${API_URL}/${endpoint}${queryString ? ('?' + encodeURIComponent(queryString)) : ''}`);

    return get<T>(`${API_URL}/${endpoint}${queryString ? ('?' + queryString) : ''}`,token)
        .then(response => {
            //console.log(`getItem for ${endpoint} returning ${response.parsedBody}`)
            return response.parsedBody;
        });
}
export async function getItems<T>(endpoint: API_ENDPOINTS | string, queryString?: string) {
    //console.log(`getItems for ${endpoint}`)
    //console.log(`getItems querying ${API_URL}/${endpoint}${queryString ? (' ? ' + encodeURIComponent(queryString)) : ''}`);

    return get<T[]>(`${API_URL}/${endpoint}${queryString ? ('?' + encodeURIComponent(queryString)) : ''}`)
        .then(response => {
            //console.log(`getItems for ${endpoint} returning ${response.parsedBody?.length} items`)
            return response.parsedBody ?? [];
        });
}

export async function retrieveItems<T>(endpoint: API_ENDPOINTS | string, queryString?: string, fromServer: boolean=false): Promise<T[] | undefined> {
    //console.log(`retrieveItems for ${endpoint}`)
    let stringItem: string | null = null;
    let result: T[] = [];

    if (!fromServer) {
        stringItem = sessionStorage.getItem(endpoint);
    }
    if (stringItem !== null) {
        result = JSON.parse(stringItem) as T[];
        //console.log(`retrieveItems for ${endpoint} returns ${result.length} items from sessionStorage`)
        return result;
    }
    else {
        return getItems<T>(endpoint, queryString)
            .then(items => {
                sessionStorage.setItem(endpoint, JSON.stringify(items))
                //console.log(`retrieveItems for ${endpoint} returns ${items.length} items from API`)
                return items
            })
    }
}

export interface IUploadLogger {
    file: File;
    group: string | null;
    flightid: number | null;
    comment: string | null;
    token: IToken;
}
// the return from the UploadLoggerFile API
export interface ILoggerUploadResult {
    name: string;
    size: number;
    status: string;
}

// use two types see https://eckertalex.dev/blog/typescript-fetch-wrapper

export async function postLogger(endpoint: API_ENDPOINTS | string, details:IUploadLogger) {
    const formData = new FormData();
    formData.append('File', details.file);
    formData.append('Group', details.group?? '');
    formData.append('FlightID', (details.flightid ?? 0).toString());
    formData.append('Comment', details.comment ?? '')

    let args: RequestInit = { method: "post", body: formData }
    if (details.token) args.headers = { Authorization: 'Bearer ' + details.token?.access_token ?? '' }

    return http<ILoggerUploadResult>(new Request(`${API_URL}/${endpoint}`, args))
        .then(resp => { return resp.parsedBody })
}

