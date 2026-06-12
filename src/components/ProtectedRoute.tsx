import { Navigate, useLocation } from 'react-router-dom';
import { useHospitalStore } from '@/store';
import type { UserRole } from '@/types';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser } = useHospitalStore();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    const defaultRoute: Record<UserRole, string> = {
      patient: '/patient',
      doctor: '/doctor',
      director: '/director',
      admin: '/admin',
    };
    return <Navigate to={defaultRoute[currentUser.role]} replace />;
  }

  return <>{children}</>;
}
