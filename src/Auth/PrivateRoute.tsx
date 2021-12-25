import React from "react";
import { Route, Redirect, RouteComponentProps, RouteProps, useLocation, useHistory } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface IPrivateRouteProps extends RouteProps {
    authenticationPath: string;
    returnPath?: string
}

const PrivateRoute: React.FC<IPrivateRouteProps> = props => {

    const auth = useAuth();

    if (auth?.isAuthenticated()) {
        return <Route {...props} />;
    }
    else {
        const renderComponent = () => <Redirect to={{ pathname: props.authenticationPath, state: { from: props.path } }} />;
        return <Route {...props} component={renderComponent} render={undefined} />;
    }
};
export default PrivateRoute;
