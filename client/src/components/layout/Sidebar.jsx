import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, LayoutDashboard, Compass, Sparkles, MapPin, Heart, BookOpen, Settings, LogOut, X } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../common/BrandLogo';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();

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
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-64 bg-[#fffaf0] text-stone-900 border-r-2 border-stone-900 flex flex-col justify-between p-6 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Top Logo */}
          <div className="flex items-center justify-between pb-8 border-b-2 border-stone-900">
            <BrandLogo size="md" />
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-stone-500 hover:text-stone-900"
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
                      ? 'scrapbook-sticky text-stone-900'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#fff4e0]'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom CTA / Exit */}
        <div className="pt-6 border-t-2 border-stone-900 space-y-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition"
            >
              <span>Admin Portal</span>
            </Link>
          )}
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-500 hover:text-rose-600 text-xs font-semibold transition"
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
