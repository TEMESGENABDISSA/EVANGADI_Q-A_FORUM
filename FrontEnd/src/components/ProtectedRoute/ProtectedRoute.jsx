import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserState } from "../../App";

export default function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const context = useContext(UserState);
  const token = localStorage.getItem("Evangadi_Forum");
  
  // Check if we have the user context or if we're still loading
  useEffect(() => {
    // If we have the context or no token, we're done loading
    if (context?.user !== undefined || !token) {
      setIsLoading(false);
    }
  }, [context, token]);

  // Show loading state while checking auth
  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  // If no token or no user in context, redirect to auth
  if (!token || !context?.user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
