import React, { useState } from 'react';
import { CalendarDays, Plane, Search, ShieldCheck, Users } from 'lucide-react';
import FlightHandoffCard from '../../components/common/FlightHandoffCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AIRPORT_LOCATIONS } from '../../utils/airportLocations';
import flightService from '../../services/flightService';

const localDate = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const defaultDeparture = () => { const date = new Date(); date.setDate(date.getDate() + 14); return localDate(date); };

export default function Flights() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(defaultDeparture);
  const [returnDate, setReturnDate] = useState('');
  const [travelersCount, setTravelersCount] = useState(1);
  const [cabinClass, setCabinClass] = useState('economy');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [search, setSearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!origin.trim() || !destination.trim() || !departureDate) {
      setError('Enter an origin, destination, and departure date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await flightService.searchFlights({
        origin: origin.trim(),
        destination: destination.trim(),
        departureDate,
        returnDate: isRoundTrip ? returnDate || null : null,
        travelersCount: Number(travelersCount),
        cabinClass,
      });
      const payload = response?.data?.data || response?.data;
      setSearch(payload || null);
      if (!payload?.handoffLinks?.length) setError('Provider search links could not be loaded. Try again.');
    } catch (requestError) {
      setSearch(null);
      setError(requestError?.response?.data?.message || 'Flight search links could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell space-y-8 pb-16 pt-8">
      <section className="mx-auto max-w-5xl rounded-xl border border-slate-800 bg-slate-950 px-4 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200"><Plane className="h-4 w-4" aria-hidden="true" /> Flight search</div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Compare flights on provider sites</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">Enter your route and travel details, then continue to a flight provider to check current schedules, prices, and availability.</p>
        </div>

        <form onSubmit={submit} className="mx-auto mt-8 max-w-4xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-card dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-7">
          <div className="flex gap-5 border-b border-slate-200 pb-3 text-sm font-semibold dark:border-slate-700">
            <button type="button" onClick={() => setIsRoundTrip(false)} className={`border-b-2 pb-2 ${!isRoundTrip ? 'border-secondary-600 text-secondary-700 dark:text-secondary-300' : 'border-transparent text-slate-500'}`}>One way</button>
            <button type="button" onClick={() => setIsRoundTrip(true)} className={`border-b-2 pb-2 ${isRoundTrip ? 'border-secondary-600 text-secondary-700 dark:text-secondary-300' : 'border-transparent text-slate-500'}`}>Round trip</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="From" placeholder="City or airport code, such as Ahmedabad or AMD" list="flight-airport-locations" icon={Plane} value={origin} onChange={(event) => setOrigin(event.target.value)} />
            <Input label="To" placeholder="City or airport code, such as Goa or GOI" list="flight-airport-locations" icon={Plane} value={destination} onChange={(event) => setDestination(event.target.value)} />
            <Input label="Departure date" type="date" min={localDate(new Date())} icon={CalendarDays} value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} />
            {isRoundTrip ? <Input label="Return date" type="date" min={departureDate} icon={CalendarDays} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /> : null}
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" aria-hidden="true" /> Travelers</span>
              <select value={travelersCount} onChange={(event) => setTravelersCount(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'traveler' : 'travelers'}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Cabin class
              <select value={cabinClass} onChange={(event) => setCabinClass(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="economy">Economy</option><option value="premium_economy">Premium economy</option><option value="business">Business</option><option value="first">First</option>
              </select>
            </label>
          </div>
          <datalist id="flight-airport-locations">{AIRPORT_LOCATIONS.map(({ city, code }) => <option key={`${city}-${code}`} value={city}>{code}</option>)}{AIRPORT_LOCATIONS.map(({ code }) => <option key={code} value={code} />)}</datalist>
          {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
          <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> TripPilot opens provider searches. Prices and availability are confirmed on the provider site.</p>
            <Button type="submit" variant="primary" size="md" icon={Search} isLoading={loading}>Find flights</Button>
          </div>
        </form>
      </section>
      {search && <section className="mx-auto max-w-5xl"><FlightHandoffCard searchParams={search.searchParams} handoffLinks={search.handoffLinks} /></section>}
    </main>
  );
}
