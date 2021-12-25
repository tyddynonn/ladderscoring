import React, { createContext, useContext } from "react";
import useAuthProvider, { IUseAuthProvider } from "./useAuthProvider";

const AuthContext = createContext<IUseAuthProvider | null>(null);

const AuthProvider: React.FC = ({ children }) => {
    const auth = useAuthProvider();
    return <AuthContext.Provider value={auth}>{children} </AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
};

export default AuthProvider;
