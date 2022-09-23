import { API_ENDPOINTS, API_URL } from "../Globals";
// eslint-disable-next-line
import { Log } from "./Logging";

export interface IToken {
    token_type: string | null;
    access_token: string | null;
    expires_in: number | null;
    refresh_token: string | null;
}

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
export async function del<T>(
    path: string,
    token?: IToken | null,
    args: RequestInit = { method: "GET" },      // use GET here because DELETE doesn't work on hosted API

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
    //Log(`Post to ${path} with body ${JSON.stringify(body)}, token ${token}`)
    let headers = new Headers();
    headers.append( 'content-type', 'application/json' )
    if (token) headers.append('Authorization', 'Bearer ' + token?.access_token ?? '')
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

export async function deleteItem<T>(endpoint: API_ENDPOINTS | string, token: IToken | null = null) {
    //let url = (endpoint in API_ENDPOINTS) ? `${API_URL}/${endpoint}` : `${endpoint}`
    let url =  `${endpoint}`
    return del<T>(`${url}`,token)
        .then(response => {
            return response.parsedBody;
        });
}

export async function getItem<T>(endpoint: API_ENDPOINTS | string, queryString?: string, token: IToken | null = null) {
        let url = (endpoint in API_ENDPOINTS) ? `${API_URL}/${endpoint}` : `${endpoint}`
        //Log(`getItem querying ${url}${queryString ? ('?' + encodeURIComponent(queryString)) : ''}`);

    return get<T>(`${url}${queryString ? ('?' + queryString) : ''}`,token)
        .then(response => {
            //Log(`getItem for ${endpoint} returning ${response.parsedBody}`)
            return response.parsedBody;
        });
}
export async function getItems<T>(endpoint: API_ENDPOINTS | string, queryString?: string, token: IToken | null = null) {
    let url = (endpoint in API_ENDPOINTS) ? `${API_URL}/${endpoint}` : `${endpoint}`
    //Log(`getItems querying ${url}${queryString ? (' ? ' + encodeURIComponent(queryString)) : ''}`);

    return get<T[]>(`${url}${queryString ? ('?' + encodeURIComponent(queryString)) : ''}`,token)
        .then(response => {
            //Log(`getItems for ${endpoint} returning ${response.parsedBody?.length} items`)
            return response.parsedBody ?? [];
        });
}

export async function retrieveItems<T>(endpoint: API_ENDPOINTS | string, queryString?: string, fromServer: boolean = false, token: IToken | null = null): Promise<T[] | undefined> {
    //Log(`retrieveItems for ${endpoint}`)
    let stringItem: string | null = null;
    let result: T[] = [];

    if (!fromServer) {
        stringItem = sessionStorage.getItem(endpoint);
    }
    if (stringItem !== null) {
        result = JSON.parse(stringItem) as T[];
        //Log(`retrieveItems for ${endpoint} returns ${result.length} items from sessionStorage`)
        return result;
    }
    else {
        return getItems<T>(endpoint, queryString,token)
            .then(items => {
                sessionStorage.setItem(endpoint, JSON.stringify(items))
                //Log(`retrieveItems for ${endpoint} returns ${items.length} items from API`)
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

