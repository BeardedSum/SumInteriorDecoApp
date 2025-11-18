import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loading } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, fetchProfile, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // If we have a token but no user, fetch the profile
    const token = localStorage.getItem('accessToken');
    if (token && !user && !isLoading) {
      fetchProfile();
    }
  }, [user, fetchProfile, isLoading]);

  // Show loading while checking authentication
  if (isLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
