import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  loginPath?: string;
}

export function ProtectedRoute({ allowedRoles, loginPath = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, user, token } = useAuthStore();
  const { isLoading } = useAuth();

  if (token && isLoading && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
