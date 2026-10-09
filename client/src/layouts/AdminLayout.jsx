import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar';
import Header from '../components/layout/Header';

const AdminLayout = () => {
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex transition-colors">
      <AdminSidebar isOpen={isAdminSidebarOpen} onClose={() => setIsAdminSidebarOpen(false)} />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header title="Admin Portal" onMobileMenuToggle={() => setIsAdminSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
