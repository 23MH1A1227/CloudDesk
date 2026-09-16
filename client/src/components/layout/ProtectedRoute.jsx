import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FullPageLoading } from '../ui/States';

/**
 * Guards a route subtree.
 * - not signed in  -> /login (remembering where they were heading)
 * - wrong role     -> /dashboard
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, initialising, user } = useAuth();
  const location = useLocation();

  if (initialising) return <FullPageLoading label="Restoring your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

/** Keeps signed-in users away from the login/register pages. */
export function PublicOnlyRoute() {
  const { isAuthenticated, initialising } = useAuth();

  if (initialising) return <FullPageLoading />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
