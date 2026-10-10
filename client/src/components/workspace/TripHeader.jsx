import React from 'react';
import {
  MapPin,
  Calendar,
  Users,
  Wallet,
  Plane,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const TripHeader = ({ trip, itinerary, onBookFlights, onShareTrip }) => {
  if (!trip) return null;

  const originName = trip.origin?.name || trip.origin?.city || 'Ahmedabad';
  const destName = trip.destinations?.[0]?.name || trip.destination?.name || 'Destination';
  const duration = trip.dates?.durationDays || itinerary?.days?.length || 1;
  const travelersCount = trip.travelers?.count || 2;
  const totalBudget = trip.budget?.total || 50000;
  const currency = trip.budget?.currency === 'INR' ? '₹' : (trip.budget?.currency || '₹');

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startDateFormatted = formatDate(trip.dates?.startDate);
  const endDateFormatted = formatDate(trip.dates?.endDate);

  const hasDates = Boolean(startDateFormatted && endDateFormatted);

  return (
    <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/60 shadow-xl space-y-5">
      {/* Top Row: Meta Badges & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" size="sm" className="font-bold">
            {trip.status?.toUpperCase() || 'PLANNING'}
          </Badge>
          <span className="text-xs text-slate-400 font-mono">ID: {trip.shareSettings?.shareCode || trip._id?.slice(-6) || 'TPS-882'}</span>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Synchronized
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Share2}
            className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
            onClick={onShareTrip || (() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Trip link copied to clipboard!');
            })}
          >
            Share Trip
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plane}
            className="bg-secondary-600 hover:bg-secondary-500 text-white font-bold"
            onClick={onBookFlights}
          >
            Search & Book Flights
          </Button>
        </div>
      </div>

      {/* Main Title & Route Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-secondary-400 text-xs font-bold uppercase tracking-wider">
          <span>{originName}</span>
          <span className="text-slate-500">➔</span>
          <span>{destName}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {trip.title || `${duration}-Day Journey to ${destName}`}
        </h1>
      </div>

      {/* Structured Info Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-700/50 text-xs">
        {/* Dates */}
        <div className="space-y-1">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-secondary-400" />
            Travel Dates
          </span>
          {hasDates ? (
            <p className="font-bold text-white text-sm">
              {startDateFormatted} – {endDateFormatted}
            </p>
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Add travel dates
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-secondary-400" />
            Total Duration
          </span>
          <p className="font-bold text-white text-sm">{duration} Days ({Math.max(1, duration - 1)} Nights)</p>
        </div>

        {/* Travelers */}
        <div className="space-y-1">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-secondary-400" />
            Travelers
          </span>
          <p className="font-bold text-white text-sm">{travelersCount} Traveler(s)</p>
        </div>

        {/* Total Budget */}
        <div className="space-y-1">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            Estimated Budget
          </span>
          <p className="font-bold text-emerald-400 text-sm">
            {currency}{totalBudget.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default TripHeader;
