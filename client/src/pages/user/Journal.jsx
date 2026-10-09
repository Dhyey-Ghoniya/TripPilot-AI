import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import journalService from '../../services/journalService';
import tripService from '../../services/tripService';
import {
  BookOpen,
  Plus,
  Star,
  MapPin,
  Camera,
  Tag,
  Sparkles,
  BarChart3,
  Compass,
  PieChart,
  DollarSign,
  CheckCircle2,
  Calendar,
  Globe,
  Trash2,
  Edit,
  ShieldCheck,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

const Journal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('journal'); // 'journal', 'analytics', 'personalization'
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [personalization, setPersonalization] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailModalJournal, setDetailModalJournal] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    tripId: '',
    location: '',
    content: '',
    notes: '',
    memoriesStr: '',
    photosStr: '',
    highlightsStr: '',
    ratings: {
      overall: 5,
      accommodation: 5,
      activities: 5,
      transport: 5,
      food: 5,
    },
    placesVisited: [
      { name: '', category: 'Sightseeing', rating: 5, notes: '' },
    ],
    isPublic: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [journalsRes, analyticsRes, personalizationRes, tripsRes] = await Promise.all([
        journalService.getJournals(),
        journalService.getTripAnalytics(),
        journalService.getPersonalizationProfile(),
        tripService.getMyTrips({ limit: 50 }),
      ]);

      if (journalsRes?.data?.journals) {
        setJournals(journalsRes.data.journals);
      }
      if (analyticsRes?.data) {
        setAnalytics(analyticsRes.data);
      }
      if (personalizationRes?.data?.copilotPersonalization) {
        setPersonalization(personalizationRes.data.copilotPersonalization);
      }
      if (tripsRes?.data?.trips) {
        setUserTrips(tripsRes.data.trips);
      }
    } catch (err) {
      console.error('Error fetching journal & analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      tripId: userTrips[0]?._id || '',
      location: userTrips[0]?.destination?.name || '',
      content: '',
      notes: '',
      memoriesStr: '',
      photosStr: '',
      highlightsStr: '',
      ratings: { overall: 5, accommodation: 5, activities: 5, transport: 5, food: 5 },
      placesVisited: [{ name: '', category: 'Sightseeing', rating: 5, notes: '' }],
      isPublic: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (journal) => {
    setEditingId(journal._id);
    setFormData({
      title: journal.title || '',
      tripId: journal.tripId?._id || journal.tripId || '',
      location: journal.location || '',
      content: journal.content || '',
      notes: journal.notes || '',
      memoriesStr: (journal.memories || []).join('\n'),
      photosStr: (journal.photos || []).join('\n'),
      highlightsStr: (journal.highlights || []).join(', '),
      ratings: journal.ratings || { overall: 5, accommodation: 5, activities: 5, transport: 5, food: 5 },
      placesVisited: journal.placesVisited?.length > 0
        ? journal.placesVisited
        : [{ name: '', category: 'Sightseeing', rating: 5, notes: '' }],
      isPublic: journal.isPublic || false,
    });
    setIsModalOpen(true);
  };

  const handleAddPlaceRow = () => {
    setFormData((prev) => ({
      ...prev,
      placesVisited: [
        ...prev.placesVisited,
        { name: '', category: 'Sightseeing', rating: 5, notes: '' },
      ],
    }));
  };

  const handleRemovePlaceRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      placesVisited: prev.placesVisited.filter((_, i) => i !== index),
    }));
  };

  const handlePlaceChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.placesVisited];
      updated[index][field] = value;
      return { ...prev, placesVisited: updated };
    });
  };

  const handleSubmitJournal = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload = {
      title: formData.title.trim(),
      tripId: formData.tripId || null,
      location: formData.location.trim(),
      content: formData.content.trim() || formData.notes.trim() || 'Trip Reflection',
      notes: formData.notes.trim(),
      memories: formData.memoriesStr.split('\n').map((s) => s.trim()).filter(Boolean),
      photos: formData.photosStr.split('\n').map((s) => s.trim()).filter(Boolean),
      highlights: formData.highlightsStr.split(',').map((s) => s.trim()).filter(Boolean),
      ratings: formData.ratings,
      placesVisited: formData.placesVisited.filter((p) => p.name.trim() !== ''),
      isPublic: formData.isPublic,
    };

    try {
      if (editingId) {
        await journalService.updateJournal(editingId, payload);
      } else {
        await journalService.createJournal(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving journal:', err);
    }
  };

  const handleDeleteJournal = async (id) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await journalService.deleteJournal(id);
        if (detailModalJournal?._id === id) setDetailModalJournal(null);
        fetchData();
      } catch (err) {
        console.error('Error deleting journal:', err);
      }
    }
  };

  const filteredJournals = journals.filter((j) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.title?.toLowerCase().includes(term) ||
      j.location?.toLowerCase().includes(term) ||
      j.notes?.toLowerCase().includes(term) ||
      j.content?.toLowerCase().includes(term) ||
      (j.highlights && j.highlights.some((h) => h.toLowerCase().includes(term)))
    );
  });

  if (loading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading your Travel Journal & Analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            Module 14 — Post-Trip Intelligence Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Travel Journal & Analytics</h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Save trip notes, photo memories, ratings, and places visited. Review spending analytics and explore how your completed trips continuously tune your AI Copilot!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            icon={Plus}
            onClick={handleOpenCreateModal}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-lg shadow-teal-500/20"
          >
            New Journal Entry
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'journal'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Travel Journal ({journals.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'analytics'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Trip Analytics & Spending
        </button>

        <button
          onClick={() => setActiveTab('personalization')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'personalization'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Future AI Personalization
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TAB 1: TRAVEL JOURNAL
         ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, memories, places, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              Showing {filteredJournals.length} of {journals.length} memory entries
            </p>
          </div>

          {filteredJournals.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center mx-auto text-teal-600">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">No Travel Journal Entries Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Capture notes, photo memories, ratings, places visited, and highlights from your trips!
              </p>
              <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreateModal}>
                Log First Journal Entry
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJournals.map((j) => (
                <Card key={j._id} className="p-6 space-y-4 hover:shadow-xl transition-all flex flex-col justify-between group">
                  <div className="space-y-3">
                    {/* Header: Location & Ratings */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {j.location && (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md mb-1">
                            <MapPin className="w-3 h-3" />
                            {j.location}
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 transition-colors">
                          {j.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg text-xs font-bold border border-amber-200/50">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {j.ratings?.overall || 5}.0
                      </div>
                    </div>

                    {/* Photos Preview */}
                    {j.photos && j.photos.length > 0 && (
                      <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={j.photos[0]}
                          alt={j.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        {j.photos.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                            <Camera className="w-3 h-3" />+{j.photos.length - 1} more
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes & Memories snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {j.notes || j.content}
                    </p>

                    {/* Places Visited Chip */}
                    {j.placesVisited && j.placesVisited.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Compass className="w-3 h-3" /> Places:
                        </span>
                        {j.placesVisited.slice(0, 3).map((pv, idx) => (
                          <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {pv.name} ({pv.rating}★)
                          </span>
                        ))}
                        {j.placesVisited.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{j.placesVisited.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Highlights */}
                    {j.highlights && j.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {j.highlights.map((hl, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200/40">
                            ✨ {hl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setDetailModalJournal(j)}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
                    >
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(j)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteJournal(j._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 2: TRIP ANALYTICS
         ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-6 space-y-2 border-l-4 border-l-teal-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spending</span>
                <DollarSign className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{(analytics?.totalSpending || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Out of ₹{(analytics?.totalBudget || 0).toLocaleString()} allocated budget
              </p>
            </Card>

            <Card className="p-6 space-y-2 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activities Completed</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics?.activitiesCompleted?.totalCompleted || 0}
              </p>
              <p className="text-xs text-emerald-600 font-semibold">
                {analytics?.activitiesCompleted?.completionRate || 100}% Completion rate
              </p>
            </Card>

            <Card className="p-6 space-y-2 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destinations Visited</span>
                <Globe className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics?.destinationsVisited?.totalDestinations || 0}
              </p>
              <p className="text-xs text-slate-500">
                Across {analytics?.destinationsVisited?.totalCountries || 1} countries
              </p>
            </Card>

            <Card className="p-6 space-y-2 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Days Traveled</span>
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {analytics?.travelPatterns?.totalDaysTraveled || 0} Days
              </p>
              <p className="text-xs text-slate-500">
                Avg. {analytics?.travelPatterns?.averageTripDurationDays || 5} days per journey
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spending Categories Card */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Spending Categories</h3>
                  <p className="text-xs text-slate-500">Breakdown across flights, stays, food, activities & transport</p>
                </div>
                <PieChart className="w-5 h-5 text-teal-600" />
              </div>

              <div className="space-y-4">
                {analytics?.spendingCategories?.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="text-slate-900 dark:text-white">
                        ₹{item.amount.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Travel Patterns Card */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Derived Travel Patterns</h3>
                  <p className="text-xs text-slate-500">Behavioral insights analyzed from completed trip data</p>
                </div>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Top Interests</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {analytics?.travelPatterns?.favoriteInterests?.join(', ') || 'Nature, Adventure'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Preferred Transport</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {analytics?.travelPatterns?.preferredTransport?.join(', ') || 'Public transport'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Accommodation Tier</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {analytics?.travelPatterns?.preferredAccommodation?.join(', ') || 'Budget hotels'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Pacing & Duration</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {analytics?.travelPatterns?.preferredTravelStyle || 'Balanced'}, ~
                    {analytics?.travelPatterns?.averageTripDurationDays || 5} Days
                  </p>
                </div>
              </div>

              {/* Destinations list */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visited Destinations</h4>
                <div className="flex flex-wrap gap-2">
                  {analytics?.destinationsVisited?.list?.map((d, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold text-xs border border-teal-200/50 flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-500" />
                      {d.name} ({d.visitCount} {d.visitCount > 1 ? 'trips' : 'trip'})
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 3: FUTURE AI PERSONALIZATION
         ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'personalization' && (
        <div className="space-y-8">
          <Card className="p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white space-y-6 shadow-2xl relative overflow-hidden border border-teal-500/20">
            <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black">AI Copilot Personalization Matrix</h2>
                <p className="text-xs text-slate-400">
                  Your past completed trips & journals continuously refine recommendations for future journeys.
                </p>
              </div>
            </div>

            {/* Example Box requested by prompt */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-teal-500/30 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-xs text-teal-400 font-mono">
                <span>// Active Learned User Preferences Model</span>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-sans font-bold">
                  AUTO-TUNED
                </span>
              </div>

              {/* Exact format requested by Module 14 specification */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Personalization Model Output:</span>
                <pre className="bg-slate-950/90 text-teal-300 p-4 rounded-xl font-mono text-sm leading-relaxed border border-teal-500/20 shadow-inner">
{personalization?.formattedSummary || `User frequently chooses:\nNature\nAdventure\nBudget hotels\nPublic transport`}
                </pre>
              </div>

              <div className="space-y-2 font-mono text-sm text-slate-200 pt-2 border-t border-slate-800">
                <p className="text-amber-300 font-bold">Learned Operational Dimensions:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                  <li><span className="text-white font-semibold">Interests:</span> {personalization?.learnedInterests?.join(', ') || 'Nature, Adventure'}</li>
                  <li><span className="text-white font-semibold">Stay Style:</span> {personalization?.preferredAccommodation?.join(', ') || 'Budget hotels'}</li>
                  <li><span className="text-white font-semibold">Local Transit:</span> {personalization?.preferredTransport?.join(', ') || 'Public transport'}</li>
                  <li><span className="text-white font-semibold">Budget Tier:</span> {personalization?.learnedBudgetTier || 'Moderate'}</li>
                </ul>
              </div>
            </div>

            {/* Privacy Compliance Banner */}
            <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-500/30 flex items-start gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5">🔒 Strict Non-Sensitive Personalization Guarantee</p>
                <p className="text-slate-400">
                  {personalization?.privacyNotice || 'Anti-bias Privacy Protection: All inferred data is strictly limited to non-sensitive travel parameters. The AI never infers sensitive personal characteristics such as religion, race, politics, or financial specifics.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                icon={Compass}
                onClick={() => navigate('/plan-trip')}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
              >
                Plan Next Trip With Personalized AI
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: CREATE / EDIT JOURNAL ENTRY
         ───────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Travel Journal Entry' : 'Log New Travel Journal Entry'}
      >
        <form onSubmit={handleSubmitJournal} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Trip selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Associated Trip</label>
              <select
                value={formData.tripId}
                onChange={(e) => {
                  const selectedTrip = userTrips.find((t) => t._id === e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    tripId: e.target.value,
                    location: selectedTrip?.destination?.name || prev.location,
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- General Entry / Standalone --</option>
                {userTrips.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.destination?.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Location / City</label>
              <input
                type="text"
                required
                placeholder="e.g. Manali, Dubai, Paris"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Journal Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Unforgettable Sunset at Solang Valley"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes & Personal Reflection</label>
            <textarea
              rows={4}
              required
              placeholder="Write your notes, feelings, and trip summary..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Key Memories & Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Memories (1 per line)</label>
              <textarea
                rows={3}
                placeholder="Rented a bike at 6 AM&#10;Tried local spicy momos&#10;Stargazing at campsite"
                value={formData.memoriesStr}
                onChange={(e) => setFormData({ ...formData, memoriesStr: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Highlights (comma separated)</label>
              <textarea
                rows={3}
                placeholder="Nature, Desert Dune Bashing, Local Street Food, Scenic View"
                value={formData.highlightsStr}
                onChange={(e) => setFormData({ ...formData, highlightsStr: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Photo URLs */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Photo URLs (1 per line)</label>
            <textarea
              rows={2}
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.photosStr}
              onChange={(e) => setFormData({ ...formData, photosStr: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Star Ratings Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Trip Ratings (1 - 5 Stars)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {['overall', 'accommodation', 'activities', 'transport', 'food'].map((cat) => (
                <div key={cat} className="space-y-1">
                  <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">{cat}</span>
                  <select
                    value={formData.ratings[cat]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ratings: { ...formData.ratings, [cat]: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-amber-500"
                  >
                    {[5, 4, 3, 2, 1].map((num) => (
                      <option key={num} value={num}>
                        {num} Stars ★
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Places Visited list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Places Visited & Ratings</label>
              <button
                type="button"
                onClick={handleAddPlaceRow}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Place
              </button>
            </div>

            {formData.placesVisited.map((pv, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <input
                  type="text"
                  placeholder="Place Name (e.g. Hadimba Temple)"
                  value={pv.name}
                  onChange={(e) => handlePlaceChange(idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                <select
                  value={pv.rating}
                  onChange={(e) => handlePlaceChange(idx, 'rating', Number(e.target.value))}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-amber-500"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r}★
                    </option>
                  ))}
                </select>
                {formData.placesVisited.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlaceRow(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="md" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="bg-teal-600 text-white font-bold">
              {editingId ? 'Save Changes' : 'Publish Journal Entry'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: VIEW JOURNAL DETAILS
         ───────────────────────────────────────────────────────────────── */}
      {detailModalJournal && (
        <Modal
          isOpen={Boolean(detailModalJournal)}
          onClose={() => setDetailModalJournal(null)}
          title={detailModalJournal.title}
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              {detailModalJournal.location && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5" /> {detailModalJournal.location}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-amber-400" /> {detailModalJournal.ratings?.overall || 5}.0 Stars
              </div>
            </div>

            {/* Photos */}
            {detailModalJournal.photos?.length > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                {detailModalJournal.photos.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Photo ${idx}`}
                    className="w-full h-40 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                ))}
              </div>
            )}

            {/* Reflection / Notes */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Notes & Reflection</h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                {detailModalJournal.notes || detailModalJournal.content}
              </p>
            </div>

            {/* Memories */}
            {detailModalJournal.memories?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Key Trip Memories</h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {detailModalJournal.memories.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Places Visited */}
            {detailModalJournal.placesVisited?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Places Visited</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailModalJournal.placesVisited.map((pv, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{pv.name}</span>
                      <span className="font-bold text-amber-500">{pv.rating}★</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Journal;
