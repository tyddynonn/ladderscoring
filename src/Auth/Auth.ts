import { API_URL } from "../Globals";
import { IUserDetails } from "../models/IPreferences";
import { get,  HttpResponse, post } from '../services/FetchWrapper';

export interface ICredentials {
    username: string;
    password: string;
}
export interface IToken {
    token_type: string | null;
    access_token: string | null;
    expires_in: number | null;
    refresh_token: string | null;
}

export interface IUser {
    token: IToken | null;
    userDetails?: IUserDetails;
}

async function loginUser(credentials: ICredentials): Promise<HttpResponse<IToken>> {
    let url = `${API_URL}/token?grant_type=password&username=${credentials.username}&password=${credentials.password}`
    return post<IToken>(url,'')
    }
const Auth = {
    async signIn(credentials: ICredentials): Promise<HttpResponse<IToken>> {
        return loginUser(credentials);
    },
    async signOut(): Promise<IToken | null> {
        return null
    },
    async getUserDetails(tk: IToken | undefined): Promise<any> {
        let url = `${API_URL}/GetUserDetails`;
        return get<any>(url,tk);
    }
}
export default Auth