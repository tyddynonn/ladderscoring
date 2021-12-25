import { useState } from 'react';
import { IUser } from './Auth';
export const useUser = (initialValue?: IUser): any[] =>
{
    const store = localStorage; // or sessionStorage

    const saveUser = (user: IUser): void => {
        store.setItem('user', JSON.stringify(user));
        setUser(user);
    }
    const getUser = (): IUser | null => {
        const userString = store.getItem('user');
        //console.log(`getUser: got ${userString} from storage`)
        if (userString !== null) {
            return JSON.parse(userString)
        }
        else {
            return null
        }
    }
    if (initialValue !== undefined) {
        saveUser(initialValue);
    }
    const [user, setUser] = useState<IUser | null>(getUser());

    return [user, saveUser]
    
}