import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Wallet } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import tripService from '../../services/tripService';

const SharedTrip = () => {
  const { shareCode } = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadSharedTrip = async () => {
      setIsLoading(true);
      try {
        const response = await tripService.getSharedTrip(shareCode);
        if (!cancelled) setTrip(response?.data || response);
      } catch (requestError) {
        if (!cancelled) setError(requestError.customMessage || 'This shared trip is unavailable or the link has expired.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    if (shareCode) loadSharedTrip();
    return () => { cancelled = true; };
  }, [shareCode]);

  if (isLoading) {
    return <div className="page-shell flex min-h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (error || !trip) {
    return (
      <div className="page-shell py-16">
        <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Shared trip unavailable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'The shared trip could not be loaded.'}</p>
          <Link to="/"><Button variant="primary" icon={ArrowLeft}>Back to TripPilot</Button></Link>
        </Card>
      </div>
    );
  }

  const destination = trip.destinations?.[0];
  const days = trip.itineraryId?.days || trip.itinerary?.days || [];
  const currency = trip.budget?.currency || 'INR';

  return (
    <div className="page-shell space-y-8 py-10 pb-20">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="neutral" size="sm">Read-only shared trip</Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{trip.title}</h1>
          <p className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4 text-teal-600" />{destination?.name || 'Destination'}{destination?.country ? `, ${destination.country}` : ''}</p>
        </div>
        <Link to="/plan-trip"><Button variant="outline">Plan your own trip</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><Calendar className="h-5 w-5 text-teal-600" /><p className="mt-3 text-xs text-slate-500">Duration</p><p className="font-bold text-slate-900 dark:text-white">{trip.dates?.durationDays || days.length || 1} days</p></Card>
        <Card className="p-5"><Users className="h-5 w-5 text-teal-600" /><p className="mt-3 text-xs text-slate-500">Travelers</p><p className="font-bold text-slate-900 dark:text-white">{trip.travelers?.count || 1}</p></Card>
        <Card className="p-5"><Wallet className="h-5 w-5 text-teal-600" /><p className="mt-3 text-xs text-slate-500">Budget estimate</p><p className="font-bold text-slate-900 dark:text-white">{currency} {(trip.budget?.total || 0).toLocaleString()}</p></Card>
      </div>

      <section className="space-y-4">
        <div><h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">Day-by-day itinerary</h2><p className="text-sm text-slate-500">Shared for viewing only. Booking and editing remain with the trip owner.</p></div>
        {days.length === 0 ? <Card className="p-6 text-sm text-slate-500">No itinerary days are available for this shared trip.</Card> : days.map((day) => (
          <Card key={day.dayNumber} className="space-y-4 p-6">
            <div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Day {day.dayNumber}</p><h3 className="text-lg font-bold text-slate-900 dark:text-white">{day.title || day.theme || 'Planned day'}</h3></div>
            <div className="space-y-3">{(day.activities || []).length === 0 ? <p className="text-sm text-slate-500">No activities listed for this day.</p> : day.activities.map((activity, index) => <div key={activity._id || index} className="border-l-2 border-teal-600 pl-4"><p className="text-xs font-semibold text-teal-700">{activity.time || activity.timeSlot || 'Activity'}</p><p className="font-semibold text-slate-900 dark:text-white">{activity.activity || activity.title || 'Planned activity'}</p><p className="text-sm text-slate-500">{activity.location || activity.description || 'Location details unavailable'}</p></div>)}</div>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default SharedTrip;
