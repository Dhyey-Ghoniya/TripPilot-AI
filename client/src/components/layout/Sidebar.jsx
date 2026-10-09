import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, LayoutDashboard, Compass, Sparkles, MapPin, Heart, BookOpen, Settings, LogOut, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Planner', path: '/plan-trip', icon: Sparkles },
    { label: 'My Trips', path: '/my-trips', icon: Plane },
    { label: 'Flights', path: '/flights', icon: Compass },
    { label: 'Hotels', path: '/hotels', icon: MapPin },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Wishlist', path: '/wishlist', icon: Heart },
    { label: 'Travel Journal', path: '/journal', icon: BookOpen },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Top Logo */}
          <div className="flex items-center justify-between pb-8 border-b border-slate-800">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold shadow-md">
                <Plane className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                TripPilot<span className="text-secondary-400"> AI</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-secondary-600 text-white shadow-lg shadow-secondary-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom CTA / Portal Switcher */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition"
          >
            <span>Switch to Admin Portal</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            Exit Dashboard
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
