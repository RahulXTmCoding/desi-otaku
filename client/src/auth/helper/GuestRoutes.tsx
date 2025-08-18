import React from "react";
import { Navigate } from "react-router-dom";
import { isAutheticated } from "./index";

interface GuestRouteProps {
  children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const auth = isAutheticated();
  
  // If user is authenticated, redirect them away from auth pages
  if (auth) {
    // If user is admin, redirect to admin dashboard
    if (auth.user?.role === 1) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // If regular user, redirect to user dashboard
    return <Navigate to="/user/dashboard" replace />;
  }
  
  // If not authenticated, show the auth page (signup/signin)
  return <>{children}</>;
};

export default GuestRoute;
