import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Tabs from '../../components/common/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/common/Modal';
import tripService from '../../services/tripService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Plane,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  Trash2,
  Share2,
  Copy,
  Archive,
  CheckCircle2,
  Printer,
  Edit3,
  ExternalLink,
  Plus,
  BarChart3,
  Globe,
  Wallet,
  Clock,
  BookOpen,
  Compass,
  FileText,
  X,
  Lock,
} from 'lucide-react';

const MyTrips = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'drafts' | 'saved' | 'completed' | 'archived' | 'all'
  const [trips, setTrips] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Action States
  const [editingTrip, setEditingTrip] = useState(null);
  const [sharingTrip, setSharingTrip] = useState(null);
  const [exportingTrip, setExportingTrip] = useState(null);
  const [deleteConfirmTripId, setDeleteConfirmTripId] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    budgetTotal: 25000,
    travelStyle: 'balanced',
    notes: '',
  });

  const fetchTripsAndAnalytics = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const [tripsRes, analyticsRes] = await Promise.all([
          tripService.getMyTrips({ tab: activeTab }),
          tripService.getCompletedAnalytics().catch(() => null),
        ]);

        setTrips(tripsRes?.data?.trips || []);
        if (analyticsRes?.data) setAnalytics(analyticsRes.data);
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.warn('[MyTrips] Fetch warning:', err.message);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndAnalytics();
  }, [isAuthenticated, activeTab]);

  // ── ACTIONS ─────────────────────────────────────────────────────────

  // Action 1: Duplicate Trip (1-Click Clone)
  const handleDuplicateTrip = async (tripId) => {
    try {
      const res = await tripService.duplicateTrip(tripId);
      addToast(`Cloned trip blueprint as "${res?.data?.title}"!`, 'success');
      fetchTripsAndAnalytics();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not duplicate trip.', 'error');
    }
  };

  // Action 2: Archive / Restore Trip
  const handleArchiveTrip = async (tripId) => {
    try {
      const res = await tripService.archiveTrip(tripId);
      addToast(res?.message || 'Trip status updated.', 'info');
      fetchTripsAndAnalytics();
    } catch (err) {
      addToast('Could not update archive status.', 'error');
    }
  };

  // Action 3: Mark Completed
  const handleMarkCompleted = async (tripId) => {
    try {
      const res = await tripService.markCompleted(tripId);
      addToast(res?.message || '🎉 Trip marked completed! Travel history updated.', 'success');
      fetchTripsAndAnalytics();
    } catch (err) {
      addToast('Could not mark trip completed.', 'error');
    }
  };

  // Action 4: Delete Trip
  const handleDeleteTrip = async () => {
    if (!deleteConfirmTripId) return;
    try {
      await tripService.deleteTrip(deleteConfirmTripId);
      addToast('Trip blueprint deleted.', 'info');
      setDeleteConfirmTripId(null);
      fetchTripsAndAnalytics();
    } catch (err) {
      addToast('Could not delete trip.', 'error');
    }
  };

  // Action 5: Open Edit Modal
  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setEditForm({
      title: trip.title || '',
      budgetTotal: trip.budget?.total || 25000,
      travelStyle: trip.travelStyle || 'balanced',
      notes: trip.notes || '',
    });
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTrip) return;
    try {
      await tripService.updateTrip(editingTrip._id, {
        title: editForm.title,
        'budget.total': Number(editForm.budgetTotal),
        travelStyle: editForm.travelStyle,
        notes: editForm.notes,
      });
      addToast('Trip details updated successfully!', 'success');
      setEditingTrip(null);
      fetchTripsAndAnalytics();
    } catch (err) {
      addToast('Error saving trip changes.', 'error');
    }
  };

  // Action 6: Share Link Generator
  const handleShareClick = (trip) => {
    setSharingTrip(trip);
  };

  const copyShareLink = () => {
    if (!sharingTrip) return;
    const shareCode = sharingTrip.shareSettings?.shareCode || 'TRIP123';
    const link = `${window.location.origin}/share/trip/${shareCode}`;
    navigator.clipboard.writeText(link);
    addToast('Secure read-only share link copied to clipboard!', 'success');
  };

  // Action 7: Export Trip
  const handleExportTrip = async (trip) => {
    try {
      const res = await tripService.exportTrip(trip._id);
      setExportingTrip(res?.data || res);
    } catch (err) {
      addToast('Could not export trip data.', 'error');
    }
  };

  const printExportWindow = () => {
    window.print();
  };

  // Tab configurations
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'all', label: 'All Trips', icon: Compass },
  ];

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8 pb-20">
      {/* Printable CSS styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-itinerary, #printable-itinerary * { visibility: visible; }
          #printable-itinerary { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Trips</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Central Trip Management Engine — manage upcoming journeys, drafts, saved blueprints, and completed travel history
          </p>
        </div>
        <Link to="/plan-trip">
          <Button variant="primary" size="md" icon={Plus} className="shadow-lg shadow-primary-500/20">
            Plan New Trip
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* COMPLETED TRIPS ANALYTICS BANNER (When viewing Completed tab) */}
      {activeTab === 'completed' && analytics?.travelHistory && (
        <Card className="p-6 border border-emerald-200/60 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Travel History & Completed Analytics</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/journal')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" /> Open Travel Journal & Intelligence
              </button>
              <Badge variant="emerald" size="sm">Passport Verified</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Trips</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{analytics.travelHistory.totalCompletedTrips}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Countries Visited</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{analytics.travelHistory.countriesCount}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Days Traveled</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{analytics.travelHistory.totalDaysTraveled} Days</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Actual Spent</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(analytics.expenseAnalysis?.totalSpent)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* TRIPS GRID OR EMPTY STATE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <span className="text-xs text-slate-400 font-semibold">Loading trip management data...</span>
        </div>
      ) : trips.length === 0 ? (
        <Card className="p-12 text-center space-y-4 max-w-lg mx-auto border-dashed border-2 border-slate-300 dark:border-slate-700">
          <div className="w-12 h-12 rounded-2xl bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No trips found in "{activeTab}"</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an AI-engineered trip blueprint or duplicate an existing itinerary to start managing your journey.
          </p>
          <Link to="/plan-trip">
            <Button variant="primary" size="md" icon={Sparkles}>
              Plan New Trip with AI
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => {
            const destName = trip.destination?.name || 'Destination';
            const imgUrl =
              trip.destination?.coverImage ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
            const totalBudget = trip.budget?.total || 0;

            return (
              <Card
                key={trip._id}
                className="overflow-hidden hover:shadow-xl transition-all border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Cover */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={
                          trip.status === 'completed'
                            ? 'emerald'
                            : trip.status === 'archived'
                            ? 'neutral'
                            : trip.status === 'upcoming'
                            ? 'success'
                            : 'accent'
                        }
                        size="sm"
                      >
                        {trip.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Quick Toolbar */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={() => handleShareClick(trip)}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white transition backdrop-blur-md"
                        title="Share Trip Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTrip(trip._id)}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white transition backdrop-blur-md"
                        title="Duplicate (1-Click Clone)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(trip)}
                        className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white transition backdrop-blur-md"
                        title="Edit Trip"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] uppercase font-bold text-slate-300 block">
                        {trip.dates?.durationDays || 5} Days · {trip.travelers?.count || 1} Travelers
                      </span>
                      <h3 className="text-xl font-black truncate">{trip.title}</h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-secondary-500" />
                        {destName}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Budget: {formatCurrency(totalBudget)}
                      </span>
                    </div>

                    {trip.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                        "{trip.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions Row */}
                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <Link to={`/trips/${trip._id}`}>
                      <Button variant="primary" size="sm" icon={ExternalLink} className="w-full">
                        Open
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Printer}
                      onClick={() => handleExportTrip(trip)}
                    >
                      Export / Print
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    {trip.status === 'completed' ? (
                      <button
                        onClick={() => navigate('/journal')}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Travel Journal
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkCompleted(trip._id)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}
                    <button
                      onClick={() => handleArchiveTrip(trip._id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold flex items-center gap-1"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {trip.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmTripId(trip._id)}
                      className="text-red-400 hover:text-red-600 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* EDIT TRIP MODAL                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={Boolean(editingTrip)}
        onClose={() => setEditingTrip(null)}
        title="Edit Trip Blueprint"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Trip Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Budget (₹)</label>
            <input
              type="number"
              value={editForm.budgetTotal}
              onChange={(e) => setEditForm({ ...editForm, budgetTotal: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows="3"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingTrip(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECURE SHARE TRIP MODAL                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={Boolean(sharingTrip)}
        onClose={() => setSharingTrip(null)}
        title="Share Trip Blueprint"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 py-2">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Read-Only Privacy Guaranteed</span>
            </div>
            <p className="text-slate-500">Shared users receive view-only access. Owner private account details are never exposed.</p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Shareable Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/share/trip/${sharingTrip?.shareSettings?.shareCode || 'TRIP123'}`}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none"
              />
              <Button variant="primary" size="sm" icon={Copy} onClick={copyShareLink}>
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PRINTABLE ITINERARY / EXPORT OVERLAY                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {exportingTrip && (
        <Modal
          isOpen={Boolean(exportingTrip)}
          onClose={() => setExportingTrip(null)}
          title="Printable Itinerary & Journey View"
          maxWidth="max-w-3xl"
        >
          <div id="printable-itinerary" className="space-y-6 py-2">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{exportingTrip.trip?.title}</h2>
                <p className="text-xs text-slate-500">
                  {exportingTrip.trip?.destination} ({exportingTrip.trip?.durationDays} Days) · Total Budget: ₹{exportingTrip.trip?.totalBudget?.toLocaleString('en-IN')}
                </p>
              </div>
              <Button variant="primary" size="sm" icon={Printer} onClick={printExportWindow}>
                Print / Download PDF
              </Button>
            </div>

            {/* Itinerary Schedule */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Day-by-Day Schedule</h3>
              {(exportingTrip.itineraryDays || []).map((day) => (
                <div key={day.dayNumber} className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-900">Day {day.dayNumber}: {day.title}</h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    {(day.activities || []).map((act, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                        <span>{act.time} — <strong>{act.activity}</strong> ({act.location})</span>
                        <span className="font-semibold">₹{act.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deleteConfirmTripId)}
        onClose={() => setDeleteConfirmTripId(null)}
        title="Confirm Delete"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 py-2 text-center">
          <p className="text-xs text-slate-500">Are you sure you want to permanently delete this trip and its itinerary?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmTripId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteTrip}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyTrips;
