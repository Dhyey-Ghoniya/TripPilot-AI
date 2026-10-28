import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plane,
  ArrowRight,
  Calendar,
  Users,
  Sparkles,
  Filter,
  ShieldCheck,
  Clock,
  TrendingDown,
  ExternalLink,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import flightService from '../../services/flightService';
import tripService from '../../services/tripService';
import { AIRPORT_LOCATIONS, resolveAirportCode } from '../../utils/airportLocations';

const getDefaultDepartureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const Flights = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [origin, setOrigin] = useState('AMD');
  const [destination, setDestination] = useState('DXB');
  const [departureDate, setDepartureDate] = useState(getDefaultDepartureDate);
  const [returnDate, setReturnDate] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [cabinClass, setCabinClass] = useState('economy');
  const [passengers, setPassengers] = useState(2);

  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('arrival'); // arrival, price, duration
  const [maxStopsFilter, setMaxStopsFilter] = useState('all');

  // Attach to Trip Modal state
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [userTrips, setUserTrips] = useState([]);
  const [selectedFlightForAttach, setSelectedFlightForAttach] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState('');

  const executeSearch = async (overrides = {}) => {
    const originCode = resolveAirportCode(origin);
    const destinationCode = resolveAirportCode(destination);
    if (!originCode || !destinationCode) {
      addToast('Enter a supported city or destination name, or a 3-letter airport code.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await flightService.searchFlights({
        originAirport: originCode,
        destinationAirport: destinationCode,
        departureDate,
        returnDate: isRoundTrip ? returnDate : null,
        cabinClass: overrides.cabinClass || cabinClass,
        passengers: { adults: passengers },
      });

      if (res?.data?.results) {
        setFlights(res.data.results);
      }
    } catch (err) {
      console.warn('[Flights Search Error]:', err);
      addToast('Error searching flight matrix. Using cached results.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, []);

  const handleOpenAttachModal = async (flight) => {
    if (!isAuthenticated) {
      addToast('Please sign in to attach flights to your trip blueprint.', 'info');
      navigate('/login?redirect=/flights');
      return;
    }

    setSelectedFlightForAttach(flight);
    setIsAttachModalOpen(true);

    try {
      const tripsRes = await tripService.getMyTrips();
      if (tripsRes?.data?.trips) {
        setUserTrips(tripsRes.data.trips);
        if (tripsRes.data.trips.length > 0) {
          setSelectedTripId(tripsRes.data.trips[0]._id);
        }
      }
    } catch (err) {
      console.error('[Fetch Trips Error]:', err);
    }
  };

  const handleConfirmAttach = async () => {
    if (!selectedTripId || !selectedFlightForAttach) return;
    try {
      await flightService.attachFlightToTrip(selectedTripId, selectedFlightForAttach);
      addToast(`Attached ${selectedFlightForAttach.airline} flight to trip! Budget updated.`, 'success');
      setIsAttachModalOpen(false);
      navigate(`/trips/${selectedTripId}`);
    } catch (err) {
      addToast('Failed to attach flight to trip.', 'error');
    }
  };

  // Keep every returned option visible and sort by the selected field, arrival by default.
  const filteredFlights = flights
    .filter((fl) => {
      if (maxStopsFilter === 'direct') return fl.stopsCount === 0;
      if (maxStopsFilter === '1-stop') return fl.stopsCount <= 1;
      return true;
    })
    .sort((a, b) => {
      const arrivalA = new Date(a.arrivalTime).getTime();
      const arrivalB = new Date(b.arrivalTime).getTime();
      if (sortBy === 'price') return Number(a.price?.amount ?? a.price ?? 0) - Number(b.price?.amount ?? b.price ?? 0);
      if (sortBy === 'duration') return Number(a.durationMinutes || 0) - Number(b.durationMinutes || 0);
      return (Number.isFinite(arrivalA) ? arrivalA : 0) - (Number.isFinite(arrivalB) ? arrivalB : 0);
    });

  return (
    <div className="page-shell space-y-10 pb-16 pt-8">
      {/* Header Banner & Search Container */}
      <section className="relative pt-10 pb-12 px-4 sm:px-8 bg-slate-950 text-white rounded-xl overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary-900/50 border border-secondary-700/40 text-secondary-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
            Flight search
          </p>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Compare fares by date, cabin, and stops
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Review route options by arrival time. Booking links open partner searches, where you can confirm live schedules and the final fare.
          </p>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-xl shadow-card border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white max-w-4xl mx-auto text-left mt-8">
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsRoundTrip(false)}
                className={`pb-1 transition border-b-2 ${
                  !isRoundTrip
                    ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                    : 'border-transparent text-slate-500'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setIsRoundTrip(true)}
                className={`pb-1 transition border-b-2 ${
                  isRoundTrip
                    ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                    : 'border-transparent text-slate-500'
                }`}
              >
                Round Trip
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="From"
                placeholder="City or airport code, e.g. Ahmedabad or AMD"
                list="flight-airport-locations"
                helperText="Enter a city/destination or a 3-letter airport code."
                icon={Plane}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
              <Input
                label="To"
                placeholder="City or airport code, e.g. Dubai or DXB"
                list="flight-airport-locations"
                helperText="Enter a city/destination or a 3-letter airport code."
                icon={Plane}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <Input
                label="Departure Date"
                type="date"
                icon={Calendar}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
              <Select
                label="Cabin Class"
                icon={Users}
                value={cabinClass}
                onChange={(e) => {
                  const nextCabinClass = e.target.value;
                  setCabinClass(nextCabinClass);
                  executeSearch({ cabinClass: nextCabinClass });
                }}
                options={['economy', 'premium_economy', 'business', 'first']}
              />
            </div>

            <datalist id="flight-airport-locations">
              {AIRPORT_LOCATIONS.map(({ city, code }) => (
                <option key={`${city}-${code}`} value={city}>{code}</option>
              ))}
              {AIRPORT_LOCATIONS.map(({ code }) => (
                <option key={`code-${code}`} value={code} />
              ))}
            </datalist>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Partner booking links · Confirm live availability before booking</span>
              </div>
              <Button
                variant="primary"
                size="md"
                icon={Sparkles}
                isLoading={isLoading}
                onClick={executeSearch}
              >
                Search Flights
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Header, Sorting & Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Flight Options ({filteredFlights.length})
            </h2>
            <p className="text-xs text-slate-500">
              {filteredFlights.length} options returned for {origin} → {destination}. Fares and schedules are indicative until confirmed on the booking site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="arrival">Arrival time</option>
                <option value="price">Cheapest Fare</option>
                <option value="duration">Fastest Flight</option>
                <option value="departure">Earliest Departure</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={maxStopsFilter}
                onChange={(e) => setMaxStopsFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="all">All Stops</option>
                <option value="direct">Direct Flights Only</option>
                <option value="1-stop">Max 1 Stop</option>
              </select>
            </div>
          </div>
        </div>

        {/* Flight Matrix List */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Spinner size="lg" />
            <span className="text-xs text-slate-400 font-semibold">
              Querying Ixigo, MakeMyTrip, Cleartrip, Skyscanner, Trip.com & Expedia...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFlights.map((flight) => {
              const priceAmt = flight.price?.amount || flight.price || 0;
              const depTime = new Date(flight.departureTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const arrTime = new Date(flight.arrivalTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={flight.flightId}
                  className="p-6 hover:border-secondary-500/50 transition-all space-y-4 border border-slate-200/80 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-slate-900 dark:text-white">
                          {flight.airline}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({flight.flightNumber})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-secondary-600 dark:text-secondary-400">
                          {flight.providerCode === 'SKYSCANNER'
                            ? 'Open Skyscanner to search'
                            : `Search on ${flight.providerName || flight.provider}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ₹{priceAmt.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        {flight.cabinClass || 'Economy'}
                      </span>
                    </div>
                  </div>

                  {/* Route Corridor Timings */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {depTime}
                      </div>
                      <div className="text-slate-500 font-bold">{flight.departureAirport}</div>
                    </div>

                    <div className="flex flex-col items-center px-4">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {Math.floor((flight.durationMinutes || 180) / 60)}h{' '}
                        {(flight.durationMinutes || 180) % 60}m
                      </span>
                      <div className="w-20 sm:w-28 h-0.5 bg-slate-300 dark:bg-slate-600 my-1 relative flex items-center justify-center">
                        <Plane className="w-3.5 h-3.5 text-secondary-500 rotate-90" />
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {flight.stopsCount === 0 ? 'Direct Flight' : `${flight.stopsCount} Stop`}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {arrTime}
                      </div>
                      <div className="text-slate-500 font-bold">{flight.arrivalAirport}</div>
                    </div>
                  </div>

                  {/* Provider Actions & Attach Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenAttachModal(flight)}
                      className="text-xs font-bold text-secondary-600 dark:text-secondary-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Attach to Active Trip
                    </button>

                    {flight.bookingUrl && (
                      <a
                        href={flight.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary-600 hover:bg-secondary-500 text-white font-bold text-xs shadow-md transition"
                      >
                        <span>
                          {flight.providerCode === 'SKYSCANNER'
                            ? 'Open Skyscanner to search'
                            : `Book on ${flight.providerName || 'Provider'}`}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ATTACH FLIGHT MODAL */}
      <Modal
        isOpen={isAttachModalOpen}
        onClose={() => setIsAttachModalOpen(false)}
        title="Attach Flight to Trip Blueprint"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {selectedFlightForAttach && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-500">
                Selected Flight
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {selectedFlightForAttach.airline} ({selectedFlightForAttach.flightNumber})
              </p>
              <p className="text-xs text-slate-500">
                {selectedFlightForAttach.departureAirport} → {selectedFlightForAttach.arrivalAirport} · ₹
                {(selectedFlightForAttach.price?.amount || selectedFlightForAttach.price || 0).toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Trip Blueprint to Attach
            </label>
            {userTrips.length === 0 ? (
              <p className="text-xs text-slate-500">No active trips found. Create a trip first!</p>
            ) : (
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
              >
                {userTrips.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.destination?.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAttachModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedTripId}
              onClick={handleConfirmAttach}
            >
              Confirm Flight Attachment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Flights;
