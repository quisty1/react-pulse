import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../model/auth-store';
import { Skeleton } from '@/shared/ui';

export function ProtectedRoute() {
  const location = useLocation();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
