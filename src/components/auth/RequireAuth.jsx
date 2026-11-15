import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

/** Wrap a page: <RequireAuth><MyBookings /></RequireAuth>. Add `admin` to require the admin role. */
export default function RequireAuth({ admin = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-white">
        <Loader2 className="animate-spin text-brand" size={36} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
