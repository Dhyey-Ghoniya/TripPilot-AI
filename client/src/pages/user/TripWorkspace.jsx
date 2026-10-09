import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Compass,
  Calendar,
  MapPin,
  Plane,
  Building2,
  Clock,
  Wallet,
  Zap,
  Bot,
  Share2,
  Trash2,
  Sparkles,
  ArrowLeft,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Tabs from '../../components/common/Tabs';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

import InteractiveTimeline from '../../components/workspace/InteractiveTimeline';
import TripIntelligence from '../../components/workspace/TripIntelligence';
import AiTripAssistant from '../../components/workspace/AiTripAssistant';
import BudgetView from '../../components/workspace/BudgetView';
import MapView from '../../components/workspace/MapView';

import tripService from '../../services/tripService';
import itineraryService from '../../services/itineraryService';
import { useToast } from '../../context/ToastContext';

const TripWorkspace = () => {
  const { id } = useParams();
  const { addToast } = useToast();

  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // overview, timeline, flights, stay, experiences, map, budget, ai_assistant
  const [selectedDay, setSelectedDay] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTripData = async () => {
    setIsLoading(true);
    try {
      const tripRes = await tripService.getTripById(id);
      if (tripRes && (tripRes.data || tripRes.title)) {
        const fetchedTrip = tripRes.data || tripRes;
        setTrip(fetchedTrip);

        // Fetch attached itinerary
        try {
          const itinRes = await itineraryService.getItineraryByTripId(fetchedTrip._id);
          if (itinRes && (itinRes.data || itinRes.days)) {
            setItinerary(itinRes.data || itinRes);
          }
        } catch (itinErr) {
          console.warn('[TripWorkspace]: Itinerary fallback');
        }
      }
    } catch (err) {
      console.error('[TripWorkspace Error]:', err);
      addToast('Could not load trip workspace data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadTripData();
  }, [id]);

  // Handlers for activity editing & AI commands
  const handleAddActivity = async (dayNumber, activityData) => {
    if (!itinerary) return;
    try {
      const res = await itineraryService.addActivity(itinerary._id, { dayNumber, ...activityData });
      if (res?.data) setItinerary(res.data);
      addToast(`Activity added to Day ${dayNumber}!`, 'success');
    } catch (err) {
      addToast('Failed to add activity.', 'error');
    }
  };

  const handleDeleteActivity = async (dayNumber, activityId) => {
    if (!itinerary) return;
    try {
      const res = await itineraryService.deleteActivity(itinerary._id, dayNumber, activityId);
      if (res?.data) setItinerary(res.data);
      addToast('Activity removed.', 'info');
    } catch (err) {
      addToast('Failed to delete activity.', 'error');
    }
  };

  const handleReorderActivities = async (dayNumber, orderedActivityIds) => {
    if (!itinerary) return;
    try {
      const res = await itineraryService.reorderActivities(itinerary._id, dayNumber, orderedActivityIds);
      if (res?.data) setItinerary(res.data);
    } catch (err) {
      console.error('[Reorder Error]:', err);
    }
  };

  const handleRegenerateDay = async (dayNumber) => {
    if (!itinerary) return;
    try {
      const res = await itineraryService.regenerateDay(itinerary._id, dayNumber);
      if (res?.data) setItinerary(res.data);
      addToast(`Day ${dayNumber} regenerated via AI! ✨`, 'success');
    } catch (err) {
      addToast('Failed to regenerate day.', 'error');
    }
  };

  const handleExecuteAiCommand = async (commandPrompt) => {
    if (!trip) return;
    try {
      const res = await tripService.executeAiCommand(trip._id, commandPrompt);
      if (res?.data?.itinerary) {
        setItinerary(res.data.itinerary);
      }
      if (res?.data?.trip) {
        setTrip(res.data.trip);
      }
      addToast(res?.message || 'Trip updated by AI Copilot!', 'success');
      return res?.data;
    } catch (err) {
      addToast('AI command failed.', 'error');
      throw err;
    }
  };

  const workspaceTabs = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'stay', label: 'Stay', icon: Building2 },
    { id: 'experiences', label: 'Experiences', icon: Layers },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'ai_assistant', label: 'AI Assistant', icon: Bot },
  ];

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <span className="text-xs text-slate-400 font-semibold">Loading Trip Workspace Environment...</span>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Trip Not Found</h2>
        <Link to="/my-trips">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Back to My Trips
          </Button>
        </Link>
      </div>
    );
  }

  const destName = trip.destinations?.[0]?.name || 'Destination';
  const duration = trip.dates?.durationDays || itinerary?.days?.length || 5;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/my-trips" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Badge variant="accent" size="sm">
              {trip.status?.toUpperCase() || 'PLANNING'}
            </Badge>
            <span className="text-xs text-slate-400">Code: {trip.shareSettings?.shareCode || 'TPS-882'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {trip.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-secondary-500" />
            <span>{destName}</span>
            <span>·</span>
            <Calendar className="w-3.5 h-3.5 text-secondary-500" />
            <span>{duration} Days Journey</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Share2}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              addToast('Workspace link copied to clipboard!', 'success');
            }}
          >
            Share Blueprint
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Bot}
            onClick={() => setActiveTab('ai_assistant')}
          >
            Ask Copilot
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <Tabs tabs={workspaceTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400">Destination</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{destName}</h3>
            <p className="text-xs text-slate-500">{trip.destinations?.[0]?.country || 'Global'}</p>
          </Card>
          <Card className="p-6 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400">Timeline & Duration</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{duration} Days</h3>
            <p className="text-xs text-slate-500">{trip.travelers?.count || 2} Traveler(s)</p>
          </Card>
          <Card className="p-6 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-400">Total Budget</span>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{(trip.budget?.total || 50000).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500">Categorized Allocation</p>
          </Card>
        </div>
      )}

      {/* TAB 2: TIMELINE (Main Desktop & Mobile Working View) */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Timeline (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            <InteractiveTimeline
              itinerary={itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteActivity}
              onReorderActivities={handleReorderActivities}
              onRegenerateDay={handleRegenerateDay}
            />
          </div>

          {/* Right: Trip Intelligence & Map Split (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            <TripIntelligence trip={trip} itinerary={itinerary} />
            <MapView trip={trip} itinerary={itinerary} selectedDay={selectedDay} />
          </div>
        </div>
      )}

      {/* TAB 3: FLIGHTS */}
      {activeTab === 'flights' && (
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Plane className="w-6 h-6" />
            <h3 className="text-xl font-bold">Flight Corridor Intelligence</h3>
          </div>
          <p className="text-xs text-slate-500">
            Outbound & Return flight routes attached to {destName} from {trip.origin?.name || 'Ahmedabad'}.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold">
            Status: Searched & Shortlisted (3 Flight Matrix Options Available)
          </div>
        </Card>
      )}

      {/* TAB 4: STAY */}
      {activeTab === 'stay' && (
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Building2 className="w-6 h-6" />
            <h3 className="text-xl font-bold">Accommodation & Hotel Stay</h3>
          </div>
          <p className="text-xs text-slate-500">
            Hotel matching neighborhood vibe score for {destName}.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold">
            Selected Stay: {trip.hotels?.[0]?.name || `Boutique Stay in ${destName}`}
          </div>
        </Card>
      )}

      {/* TAB 5: EXPERIENCES */}
      {activeTab === 'experiences' && (
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Layers className="w-6 h-6" />
            <h3 className="text-xl font-bold">Experiences & Sightseeing Highlights</h3>
          </div>
          <p className="text-xs text-slate-500">
            Curated list of attractions, outdoor activities, and dining spots attached to this trip.
          </p>
        </Card>
      )}

      {/* TAB 6: MAP */}
      {activeTab === 'map' && (
        <MapView trip={trip} itinerary={itinerary} selectedDay={selectedDay} />
      )}

      {/* TAB 7: BUDGET */}
      {activeTab === 'budget' && (
        <BudgetView trip={trip} itinerary={itinerary} />
      )}

      {/* TAB 8: AI ASSISTANT */}
      {activeTab === 'ai_assistant' && (
        <div className="max-w-2xl mx-auto">
          <AiTripAssistant tripId={trip._id} onExecuteCommand={handleExecuteAiCommand} />
        </div>
      )}
    </div>
  );
};

export default TripWorkspace;
