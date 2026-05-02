import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { booting, isAuthenticated } = useAuth();

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-panel text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Loading workspace...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
