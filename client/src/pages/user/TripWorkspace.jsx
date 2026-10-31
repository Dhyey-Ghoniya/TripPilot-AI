import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LayoutGrid,
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
  Printer,
  Bookmark,
  Plus,
  RefreshCw,
  Send,
  Navigation,
  Sun,
  Utensils,
  Eye,
  MessageCircle,
} from 'lucide-react';
import Card from '../../components/common/Card';
import FlightHandoffCard from '../../components/common/FlightHandoffCard';
import Tabs from '../../components/common/Tabs';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

import InteractiveTimeline from '../../components/workspace/InteractiveTimeline';
import TripIntelligence from '../../components/workspace/TripIntelligence';
import ToursAndTickets from '../../components/workspace/ToursAndTickets';
import AiTripAssistant from '../../components/workspace/AiTripAssistant';
import BudgetView from '../../components/workspace/BudgetView';
import MapView from '../../components/workspace/MapView';
import TripHeader from '../../components/workspace/TripHeader';
import ActivityPhoto from '../../components/common/ActivityPhoto';
import TripDiscussion from '../../components/workspace/TripDiscussion';

import tripService from '../../services/tripService';
import itineraryService from '../../services/itineraryService';
import flightService from '../../services/flightService';
import hotelService from '../../services/hotelService';
import { useToast } from '../../context/ToastContext';

