import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#a1a1aa]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-[#00f0ff] rounded-full animate-pulse" />
          Loading...
        </div>
      </div>
    );
  }
  if (!user || user === false) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/" replace />;
  return children;
}
