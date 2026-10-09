import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/common/LoadingState';
import {
  ShieldAlert,
  Users,
  MapPin,
  Compass,
  Layers,
  Flag,
  Settings,
  Activity,
  ArrowRight,
  Info,
  CheckCircle2,
  Code2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [providersData, setProvidersData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, providerRes] = await Promise.all([
        adminService.getStats(),
        adminService.getProviderStatus(),
      ]);

      if (statsRes && statsRes.success) setStats(statsRes.data);
      if (providerRes && providerRes.success) setProvidersData(providerRes.data);
    } catch (err) {
      showToast('Failed to load admin overview metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Connected':
        return <Badge variant="success" size="sm">Connected</Badge>;
      case 'Unavailable':
        return <Badge variant="danger" size="sm">Unavailable</Badge>;
      case 'Mock/Development':
        return <Badge variant="warning" size="sm">Mock/Development</Badge>;
      case 'Integration Ready':
        return <Badge variant="info" size="sm">Integration Ready</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading administrative metrics & provider status..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-white space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Administrative Control Center — Module 15</span>
          </div>
          <Badge variant="accent" size="sm">Admin Authorized</Badge>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black">TripPilot AI System Control</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Manage users, curated content, travel collections, content moderation flags, system configurations, and external provider integration health.
          </p>
        </div>

        {/* Mandatory Infrastructure Notice */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-3 text-xs text-amber-300 font-medium">
          <Info className="w-5 h-5 shrink-0 text-amber-400" />
          <span>
            <strong>Architectural Guideline:</strong> {stats?.infrastructureNotice || 'The destination database is supporting infrastructure, NOT the primary product.'}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Total Users</span>
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.users?.total || 0}
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {stats?.users?.active || 0} Active • {stats?.users?.admins || 0} Admins
          </span>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Destinations</span>
            <MapPin className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.destinations?.total || 0}
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {stats?.destinations?.featured || 0} Featured Spots
          </span>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Curated Content</span>
            <Compass className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            {(stats?.curatedContent?.activities || 0) + (stats?.curatedContent?.attractions || 0)}
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {stats?.curatedContent?.collections || 0} Collections • {stats?.curatedContent?.activities || 0} Activities
          </span>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Pending Flags</span>
            <Flag className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            {stats?.reports?.pending || 0}
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            Community moderation queue
          </span>
        </Card>
      </div>

      {/* Provider Status Quick Summary Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Integration Dashboard — External Providers
          </h2>
          <Link to="/admin/providers">
            <Button variant="outline" size="sm" icon={ArrowRight}>
              Full Provider View
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providersData?.summary?.map((provider, idx) => (
            <Card key={idx} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {provider.name}
                </h3>
                {getStatusBadge(provider.status)}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{provider.details}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Admin Modules Quick Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Administrative Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/users">
            <Card className="p-6 space-y-3 hover:border-amber-500/50 transition group">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                User Management
              </h3>
              <p className="text-xs text-slate-400">
                Control user accounts, roles (USER/ADMIN), active statuses, and account deletions.
              </p>
            </Card>
          </Link>

          <Link to="/admin/destinations">
            <Card className="p-6 space-y-3 hover:border-amber-500/50 transition group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                Destinations Infrastructure
              </h3>
              <p className="text-xs text-slate-400">
                Manage curated destinations database supporting trip generation.
              </p>
            </Card>
          </Link>

          <Link to="/admin/collections">
            <Card className="p-6 space-y-3 hover:border-amber-500/50 transition group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                Travel Collections
              </h3>
              <p className="text-xs text-slate-400">
                Curate travel themes, weekend packages, and featured itinerary guides.
              </p>
            </Card>
          </Link>

          <Link to="/admin/attractions">
            <Card className="p-6 space-y-3 hover:border-amber-500/50 transition group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                Curated Experiences & Activities
              </h3>
              <p className="text-xs text-slate-400">
                Manage attractions, activities, and dining places across all destinations.
              </p>
            </Card>
          </Link>

          <Link to="/admin/reports">
            <Card className="p-6 space-y-3 hover:border-amber-500/50 transition group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <Flag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                Reported Content Moderation
              </h3>
              <p className="text-xs text-slate-400">
                Review and resolve user-submitted content flags and safety reports.
              </p>
            </Card>
          </Link>

          <Link to="/admin/settings">
            <Card className="p-6 space-y-3 hover:border-amber-500/50 transition group">
              <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition">
                System Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Toggle feature flags, default currencies, rate limit rules, and maintenance mode.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