const TripWorkspace = () => {
  const { id } = useParams();
  const { addToast } = useToast();

  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bento'); // 'bento', 'timeline', 'map', 'budget', 'flights', 'stay', 'ai_assistant'
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTransportMode, setSelectedTransportMode] = useState('Taxi');
  const [mapTelemetry, setMapTelemetry] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Quick AI command inside Bento
  const [quickAiCommand, setQuickAiCommand] = useState('');
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [flightSearch, setFlightSearch] = useState(null);
  const [hotelResults, setHotelResults] = useState([]);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState('');

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

  useEffect(() => {
    if (!trip || !['flights', 'stay'].includes(activeTab)) return;
    let cancelled = false;
    const loadOffers = async () => {
      setOfferLoading(true);
      setOfferError('');
      try {
        if (activeTab === 'flights') {
          const response = await flightService.searchFlights({
            originAirport: trip.origin?.code || trip.origin?.city || trip.origin?.name || '',
            destinationAirport: trip.destinations?.[0]?.code || destName,
            departureDate: trip.dates?.startDate,
            returnDate: trip.dates?.endDate,
            travelersCount: trip.travelers?.count || 1,
            cabinClass: trip.preferences?.cabinClass || 'economy',
          });
          if (!cancelled) setFlightSearch(response?.data?.data || response?.data || null);
        } else {
          const response = await hotelService.searchHotels({
            destination: destName,
            checkIn: trip.dates?.startDate,
            checkOut: trip.dates?.endDate,
            guests: { adults: trip.travelers?.count || 1, children: 0 },
            tripId: trip._id,
          });
          if (!cancelled) setHotelResults(response?.data?.results || []);
        }
      } catch (error) {
        if (!cancelled) setOfferError(activeTab === 'flights' ? 'Flight search links are unavailable right now. Check the route and try again.' : 'Hotel offers are unavailable right now. Review the trip data and try again.');
      } finally {
        if (!cancelled) setOfferLoading(false);
      }
    };
    loadOffers();
    return () => { cancelled = true; };
  }, [activeTab, trip?._id]);

  // Handlers for activity editing & AI commands
  const handleAddActivity = async (dayNumber, activityData) => {
    if (!itinerary) return;
    try {
      const res = await itineraryService.addActivity(itinerary._id, { dayNumber, ...activityData });
      if (res?.data) setItinerary(res.data);
      addToast(`Activity added to Day ${dayNumber}.`, 'success');
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
      addToast(`Day ${dayNumber} regenerated successfully.`, 'success');
    } catch (err) {
      addToast('Failed to regenerate day.', 'error');
    }
  };

  const handleExecuteAiCommand = async (commandPrompt) => {
    if (!trip) return;
    setIsAiExecuting(true);
    try {
      const res = await tripService.executeAiCommand(trip._id, commandPrompt);
      if (res?.data?.itinerary) {
        setItinerary(res.data.itinerary);
      }
      if (res?.data?.trip) {
        setTrip(res.data.trip);
      }
      setAiFeedback(res?.message || 'Itinerary adjusted by AI Copilot.');
      addToast(res?.message || 'Trip updated by AI Copilot.', 'success');
      setQuickAiCommand('');
      return res?.data;
    } catch (err) {
      addToast('AI command failed.', 'error');
    } finally {
      setIsAiExecuting(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!trip) return;
    try {
      await tripService.updateTrip(trip._id, { status: 'saved' });
      setTrip((current) => ({ ...current, status: 'saved' }));
      addToast('Trip blueprint saved to your account.', 'success');
    } catch (error) {
      addToast('Trip could not be saved. Please try again.', 'error');
    }
  };

  const handleExportTrip = () => {
    window.print();
  };

  const workspaceTabs = [
    { id: 'bento', label: 'Bento Dashboard', icon: LayoutGrid },
    { id: 'timeline', label: 'Detailed Itinerary', icon: Clock },
    { id: 'map', label: 'Route Map', icon: MapPin },
    { id: 'budget', label: 'Budget Manager', icon: Wallet },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'stay', label: 'Stays', icon: Building2 },
    ...(!trip?.isReadOnly ? [{ id: 'ai_assistant', label: 'AI Copilot', icon: Bot }] : []),
    { id: 'discussion', label: 'Group Chat', icon: MessageCircle },
  ];

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" />
        <span className="text-xs text-slate-400 font-semibold">Loading Bento Trip Workspace...</span>
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

  const destName = trip.destinations?.[0]?.name || trip.destination?.name || 'Destination';
  const duration = trip.dates?.durationDays || itinerary?.days?.length || 5;
  const currentDayObj = itinerary?.days?.find((d) => d.dayNumber === selectedDay) || itinerary?.days?.[0];
  const currentActivities = currentDayObj?.activities || [];

  return (
    <div className="space-y-6 pb-24">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP BENTO HEADER: ROUTE, METRICS & CONTROLS               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <TripHeader
        trip={trip}
        itinerary={itinerary}
        onBookFlights={() => setActiveTab('flights')}
        onShareTrip={async () => {
          try {
            const response = await tripService.setSharing(trip._id, true);
            const updatedTrip = response?.data || response;
            setTrip(updatedTrip);
            await navigator.clipboard.writeText(`${window.location.origin}/share/trip/${updatedTrip.shareSettings.shareCode}`);
            addToast('Read-only public trip link copied.', 'success');
          } catch (error) {
            addToast(error.customMessage || 'Could not enable trip sharing.', 'error');
          }
        }}
        onExportTrip={handleExportTrip}
        onSaveTrip={!trip.isReadOnly ? handleSaveTrip : null}
        isReadOnly={trip.isReadOnly}
      />

      {trip.isReadOnly && <div className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">You have view-only access to this trip. Ask the owner for editor access to make changes.</div>}

      {/* Navigation Tabs Bar */}
      <Tabs tabs={workspaceTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FLAGSHIP TAB: BENTO GRID DASHBOARD                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'bento' && (
        <div className="space-y-6">
          {/* Main Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── BENTO TILE 1: DAY-BY-DAY ITINERARY STREAM (7 cols) ── */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-5 bg-white dark:bg-slate-900">
                {/* Day Switcher Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                      Daily Pacing & Activities
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      Day {selectedDay}: {currentDayObj?.title || 'City Highlights'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RefreshCw}
                      className="text-xs"
                      onClick={() => handleRegenerateDay(selectedDay)}
                    >
                      Regenerate Day
                    </Button>
                  </div>
                </div>

                {/* Horizontal Day Selector Pills (styled as modern rounded-lg) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {(itinerary?.days || []).map((day) => {
                    const isSelected = day.dayNumber === selectedDay;
                    return (
                      <button
                        key={day.dayNumber}
                        onClick={() => setSelectedDay(day.dayNumber)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                          isSelected
                            ? 'bg-secondary-600 text-white border-secondary-500 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Day {day.dayNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Activity Timeline List */}
                <div className="space-y-3.5 pt-1">
                  {currentActivities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No activities planned for Day {selectedDay} yet.
                    </div>
                  ) : (
                    currentActivities.map((act, idx) => {
                      return (
                        <div
                          key={act._id || idx}
                          className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              {/* Thumbnail */}
                              <ActivityPhoto
                                activity={act}
                                destination={destName}
                                tripId={id}
                                activityKey={`${selectedDay}-${act._id || idx}`}
                                className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                              />

                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                                    {act.time || 'Activity'}
                                  </span>
                                  {act.category && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
                                      {act.category}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                  {act.activity || act.title}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {act.description || act.location}
                                </p>
                              </div>
                            </div>

                            {/* Cost & Delete Action */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {act.cost > 0 ? `₹${act.cost.toLocaleString()}` : 'Free Access'}
                              </span>
                              <button
                                onClick={() => handleDeleteActivity(selectedDay, act._id || idx)}
                                className="text-slate-400 hover:text-rose-500 p-1 transition"
                                title="Remove activity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Transit corridor note */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-secondary-500" />
                              Transit: ~15 min via Local Transit / Taxi
                            </span>
                            <span className="font-medium text-slate-400">
                              Location: {act.location || destName}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* ── BENTO TILE 2: INTERACTIVE LEAFLET ROUTE MAP (5 cols) ── */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                    <MapPin className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Interactive Route Map</h3>
                  </div>
                  <Badge variant="secondary" size="sm">Day {selectedDay} Sequence</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Sequential attraction pins with real coordinates and route connectivity.
                </p>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <MapView trip={trip} itinerary={itinerary} selectedDay={selectedDay} activeMode={selectedTransportMode} onModeChange={setSelectedTransportMode} onTelemetryChange={setMapTelemetry} />
                </div>
              </Card>

              {/* Trip Intelligence Quick Telemetry */}
              <TripIntelligence trip={trip} itinerary={itinerary} telemetry={mapTelemetry} />
            </div>
          </div>

          {/* Bottom Bento Row: 3 Modular Auxiliary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ── BENTO TILE 3: LIVE BUDGET OVERVIEW (4 cols) ── */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Budget Allocation</h3>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{(trip.budget?.total || 50000).toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold">Planned Total</span>
                </div>
                <p className="text-xs text-slate-500">
                  Calculated against daily attraction fees, accommodations, and transit corridors.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold"
                onClick={() => setActiveTab('budget')}
              >
                Open Full Budget Manager
              </Button>
            </Card>

            {/* ── BENTO TILE 4: DESTINATION OVERVIEW (4 cols) ── */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                  <Compass className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Destination Dossier</h3>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">{destName}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {trip.destinations?.[0]?.country || 'Global Travel Corridor'} · {duration} Days Duration
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Coordinates Resolved</span>
                <span className="font-bold text-secondary-600">Active Blueprint</span>
              </div>
            </Card>

            {!trip.isReadOnly && <>
            {/* ── BENTO TILE 5: QUICK AI COPILOT COMMANDS (4 cols) ── */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">AI Copilot Quick Commands</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Instruct the AI to adjust Day {selectedDay} or tune the trip:
                </p>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    `Make Day ${selectedDay} cheaper`,
                    'Add outdoor scenic stop',
                    'Find recommended lunch',
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => handleExecuteAiCommand(cmd)}
                      disabled={isAiExecuting}
                      className="text-[10px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-secondary-50 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input box */}
              <div className="flex gap-1.5 pt-2">
                <input
                  type="text"
                  value={quickAiCommand}
                  onChange={(e) => setQuickAiCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && quickAiCommand.trim() && handleExecuteAiCommand(quickAiCommand)}
                  placeholder="e.g., Add a coffee break..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-secondary-500"
                />
                <button
                  onClick={() => quickAiCommand.trim() && handleExecuteAiCommand(quickAiCommand)}
                  disabled={isAiExecuting || !quickAiCommand.trim()}
                  className="px-3 py-2 rounded-lg bg-secondary-600 hover:bg-secondary-500 text-white text-xs font-bold disabled:opacity-50 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {aiFeedback && (
                <span className="text-[11px] text-secondary-600 font-medium block">
                  {aiFeedback}
                </span>
              )}
            </Card>
            </>}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* OTHER EXISTING WORKING TABS (PRESERVED FUNCTIONALITY)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: DETAILED TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <InteractiveTimeline
              itinerary={itinerary}
              tripId={id}
              destination={destName}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteActivity}
              onReorderActivities={handleReorderActivities}
              onRegenerateDay={handleRegenerateDay}
            />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <TripIntelligence trip={trip} itinerary={itinerary} telemetry={mapTelemetry} />
            <MapView trip={trip} itinerary={itinerary} selectedDay={selectedDay} activeMode={selectedTransportMode} onModeChange={setSelectedTransportMode} onTelemetryChange={setMapTelemetry} />
            <ToursAndTickets destination={destName} />
          </div>
        </div>
      )}

      {/* TAB 3: ROUTE MAP */}
      {activeTab === 'map' && (
        <Card className="p-6 border border-slate-200 dark:border-slate-800">
          <MapView trip={trip} itinerary={itinerary} selectedDay={selectedDay} activeMode={selectedTransportMode} onModeChange={setSelectedTransportMode} onTelemetryChange={setMapTelemetry} />
        </Card>
      )}

      {/* TAB 4: BUDGET */}
      {activeTab === 'budget' && (
        <BudgetView trip={trip} itinerary={itinerary} />
      )}

      {/* TAB 5: FLIGHTS */}
      {activeTab === 'flights' && (
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Plane className="w-6 h-6" />
            <h3 className="text-xl font-bold">Flight Corridor Intelligence</h3>
          </div>
          <p className="text-xs text-slate-500">
            Outbound and return flight routes attached to {destName} from {trip.origin?.name || 'Ahmedabad'}.
          </p>
          {offerLoading && <Spinner size="md" />}
          {offerError && <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{offerError}</div>}
          {!offerLoading && !offerError && flightSearch && <FlightHandoffCard searchParams={flightSearch.searchParams} handoffLinks={flightSearch.handoffLinks} />}
        </Card>
      )}

      {/* TAB 6: STAY */}
      {activeTab === 'stay' && (
        <Card className="p-8 space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Building2 className="w-6 h-6" />
            <h3 className="text-xl font-bold">Accommodation & Hotel Stay</h3>
          </div>
          <p className="text-xs text-slate-500">
            Hotel matching neighborhood vibe score for {destName}.
          </p>
          {trip.hotels?.[0] && <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">Attached stay: {trip.hotels[0].name}</div>}
          {offerLoading && <Spinner size="md" />}
          {offerError && <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{offerError}</div>}
          {!offerLoading && !offerError && hotelResults.length === 0 && <p className="text-sm text-slate-500">No hotel offers were returned. Indicative stays are not presented as booked inventory.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {hotelResults.slice(0, 6).map((hotel, index) => (
              <div key={hotel.id || hotel.name || index} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900 dark:text-white">{hotel.name || 'Hotel option'}</p><p className="text-xs text-slate-500">{hotel.address || hotel.neighborhood || destName}</p><p className="text-xs text-slate-500">{hotel.isIndicativeSuggestion ? 'Indicative estimate' : 'Provider result'}</p></div><span className="text-sm font-bold text-slate-900 dark:text-white">{hotel.pricePerNight?.amount ? `${hotel.pricePerNight.currency || 'INR'} ${hotel.pricePerNight.amount.toLocaleString()}/night` : 'Price unavailable'}</span></div><Button className="mt-3 w-full" size="sm" variant="outline" onClick={async () => { try { await hotelService.attachHotelToTrip(trip._id, hotel); await loadTripData(); addToast('Hotel option attached to this trip.', 'success'); } catch (error) { addToast('Hotel could not be attached.', 'error'); } }}>Attach stay</Button></div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 7: AI ASSISTANT */}
      {activeTab === 'ai_assistant' && (
        <div className="max-w-2xl mx-auto">
          <AiTripAssistant tripId={trip._id} onExecuteCommand={handleExecuteAiCommand} />
        </div>
      )}

      {activeTab === 'discussion' && <TripDiscussion trip={trip} onTripChanged={loadTripData} />}
    </div>
  );
};

export default TripWorkspace;
