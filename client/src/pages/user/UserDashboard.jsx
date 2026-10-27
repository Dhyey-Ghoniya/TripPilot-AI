import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  MapPin,
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  Compass,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import TripPilotChat from '../../components/chat/TripPilotChat';
import { useAuth } from '../../context/AuthContext';
import tripService from '../../services/tripService';
import ScrapbookDoodles from '../../components/common/ScrapbookDoodles';

const UserDashboard = () => {
  const { user } = useAuth();
  const greetingName = user?.firstName ? user.firstName : 'Traveler';

  const [userTrips, setUserTrips] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  useEffect(() => {
    tripService
      .getUserTrips()
      .then((res) => {
        const trips = res?.data?.trips || res?.trips || [];
        setUserTrips(trips);
      })
      .catch(() => {})
      .finally(() => setIsLoadingTrips(false));
  }, []);

  const latestTrip = userTrips.length > 0 ? userTrips[0] : null;

  return (
    <div className="space-y-10 pb-16">
      {/* WELCOME BANNER */}
      <div className="scrapbook-paper relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-md p-6 text-stone-900 sm:p-10 md:flex-row md:items-center">
        <ScrapbookDoodles className="right-0 top-0 h-full w-[46%] opacity-80" />
        
        <div className="scrapbook-torn relative z-10 max-w-xl space-y-2 px-5 py-4">
          <div className="inline-flex items-center gap-2 rounded-sm border border-[#bca987] bg-accent-100 px-3 py-1 text-xs font-semibold text-stone-800">
            <Compass className="w-3.5 h-3.5" />
            <span>Your travel dashboard</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Good day, {greetingName}
          </h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            Open a saved trip, start a new itinerary, or continue from the planner chat.
          </p>
        </div>
        
        <div className="relative z-10 shrink-0 flex flex-col items-center gap-4">
          <div className="scrapbook-sticky px-5 py-4 text-center">
            <p className="font-scrap-note text-2xl font-bold text-stone-900">Next stop?</p>
            <p className="font-scrap-note text-lg text-stone-700">Pick a place and let’s plan.</p>
          </div>
          <Link to="/plan-trip">
            <Button variant="primary" size="lg" icon={Plus} className="shadow-md shadow-orange-900/15">
              Plan New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK METRICS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Trips Planned</span>
            <Plane className="w-4 h-4 text-secondary-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {userTrips.length}
          </span>
          <span className="text-[11px] font-semibold text-accent-700 dark:text-accent-400 block">
            Connected to Database
          </span>
        </Card>

        <Card className="p-6 space-y-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Latest Trip Status</span>
            <Compass className="w-4 h-4 text-accent-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {latestTrip?.status || 'No trips'}
          </span>
          <span className="text-[11px] font-medium text-secondary-600 dark:text-secondary-400 block">
            {latestTrip?.title || 'Your saved trip status will appear here'}
          </span>
        </Card>

        <Card className="p-6 space-y-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Planning Preferences</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">Set in chat</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            Tell the planner what matters for this trip
          </span>
        </Card>
      </div>

      {/* EMBEDDED UNIFIED TRIPPILOT CHATBOT */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary-500" />
            AI Travel Copilot Command Workspace
          </h2>
          <Badge variant="secondary" size="sm">Trip planning assistant</Badge>
        </div>

        <TripPilotChat
          title="TripPilot AI Copilot Workspace"
          className="shadow-2xl border-slate-200/80 dark:border-slate-800"
        />
      </section>

      {/* ACTIVE & RECENT TRIPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ACTIVE / LATEST TRIP CARD */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary-500" />
              Active Trip Blueprint
            </h2>
            <Link to="/my-trips" className="text-xs font-semibold text-secondary-600 hover:underline">
              View All Trips
            </Link>
          </div>

          {latestTrip ? (
            <Card className="p-6 overflow-hidden space-y-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="scrapbook-polaroid scrapbook-wiggle shrink-0 rotate-[-3deg]">
                  <img
                    src={latestTrip.destinations?.[0]?.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
                    alt={latestTrip.title}
                    className="h-40 w-full rounded-xl border-2 border-stone-900 object-cover sm:w-48"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">{latestTrip.status || 'planning'}</Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {latestTrip.dates?.durationDays || 5} Days
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{latestTrip.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-secondary-600" />
                    {latestTrip.destinations?.[0]?.name || 'Destination'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Target Budget</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{(latestTrip.budget?.total || 50000).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Travelers</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {latestTrip.travelers?.count || 2} Guests
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to={`/trips/${latestTrip._id}`}>
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Open Full Workspace
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 space-y-3 border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isLoadingTrips ? 'Loading your trips' : 'No trips saved yet'}
              </h3>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                {isLoadingTrips
                  ? 'Your saved itineraries will appear here.'
                  : 'Start a trip in the planner and it will appear here when saved.'}
              </p>
              {!isLoadingTrips && (
                <Link to="/plan-trip">
                  <Button variant="primary" size="sm" icon={ArrowRight}>
                    Plan your first trip
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>

        {/* QUICK NAVIGATION & RECENT TRIPS */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Trips</h2>

          <div className="space-y-4">
            {userTrips.slice(1, 4).map((trip) => (
              <Card key={trip._id} className="p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition">
                <img src={trip.destinations?.[0]?.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=80'} alt={trip.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{trip.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{trip.destinations?.[0]?.name || 'Destination not set'}</p>
                  <Link to={`/trips/${trip._id}`} className="text-[10px] text-secondary-600 dark:text-secondary-400 font-semibold mt-1 inline-block">Open trip</Link>
                </div>
              </Card>
            ))}
            {!isLoadingTrips && userTrips.length <= 1 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {userTrips.length === 1 ? 'Your latest trip is shown beside this list.' : 'Your saved trips will appear here.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
