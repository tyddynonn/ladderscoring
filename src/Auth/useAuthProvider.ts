import { IUserDetails } from "../models/IPreferences";
import Auth, { ICredentials, IUser } from "./Auth";
import { useUser } from "./useUser";


export interface IUseAuthProvider {
    signIn: (creds: ICredentials) => void; 
    signOut: () => void;
    isAuthenticated: () => boolean;
    isAdmin: () => boolean;
    user: IUser | null;
}   

const useAuthProvider = (): IUseAuthProvider => {
    const [user, setUser] = useUser();

    const signIn = (creds: ICredentials) => {
        Auth.signIn(creds)
            .then(response => {
                // fetch prefs
                let tk = response.parsedBody;                
                Auth.getUserDetails(tk)
                    .then(details => {
                        setUser({
                            token: tk,
                            userDetails: details.parsedBody as IUserDetails
                        });
                    })
            })
            .catch((e:Error) => {
                setUser(null);
                console.log(`Signin error: ${e.message}`)
            });
    }
    const signOut = () => {
        Auth.signOut()
            .then(() => {
                setUser(null);
            });
    }

    const isAuthenticated = () => {
        return user !== null;
    }

    const isAdmin = () => {
        return user.userDetails.admin
    }

    return {
        user,
        signIn,
        signOut,
        isAuthenticated,
        isAdmin,
    }
};
export default useAuthProvider;