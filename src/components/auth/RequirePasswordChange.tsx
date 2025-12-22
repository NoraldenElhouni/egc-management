import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function RequirePasswordChange() {
  const { first_login, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner

  // if must change password, force them to the page
  if (first_login && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}
