import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/common/LoadingState';
import {
  Activity,
  Plane,
  Hotel,
  Map,
  CloudSun,
  CheckCircle2,
  AlertTriangle,
  Code2,
  RefreshCw,
  Info,
  ShieldCheck,
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminProviders = () => {
  const { showToast } = useToast();
  const [providersData, setProvidersData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProviders = async () => {
    try {
      const response = await adminService.getProviderStatus();
      if (response && response.success) {
        setProvidersData(response.data);
      }
    } catch (err) {
      showToast('Failed to fetch provider status', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProviders();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Connected':
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </Badge>
        );
      case 'Unavailable':
        return (
          <Badge variant="danger" size="sm" className="flex items-center gap-1 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Unavailable
          </Badge>
        );
      case 'Mock/Development':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1 font-bold">
            <Code2 className="w-3.5 h-3.5" />
            Mock/Development
          </Badge>
        );
      case 'Integration Ready':
        return (
          <Badge variant="info" size="sm" className="flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Integration Ready
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getCategoryIcon = (name) => {
    if (name.includes('Flight')) return Plane;
    if (name.includes('Hotel')) return Hotel;
    if (name.includes('Map')) return Map;
    if (name.includes('Weather')) return CloudSun;
    return Activity;
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Performing real-time status checks on external providers..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Integration Status Dashboard</span>
            </div>
            <h1 className="text-3xl font-black">External Provider Status</h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
              Real-time operational status for flight matrix, hospitality search adapters, OpenStreetMap GIS, and Open-Meteo weather APIs.
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            isLoading={isRefreshing}
            onClick={handleRefresh}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Refresh Status
          </Button>
        </div>

        {/* Strict Honesty Notice */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2.5 text-xs text-amber-300 font-medium">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Integrity Rule:</strong> Provider statuses reflect true runtime responses. We never pretend a provider is live when it is not.
          </span>
        </div>
      </div>

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providersData?.summary?.map((provider, idx) => {
          const IconComponent = getCategoryIcon(provider.name);
          return (
            <Card key={idx} className="p-6 space-y-6 flex flex-col justify-between border-slate-200 dark:border-slate-800">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">
                        {provider.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">{provider.category}</p>
                    </div>
                  </div>
                  <div>{getStatusBadge(provider.status)}</div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {provider.description}
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Operational Detail
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {provider.details}
                  </div>
                </div>

                {/* Sub-adapters list if present */}
                {provider.adapters && provider.adapters.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Connected Adapters ({provider.adapters.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {provider.adapters.map((adapter, aIdx) => (
                        <div
                          key={aIdx}
                          className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {adapter.name}
                          </span>
                          <span className="shrink-0">{getStatusBadge(adapter.status)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Active Adapters: <strong>{provider.activeAdaptersCount}</strong></span>
                <span>System Health: <strong>100% Monitored</strong></span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminProviders;
