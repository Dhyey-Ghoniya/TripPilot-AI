import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Dropdown from '../common/Dropdown';
import MobileDrawer from './MobileDrawer';
import BrandLogo from '../common/BrandLogo';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const publicLinks = [
    { label: 'Plan a trip', path: '/plan-trip' },
    { label: 'Explore', path: '/explore' },
    { label: 'Flights', path: '/flights' },
    { label: 'Stays', path: '/hotels' },
  ];
  const userLinks = [
    { label: 'Plan a trip', path: '/plan-trip' },
    { label: 'My trips', path: '/my-trips' },
    { label: 'Explore', path: '/explore' },
    { label: 'Flights', path: '/flights' },
    { label: 'Stays', path: '/hotels' },
  ];
  const currentLinks = isAuthenticated ? userLinks : publicLinks;
  const handleLogout = async () => { await logout(); navigate('/'); };
  const userMenuItems = [
    { label: 'My profile', icon: User, onClick: () => navigate('/profile') },
    { label: 'Dashboard', icon: LayoutDashboard, onClick: () => navigate('/dashboard') },
    { label: 'Settings', icon: Settings, onClick: () => navigate('/settings') },
    { label: 'Log out', icon: LogOut, onClick: handleLogout },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#bca987] bg-[#fffaf1]/95 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/95">
      <div className="page-shell"><div className="flex h-[4.5rem] items-center justify-between">
        <BrandLogo size="md" />
        <nav className="hidden items-center gap-1 md:flex">
          {currentLinks.map((link) => <Link key={link.path} to={link.path} className={`px-3 py-2 text-sm font-semibold transition-colors ${location.pathname === link.path ? 'text-secondary-700 dark:text-secondary-300' : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`}>{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? <Dropdown trigger={<div className="flex cursor-pointer items-center gap-2 border-l border-[#eadfd3] pl-3 dark:border-slate-700"><Avatar src={user?.profileImage} name={`${user?.firstName} ${user?.lastName}`} size="sm" /><span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.firstName}</span></div>} items={userMenuItems} /> : <div className="flex items-center gap-2 border-l border-[#eadfd3] pl-3 dark:border-slate-700"><Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link><Link to="/register"><Button variant="primary" size="sm">Create account</Button></Link></div>}
        </div>
        <div className="flex items-center gap-2 md:hidden"><button onClick={() => setIsDrawerOpen(true)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><Menu className="h-6 w-6" /></button></div>
      </div></div>
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} links={currentLinks} isAuthenticated={isAuthenticated} user={user} logout={handleLogout} />
    </header>
  );
};

export default Navbar;
