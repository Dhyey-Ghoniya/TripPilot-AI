import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import LoadingState from '../../components/common/LoadingState';
import { Settings, Save, ShieldCheck, ToggleLeft, ToggleRight, AlertCircle, RefreshCw } from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminSettings = () => {
  const { showToast } = useToast();
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await adminService.getSystemConfig();
      if (res && res.success) {
        setConfig(res.data);
      }
    } catch (err) {
      showToast('Failed to load system configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggleFlag = (flagKey) => {
    if (!config) return;
    setConfig((prev) => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [flagKey]: !prev.featureFlags?.[flagKey],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await adminService.updateSystemConfig(config);
      if (res && res.success) {
        showToast('System configuration saved successfully! ✨', 'success');
        setConfig(res.data);
      }
    } catch (err) {
      showToast('Failed to save system configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading platform configuration settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            System Configuration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Control platform defaults, rate limits, feature flags, and global system status notices
          </p>
        </div>
        <Button variant="primary" size="md" icon={Save} isLoading={isSaving} onClick={handleSubmit}>
          Save Configurations
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Settings Card */}
        <Card className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            General Platform Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Platform Name"
              value={config.platformName || ''}
              onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
            />
            <Input
              label="Support Contact Email"
              value={config.supportEmail || ''}
              onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
            />
          </div>

          <Input
            label="Tagline / Hero Subtitle"
            value={config.tagline || ''}
            onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Base Currency"
              options={['INR', 'USD', 'EUR', 'GBP', 'AED']}
              value={config.defaultCurrency || 'INR'}
              onChange={(e) => setConfig({ ...config, defaultCurrency: e.target.value })}
            />
            <Input
              label="Rate Limit (Max Req / 15m)"
              type="number"
              value={config.rateLimitMax || 100}
              onChange={(e) => setConfig({ ...config, rateLimitMax: Number(e.target.value) })}
            />
          </div>

          <Textarea
            label="Global System Notice Banner"
            rows={2}
            placeholder="e.g. System operating normally. AI models connected."
            value={config.systemNotice || ''}
            onChange={(e) => setConfig({ ...config, systemNotice: e.target.value })}
          />
        </Card>

        {/* Feature Flags Card */}
        <Card className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Platform Feature Flags & Module Toggles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'enableAiPlanner', label: 'AI Itinerary Generator', desc: 'Enable AI trip generator & prompt processing' },
              { key: 'enableFlightSearch', label: 'Flight Search Engine', desc: 'Enable 6-provider flight fare matrix' },
              { key: 'enableHotelSearch', label: 'Hotel Search Engine', desc: 'Enable 6-provider stay search matrix' },
              { key: 'enableRealTimeWeather', label: 'Real-Time Weather API', desc: 'Enable live Open-Meteo weather integration' },
              { key: 'enableMapNavigation', label: 'OpenStreetMap Routing', desc: 'Enable Haversine & OSRM distance engine' },
              { key: 'allowUserRegistrations', label: 'User Signups Allowed', desc: 'Allow new user account registrations' },
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Show maintenance banner to non-admin users' },
            ].map((flag) => {
              const isActive = Boolean(config.featureFlags?.[flag.key]);
              return (
                <div
                  key={flag.key}
                  onClick={() => handleToggleFlag(flag.key)}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{flag.label}</h4>
                    <p className="text-[11px] text-slate-400">{flag.desc}</p>
                  </div>
                  <div className={`text-2xl transition ${isActive ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
                    {isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" icon={Save} isLoading={isSaving}>
            Save All Configurations
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
