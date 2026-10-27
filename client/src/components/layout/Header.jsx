import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, User, Settings, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Dropdown from '../common/Dropdown';

const Header = ({ title = 'Dashboard', onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userMenuItems = [
    { label: 'My Profile', icon: User, onClick: () => navigate('/profile') },
    { label: 'Settings', icon: Settings, onClick: () => navigate('/settings') },
    { label: 'Log Out', icon: LogOut, onClick: handleLogout },
  ];

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Traveler';

  return (
    <header className="h-16 md:h-20 bg-[#fffaf1]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-[#bca987] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input (Desktop) */}
        <div className="hidden md:flex relative w-64">
          <input
            type="text"
            placeholder="Search trips, places..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none focus:outline-none focus:ring-2 focus:ring-secondary-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </button>

        {/* Profile Dropdown */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
              <Avatar
                src={user?.profileImage}
                name={fullName}
                size="md"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{fullName}</p>
                <p className="text-[11px] text-slate-400">{user?.role || 'Explorer'}</p>
              </div>
            </div>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  );
};

export default Header;
