import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Renders child routes only when the user is authenticated.
 * Otherwise redirects to /login.
 * Shows a loading state while checking authentication.
 */
export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  
  // Show nothing while loading to prevent flash
  if (loading) {
    return null;
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
