import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Plane, User, LogIn, UserPlus, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const MobileDrawer = ({ isOpen, onClose, links = [], isAuthenticated, user, logout }) => {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 transition-transform">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
            <Link to="/" onClick={onClose} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary-600 flex items-center justify-center text-white font-bold">
                <Plane className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white text-lg">TripPilot AI</span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User badge if authenticated */}
          {isAuthenticated && (
            <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center gap-3">
              <Avatar src={user?.profileImage} name={`${user?.firstName} ${user?.lastName}`} size="md" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          )}

          {/* Links */}
          <nav className="mt-4 flex flex-col space-y-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition flex items-center gap-3 ${
                    isActive
                      ? 'bg-secondary-50 text-secondary-700 dark:bg-slate-800 dark:text-secondary-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated && (
              <>
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3"
                >
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={onClose}
                className="px-4 py-3 rounded-xl font-medium text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800"
              >
                Admin Control Center
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="md"
              className="w-full"
              icon={LogOut}
              onClick={() => {
                onClose();
                logout();
              }}
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Link to="/login" onClick={onClose}>
                <Button variant="outline" size="md" className="w-full" icon={LogIn}>
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={onClose}>
                <Button variant="primary" size="md" className="w-full" icon={UserPlus}>
                  Create Account
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
