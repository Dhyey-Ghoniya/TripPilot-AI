import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Plane, Sun, Moon, Menu, User, Sparkles, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Dropdown from '../common/Dropdown';
import MobileDrawer from './MobileDrawer';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const publicLinks = [
    { label: 'AI Planner', path: '/plan-trip', badge: 'AI' },
    { label: 'Explore', path: '/explore' },
    { label: 'Flights', path: '/flights' },
    { label: 'Hotels', path: '/hotels' },
    { label: 'About', path: '/about' },
  ];

  const userLinks = [
    { label: 'AI Planner', path: '/plan-trip', badge: 'AI' },
    { label: 'My Trips', path: '/my-trips' },
    { label: 'Explore', path: '/explore' },
    { label: 'Flights', path: '/flights' },
    { label: 'Hotels', path: '/hotels' },
  ];

  const currentLinks = isAuthenticated ? userLinks : publicLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userMenuItems = [
    { label: 'My Profile', icon: User, onClick: () => navigate('/profile') },
    { label: 'Dashboard', icon: LayoutDashboard, onClick: () => navigate('/dashboard') },
    { label: 'Settings', icon: Settings, onClick: () => navigate('/settings') },
    { label: 'Logout', icon: LogOut, onClick: handleLogout },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-900 to-secondary-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Plane className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              TripPilot<span className="text-secondary-600 dark:text-secondary-400"> AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {currentLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-secondary-50 text-secondary-700 dark:bg-slate-800 dark:text-secondary-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-secondary-500 text-white leading-none">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
                      <Avatar
                        src={user?.profileImage}
                        name={`${user?.firstName} ${user?.lastName}`}
                        size="sm"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {user?.firstName}
                      </span>
                    </div>
                  }
                  items={userMenuItems}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        links={currentLinks}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={handleLogout}
      />
    </header>
  );
};

export default Navbar;
