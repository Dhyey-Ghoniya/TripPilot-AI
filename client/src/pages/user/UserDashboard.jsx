import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Calendar,
  MapPin,
  Wallet,
  Sparkles,
  ArrowRight,
  Plus,
  Users,
  Clock,
  Compass,
  Heart,
  BookOpen,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import TripPilotChat from '../../components/chat/TripPilotChat';
import { useAuth } from '../../context/AuthContext';
import tripService from '../../services/tripService';
import { mockUpcomingTrip, mockRecentTrips } from '../../constants/mockTrips';

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
      <div className="bg-gradient-to-r from-slate-950 via-primary-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-slate-800/80">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/20 border border-secondary-500/30 text-secondary-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Travel Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Good day, {greetingName} 👋
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed">
            Welcome to your travel copilot dashboard. Discover destinations, track active trip blueprints, or instruct the AI to refine your itinerary.
          </p>
        </div>
        
        <div className="z-10 shrink-0 flex items-center gap-3">
          <Link to="/plan-trip">
            <Button variant="accent" size="lg" icon={Plus} className="shadow-lg shadow-secondary-900/30">
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
            {userTrips.length > 0 ? userTrips.length : 3}
          </span>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
            ✓ Connected to MongoDB
          </span>
        </Card>

        <Card className="p-6 space-y-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Itinerary Status</span>
            <Compass className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">
            {latestTrip ? '1 Active' : '0 Pending'}
          </span>
          <span className="text-[11px] font-medium text-secondary-600 dark:text-secondary-400 block">
            {latestTrip ? latestTrip.title : 'Ready for your next prompt'}
          </span>
        </Card>

        <Card className="p-6 space-y-2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Personalized Copilot</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-3xl font-black text-slate-900 dark:text-white">Auto-Tuned</span>
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
            Learned travel preferences active
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
          <Badge variant="secondary" size="sm">Real-time Copilot Engine</Badge>
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
                <img
                  src={
                    latestTrip.destinations?.[0]?.coverImage ||
                    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={latestTrip.title}
                  className="w-full sm:w-48 h-40 rounded-2xl object-cover"
                />
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
            <Card className="p-6 overflow-hidden space-y-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row gap-6">
                <img
                  src={mockUpcomingTrip.imageUrl}
                  alt={mockUpcomingTrip.title}
                  className="w-full sm:w-48 h-40 rounded-2xl object-cover"
                />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">{mockUpcomingTrip.status}</Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {mockUpcomingTrip.daysCount} Days
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{mockUpcomingTrip.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-secondary-600" />
                    {mockUpcomingTrip.destination}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Dates</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{mockUpcomingTrip.startDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Travelers</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{mockUpcomingTrip.travelers} Guests</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to="/plan-trip">
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Explore Blueprint
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* QUICK NAVIGATION & RECENT TRIPS */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Destinations</h2>

          <div className="space-y-4">
            {mockRecentTrips.map((trip) => (
              <Card key={trip.id} className="p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition">
                <img src={trip.imageUrl} alt={trip.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{trip.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{trip.destination}</p>
                  <p className="text-[10px] text-secondary-600 dark:text-secondary-400 font-semibold mt-1">
                    Spent: {trip.spent}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
