import React from "react";
import { Navigate } from "react-router-dom";
import { isAutheticated } from "./index";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const auth = isAutheticated();
  const user = auth ? auth.user : null;
  return user && user.role === 1 ? <>{children}</> : <Navigate to="/signin" />;
};

export default AdminRoute;
