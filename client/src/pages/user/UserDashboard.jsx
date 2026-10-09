import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Calendar, MapPin, Wallet, Sparkles, ArrowRight, Plus, Users, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import { mockUpcomingTrip, mockRecentTrips } from '../../constants/mockTrips';
import { mockUserStats, mockMonthlySpendChart } from '../../constants/mockStats';
import { mockDestinations } from '../../constants/mockDestinations';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const [aiPrompt, setAiPrompt] = useState('5 day trip to Kerala under ₹40,000');

  const greetingName = user?.firstName ? user.firstName : 'Traveler';

  return (
    <div className="space-y-8 pb-12">
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-primary-900 via-slate-900 to-secondary-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <Badge variant="secondary" size="sm" className="mb-1">Welcome back</Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Good morning, {greetingName} 👋</h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Ready for your next adventure? Manage your upcoming itineraries or generate a new AI trip plan.
          </p>
        </div>
        <div className="z-10 shrink-0">
          <Link to="/plan-trip">
            <Button variant="accent" size="lg" icon={Plus}>
              Plan a New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockUserStats.map((stat, idx) => (
          <Card key={idx} className="p-6 space-y-3">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">{stat.label}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</span>
            </div>
            <span className="text-[11px] font-medium text-secondary-600 dark:text-secondary-400 block">
              {stat.change}
            </span>
          </Card>
        ))}
      </div>

      {/* FUTURE AI FEATURE PLACEHOLDER */}
      <Card className="p-6 sm:p-8 bg-gradient-to-tr from-secondary-950/90 to-slate-900 border border-secondary-500/30 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-secondary-500/20 text-secondary-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">✈ TripPilot AI Assistant</h3>
          <Badge variant="accent" size="sm" className="ml-auto">AI Planner Preview</Badge>
        </div>

        <p className="text-xs sm:text-sm text-slate-300">
          Tell me what kind of trip you want and our recommendation engine will draft an optimized day-by-day plan:
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder='e.g. "5 day trip to Kerala under ₹40,000"'
              className="bg-slate-800/90 text-white border-slate-700 placeholder-slate-400"
            />
          </div>
          <Button variant="accent" size="md" icon={Sparkles} onClick={() => alert('AI Generation will be integrated in Module 3!')}>
            Generate Trip
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* UPCOMING TRIP CARD */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Trip</h2>
            <Link to="/my-trips" className="text-xs font-semibold text-secondary-600 hover:underline">
              View All
            </Link>
          </div>

          <Card className="p-6 overflow-hidden space-y-6">
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
                  <Button variant="primary" size="sm" icon={ArrowRight}>
                    View Itinerary
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* SPEND ANALYTICS VISUALIZATION */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Travel Spend Overview</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMonthlySpendChart}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip />
                  <Bar dataKey="amount" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* RECENT TRIPS & QUICK RECOMMENDATIONS */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Trips</h2>

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

          <div className="pt-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Recommended For You</h3>
            <div className="space-y-3">
              {mockDestinations.slice(0, 2).map((dest) => (
                <Card key={dest.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{dest.title}</h4>
                    <p className="text-[11px] text-slate-400">{dest.estimatedBudget}</p>
                  </div>
                  <Link to="/explore">
                    <Button variant="outline" size="sm">Explore</Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
