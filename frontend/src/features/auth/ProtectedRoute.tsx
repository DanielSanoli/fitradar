import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/api/types";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6" role="status" aria-label="Carregando">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace state={{ from: location.pathname }} />;
  }

  if (
    !user.mustChangePassword &&
    user.termsAccepted === false &&
    location.pathname !== "/accept-terms"
  ) {
    return <Navigate to="/accept-terms" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "STUDENT" ? "/student" : "/app";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6" role="status" aria-label="Carregando">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    if (user.termsAccepted === false) {
      return <Navigate to="/accept-terms" replace />;
    }
    const from = (location.state as { from?: string } | null)?.from;
    const target = from ?? (user.role === "STUDENT" ? "/student" : "/app");
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
