import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/common/Modal';
import Tabs from '../../components/common/Tabs';
import {
  User,
  Mail,
  Phone,
  Sparkles,
  Edit3,
  Compass,
  Heart,
  Car,
  Plane,
  Home as HomeIcon,
  Utensils,
  Activity,
  Calendar,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ALL_INTERESTS = [
  'Adventure',
  'Nature',
  'Beach',
  'Mountains',
  'Historical',
  'Cultural',
  'Food',
  'Wildlife',
  'Luxury',
  'Shopping',
  'Photography',
  'Family',
  'Relaxation',
];

const TRANSPORT_OPTIONS = ['Flight', 'Train', 'Car', 'Public'];
const ACCOMMODATION_OPTIONS = ['Hotel', 'Resort', 'Homestay', 'Hostel', 'Boutique'];
const FOOD_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Halal', 'Seafood', 'Local'];
const ACTIVITY_OPTIONS = [
  'Sightseeing',
  'Hiking',
  'Museums',
  'Beach',
  'Dining',
  'Shopping',
  'Nightlife',
  'Water Sports',
];

const Profile = () => {
  const { user, updateProfile, updateTravelPreferences } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit profile form state
  const [formData, setFormData] = useState({
    name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    avatar: user?.avatar || user?.profileImage || '',
  });

  // Travel preferences state
  const [preferences, setPreferences] = useState({
    budgetRange: user?.travelPreferences?.budgetRange || 'Moderate',
    travelStyle: user?.travelPreferences?.travelStyle || 'Moderate',
    preferredTransport: user?.travelPreferences?.preferredTransport || ['Flight', 'Train'],
    accommodationPreference: user?.travelPreferences?.accommodationPreference ||
      user?.travelPreferences?.accommodationType || ['Hotel', 'Resort'],
    interests: user?.travelPreferences?.interests || ['Beach', 'Nature', 'Food'],
    foodPreferences: user?.travelPreferences?.foodPreferences || ['Local'],
    preferredActivities: user?.travelPreferences?.preferredActivities || ['Sightseeing', 'Dining'],
    preferredTripDuration: user?.travelPreferences?.preferredTripDuration || '3-5 Days',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatar: user.avatar || user.profileImage || '',
      });
      setPreferences({
        budgetRange: user.travelPreferences?.budgetRange || 'Moderate',
        travelStyle: user.travelPreferences?.travelStyle || 'Moderate',
        preferredTransport: user.travelPreferences?.preferredTransport || ['Flight', 'Train'],
        accommodationPreference: user.travelPreferences?.accommodationPreference ||
          user.travelPreferences?.accommodationType || ['Hotel', 'Resort'],
        interests: user.travelPreferences?.interests || ['Beach', 'Nature', 'Food'],
        foodPreferences: user.travelPreferences?.foodPreferences || ['Local'],
        preferredActivities: user.travelPreferences?.preferredActivities || ['Sightseeing', 'Dining'],
        preferredTripDuration: user.travelPreferences?.preferredTripDuration || '3-5 Days',
      });
    }
  }, [user]);

  const toggleArrayItem = (category, item) => {
    setPreferences((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return { ...prev, [category]: updated };
    });
  };

  const handleSaveProfileDetails = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        showToast('Personal profile updated successfully! ✈️', 'success');
        setIsEditModalOpen(false);
      } else {
        showToast(result.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Error updating profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateTravelPreferences(preferences);
      if (result.success) {
        showToast('AI travel preferences updated! 🤖✨', 'success');
      } else {
        showToast(result.message || 'Failed to update travel preferences', 'error');
      }
    } catch (err) {
      showToast('Error saving travel preferences', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Personal Details', icon: User },
    { id: 'preferences', label: 'AI Travel Preferences', icon: Compass },
  ];

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Traveler';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">User Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Manage your personal identity, credentials, and AI travel agent context
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Edit3}
          onClick={() => {
            setFormData({
              name: displayName,
              firstName: user?.firstName || '',
              lastName: user?.lastName || '',
              phone: user?.phone || '',
              avatar: user?.avatar || user?.profileImage || '',
            });
            setIsEditModalOpen(true);
          }}
        >
          Edit Profile
        </Button>
      </div>

      {/* Profile Card Header */}
      <Card className="p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar
            src={user?.avatar || user?.profileImage}
            name={displayName}
            size="xl"
            className="ring-4 ring-secondary-500/20"
          />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
              <Badge variant={user?.role === 'ADMIN' ? 'accent' : 'secondary'} size="md">
                {user?.role || 'USER'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-secondary-600" />
              {user?.email}
            </p>
            {user?.phone && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {user?.phone}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'details' ? (
        <Card className="p-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Account Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Full Name
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{displayName}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Email Address
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Phone Number
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.phone || 'Not provided'}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                System Role
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.role || 'USER'}</p>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Account Status
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Active Account
              </span>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Travel Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Default baseline settings consumed by TripPilot AI Copilot for synthesis
              </p>
            </div>
            <Button
              variant="accent"
              size="sm"
              icon={Sparkles}
              isLoading={isSubmitting}
              onClick={handleSavePreferences}
            >
              Save Preferences
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select
              label="Default Budget Range"
              options={['Budget', 'Moderate', 'Luxury']}
              value={preferences.budgetRange}
              onChange={(e) => setPreferences({ ...preferences, budgetRange: e.target.value })}
            />
            <Select
              label="Travel Pacing & Style"
              options={['Relaxed', 'Moderate', 'Fast-Paced', 'Adventurous', 'Cultural', 'Luxury']}
              value={preferences.travelStyle}
              onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
            />
          </div>

          {/* Preferred Transport */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-secondary-500" />
              Preferred Modes of Transport
            </label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map((mode) => {
                const isSelected = (preferences.preferredTransport || []).includes(mode);
                return (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => toggleArrayItem('preferredTransport', mode)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-secondary-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{mode}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accommodation Preferences */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <HomeIcon className="w-3.5 h-3.5 text-secondary-500" />
              Accommodation Preference
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCOMMODATION_OPTIONS.map((type) => {
                const isSelected = (preferences.accommodationPreference || []).includes(type);
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleArrayItem('accommodationPreference', type)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-primary-900 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{type}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Interests & Travel Vibes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ALL_INTERESTS.map((interest) => {
                const isSelected = (preferences.interests || []).includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => toggleArrayItem('interests', interest)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                      isSelected
                        ? 'border-secondary-500 bg-secondary-50 dark:bg-slate-800 text-secondary-700 dark:text-secondary-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{interest}</span>
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'fill-current text-rose-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary & Food Preferences */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              Food & Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map((food) => {
                const isSelected = (preferences.foodPreferences || []).includes(food);
                return (
                  <button
                    type="button"
                    key={food}
                    onClick={() => toggleArrayItem('foodPreferences', food)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{food}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Activities */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Preferred Activities
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((act) => {
                const isSelected = (preferences.preferredActivities || []).includes(act);
                return (
                  <button
                    type="button"
                    key={act}
                    onClick={() => toggleArrayItem('preferredActivities', act)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{act}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Personal Profile"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveProfileDetails} className="space-y-4">
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Avatar Image URL"
            placeholder="https://images.unsplash.com/..."
            value={formData.avatar}
            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;

