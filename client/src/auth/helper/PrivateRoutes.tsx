import React from "react";
import { Navigate } from "react-router-dom";
import { isAutheticated } from "./index";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  return isAutheticated() ? <>{children}</> : <Navigate to="/signin" />;
};

export default PrivateRoute;
