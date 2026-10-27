import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import Alert from '../../components/common/Alert';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Moon, Sun, Lock, ShieldCheck, Key } from 'lucide-react';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { changePassword } = useAuth();
  const { showToast } = useToast();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMessage('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (result.success) {
        showToast('Password changed successfully.', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setErrorMessage(result.message || 'Failed to change password.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred while changing password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Manage your account security, notifications, and display preference
        </p>
      </div>

      {/* CHANGE PASSWORD CARD */}
      <Card className="p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
            <p className="text-xs text-slate-500">Update your security password for TripPilot AI</p>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="danger" title="Password Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password *"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, currentPassword: e.target.value })
            }
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password *"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              required
            />
            <Input
              label="Confirm New Password *"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={ShieldCheck}
              isLoading={isSubmitting}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* APPEARANCE THEME CARD */}
      <Card className="p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-stone-900">
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Display preference</h4>
            <p className="text-xs text-slate-500">Choose light or dark appearance for this browser</p>
          </div>
          <div role="group" aria-label="Display preference" className="flex gap-2">
            <Button variant={!isDark ? 'primary' : 'outline'} size="sm" aria-pressed={!isDark} onClick={() => isDark && toggleTheme()} icon={Sun}>
              Light
            </Button>
            <Button variant={isDark ? 'primary' : 'outline'} size="sm" aria-pressed={isDark} onClick={() => !isDark && toggleTheme()} icon={Moon}>
              Dark
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notification Preferences</h4>
          <Checkbox
            label="Email Trip Reminders"
            defaultChecked
            description="Receive notifications 3 days before upcoming trips"
          />
          <Checkbox
            label="AI Itinerary Suggestions"
            defaultChecked
            description="Get personalized destination recommendations"
          />
          <Checkbox
            label="Budget Overrun Alerts"
            defaultChecked
            description="Alert when logged expenses exceed 90% of budget"
          />
        </div>
      </Card>
    </div>
  );
};

export default Settings;
