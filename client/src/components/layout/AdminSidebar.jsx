import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Users,
  MapPin,
  Compass,
  Layers,
  Flag,
  Settings,
  ArrowLeft,
  X,
  Activity,
  BarChart3,
  Plane,
  Hotel,
} from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const adminMenuItems = [
    { label: 'Overview', path: '/admin', icon: Shield },
    { label: 'Provider Status', path: '/admin/providers', icon: Activity },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Destinations', path: '/admin/destinations', icon: MapPin },
    { label: 'Curated Content', path: '/admin/attractions', icon: Compass },
    { label: 'Collections', path: '/admin/collections', icon: Layers },
    { label: 'Reported Content', path: '/admin/reports', icon: Flag },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-64 bg-slate-950 text-slate-300 flex flex-col justify-between p-6 border-r border-slate-800/60 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block leading-none">Admin Control</span>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">TripPilot AI</span>
              </div>
            </Link>
            <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu */}
          <nav className="mt-6 space-y-1">
            {adminMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Return link */}
        <div className="pt-6 border-t border-slate-800">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to User App
          </Link>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
