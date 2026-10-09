import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/common/LoadingState';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import Button from '../components/ui/Button';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <LoadingState message="Verifying administrative privileges..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 text-center">
        <div className="max-w-md mx-auto space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-rose-200 dark:border-rose-900/50">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">403 - Forbidden Access</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              You do not have permission to access the TripPilot AI Administrator Control Center.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/dashboard">
              <Button variant="primary" size="md">
                Return to User Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;
