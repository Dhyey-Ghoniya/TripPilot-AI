import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  Star,
  Sparkles,
  Shield,
  ExternalLink,
  ArrowRight,
  Filter,
  Check,
  Search,
  DollarSign,
  Compass,
  Zap,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import hotelService from '../../services/hotelService';

const Hotels = () => {
  const [destination, setDestination] = useState('Dubai');
  const [checkIn, setCheckIn] = useState('2026-10-15');
  const [checkOut, setCheckOut] = useState('2026-10-19');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');

  // Filters
  const [starCategory, setStarCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('4.0');
  const [propertyType, setPropertyType] = useState('all');

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessage, setAiMessage] = useState('');

  // Search Results & Loading
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async (overrideParams = {}) => {
    setLoading(true);
    setAiMessage('');
    try {
      const payload = {
        destination,
        checkIn,
        checkOut,
        guests: Number(guests),
        rooms: Number(rooms),
        minRating: Number(minRating) || 0,
        maxPricePerNight: maxPrice ? Number(maxPrice) : null,
        starCategory: starCategory !== 'all' ? Number(starCategory) : null,
        accommodationType: propertyType !== 'all' ? propertyType : null,
        ...overrideParams,
      };

      const res = await hotelService.searchHotels(payload);
      if (res.data) {
        setHotels(res.data.results || []);
        setTotalResults(res.data.totalResults || 0);
      }
    } catch (err) {
      console.error('Hotel search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const handleAiCommand = async (promptText) => {
    const query = promptText || aiPrompt;
    if (!query) return;

    setLoading(true);
    setAiPrompt(query);
    try {
      const res = await hotelService.executeAiHotelCommand(query);
      if (res.data) {
        setAiMessage(res.data.message);
        if (res.data.hotels) {
          setHotels(res.data.hotels);
          setTotalResults(res.data.hotels.length);
        } else if (res.data.hotel) {
          setHotels([res.data.hotel]);
          setTotalResults(1);
        }
      }
    } catch (err) {
      console.error('AI command error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Header Banner */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-950 via-primary-900 to-slate-900 text-white rounded-3xl shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-500/20 border border-secondary-400/30 text-secondary-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
            <span>Multi-Provider Aggregator & Hotel Fit Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Curated Hotel Search, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-teal-300 to-amber-300">
              Evaluated For Your Trip.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Search live across 6 providers (Booking.com, Agoda, MakeMyTrip, Trip.com, Expedia, Hotels.com). Evaluate hotel fit, airport proximity, itinerary day-distances, and transport impact.
          </p>

          {/* AI Quick Copilot Command Bar */}
          <div className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-2xl max-w-3xl mx-auto mt-6 backdrop-blur-md text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-secondary-400">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>AI Stay Copilot Prompts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAiCommand('Find a hotel near my Day 2 activities.')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-secondary-600/30 border border-slate-700 hover:border-secondary-500/50 text-xs font-medium text-slate-200 hover:text-white transition-all text-left"
              >
                "Find a hotel near my Day 2 activities"
              </button>
              <button
                onClick={() => handleAiCommand('Find a 4-star hotel under ₹20,000.')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-secondary-600/30 border border-slate-700 hover:border-secondary-500/50 text-xs font-medium text-slate-200 hover:text-white transition-all text-left"
              >
                "Find a 4-star hotel under ₹20,000"
              </button>
              <button
                onClick={() => handleAiCommand('Move my hotel closer to downtown.')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-secondary-600/30 border border-slate-700 hover:border-secondary-500/50 text-xs font-medium text-slate-200 hover:text-white transition-all text-left"
              >
                "Move my hotel closer to downtown"
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 sm:p-7 rounded-2xl shadow-2xl border border-white/20 text-slate-900 dark:text-white max-w-5xl mx-auto text-left mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                label="Destination"
                placeholder="e.g. Dubai, Goa, Paris"
                icon={MapPin}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <Input
                label="Check In"
                type="date"
                icon={Calendar}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
              <Input
                label="Check Out"
                type="date"
                icon={Calendar}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
              <Select
                label="Guests"
                icon={Users}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                options={[
                  { value: '1', label: '1 Guest (Solo)' },
                  { value: '2', label: '2 Guests (Couple)' },
                  { value: '3', label: '3 Guests' },
                  { value: '4', label: '4 Guests (Family)' },
                ]}
              />
              <Select
                label="Rooms"
                icon={Building2}
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                options={[
                  { value: '1', label: '1 Room' },
                  { value: '2', label: '2 Rooms' },
                  { value: '3', label: '3 Rooms' },
                ]}
              />
            </div>

            {/* Filter Row */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Star Category"
                value={starCategory}
                onChange={(e) => setStarCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'All Star Ratings' },
                  { value: '3', label: '3-Star Properties' },
                  { value: '4', label: '4-Star Properties' },
                  { value: '5', label: '5-Star Luxury' },
                ]}
              />
              <Select
                label="Min Rating"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                options={[
                  { value: '0', label: 'Any Rating' },
                  { value: '4.0', label: '4.0+ Stars' },
                  { value: '4.5', label: '4.5+ Excellent' },
                  { value: '4.8', label: '4.8+ Exceptional' },
                ]}
              />
              <Input
                label="Max Price/Night (₹)"
                type="number"
                placeholder="e.g. 20000"
                icon={DollarSign}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <Select
                label="Property Type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                options={[
                  { value: 'all', label: 'All Property Types' },
                  { value: 'Hotel', label: 'Hotels' },
                  { value: 'Resort', label: 'Resorts' },
                  { value: 'Boutique', label: 'Boutique Stays' },
                  { value: 'Villa', label: 'Villas' },
                  { value: 'Apartment', label: 'Serviced Apartments' },
                ]}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>6 Provider Adapters • Booking.com, Agoda, MakeMyTrip, Trip.com, Expedia, Hotels.com</span>
              </div>
              <Button
                variant="primary"
                size="md"
                icon={Search}
                loading={loading}
                onClick={() => handleSearch()}
              >
                Search Hotel Matrix
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Message Alert */}
      {aiMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 rounded-2xl bg-secondary-500/10 border border-secondary-500/30 text-secondary-900 dark:text-secondary-200 text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary-600 shrink-0" />
              <span>{aiMessage}</span>
            </div>
            <button onClick={() => setAiMessage('')} className="text-xs text-slate-400 hover:text-white">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hotel Cards List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <Badge variant="secondary" size="sm" className="mb-2">
              Hotel Matrix Results ({totalResults})
            </Badge>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Available Stays & Hotel Fit Evaluation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated against travel itinerary, day center distances, and airport commuting cost
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Sparkles className="w-8 h-8 text-secondary-500 animate-spin mx-auto" />
            <p className="text-sm font-medium">Aggregating live provider matrix & evaluating Hotel Fit...</p>
          </div>
        ) : hotels.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Hotels Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No hotels matched your exact search filters. Try adjusting price, star rating, or destination.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotels.map((hotel, idx) => (
              <Card
                key={hotel.hotelId || idx}
                className="overflow-hidden hover:shadow-xl transition-all border border-slate-200/80 dark:border-slate-800"
              >
                <div className="relative h-56 overflow-hidden group">
                  <img
                    src={hotel.coverImage || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 font-bold text-xs shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
                      {hotel.hotelFit?.fitScore || hotel.vibeScore || 92}% Fit Score
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                      <Star className="w-3 h-3 fill-current" />
                      {hotel.starRating}★ ({hotel.userRating})
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-white font-semibold text-xs backdrop-blur-md">
                      {hotel.providerLogo && (
                        <img src={hotel.providerLogo} alt={hotel.providerName} className="w-4 h-4 object-contain rounded" />
                      )}
                      <span>{hotel.providerName}</span>
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">{hotel.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-secondary-600 shrink-0" />
                        {hotel.address || hotel.neighborhood || destination}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-slate-900 dark:text-white">
                        ₹{(hotel.pricePerNight?.amount || hotel.pricePerNight || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 block">/ night</span>
                    </div>
                  </div>

                  {/* HOTEL FIT INTELLIGENCE BLOCK */}
                  {hotel.hotelFit && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="flex items-center gap-1.5 text-secondary-600 dark:text-secondary-400">
                          <Compass className="w-4 h-4" /> Hotel Fit Summary
                        </span>
                        <span className="text-emerald-500 font-extrabold">{hotel.hotelFit.budgetCompatibility}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Distance to Day 1:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{hotel.hotelFit.distanceToDay1Text}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Distance to Day 2:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{hotel.hotelFit.distanceToDay2Text}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Airport Distance:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{hotel.hotelFit.airportDistanceText}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Area Suitability:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{hotel.hotelFit.areaSuitability}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {hotel.hotelFit.estimatedTransportImpact}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5">
                    {(hotel.amenities || []).map((am) => (
                      <span
                        key={am}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize"
                      >
                        {am.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {hotel.bookingUrl ? (
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Book on {hotel.providerName}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Direct booking link ready</span>
                    )}

                    <Link to={`/plan-trip?stay=${encodeURIComponent(hotel.name)}`}>
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Attach to Trip
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Hotels;
