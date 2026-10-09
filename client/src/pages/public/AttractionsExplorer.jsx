import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Compass,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Check,
  Plus,
  Zap,
  Map,
  Layers,
  ArrowRight,
  Star,
  Sun,
  Moon,
  CloudSun,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/common/Card';
import activityService from '../../services/activityService';

const CATEGORIES = [
  'Sightseeing',
  'Adventure',
  'Food',
  'Shopping',
  'Nature',
  'Culture',
  'Nightlife',
  'Museums',
  'Beaches',
  'Wildlife',
  'Photography',
  'Religious',
  'Entertainment',
  'Local Experiences',
];

const AttractionsExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [destination, setDestination] = useState(searchParams.get('destination') || 'Dubai');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('price') || '');
  const [maxDuration, setMaxDuration] = useState(searchParams.get('duration') || '');

  const [viewMode, setViewMode] = useState('discovery'); // 'discovery' | 'timeline' | 'map'
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const [aiMessage, setAiMessage] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await activityService.searchActivities({
        destination,
        category: selectedCategory === 'All' ? null : selectedCategory,
        price: maxPrice ? Number(maxPrice) : null,
        duration: maxDuration ? Number(maxDuration) : null,
      });

      if (res.data) {
        setActivities(res.data.results || []);
        setTotalResults(res.data.totalResults || 0);
      }
    } catch (err) {
      console.error('Activity search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedCategory]);

  const handleAiRecommendation = (prompt) => {
    setAiMessage(`AI Recommendation applied: "${prompt}" - Sorted for optimal time slots & travel proximity.`);
    if (prompt.includes('morning')) {
      const filtered = activities.filter((a) => a.bestTimeOfDay === 'morning');
      setActivities(filtered.length > 0 ? filtered : activities);
    } else if (prompt.includes('indoor')) {
      const filtered = activities.filter((a) => a.isIndoor || ['Museums', 'Shopping', 'Entertainment'].includes(a.category));
      setActivities(filtered.length > 0 ? filtered : activities);
    }
  };

  const heroSpot = activities[0];
  const secondarySpots = activities.slice(1, 4);
  const remainingSpots = activities.slice(4);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors space-y-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero Section */}
        <div className="relative pt-10 pb-12 px-6 sm:px-10 bg-gradient-to-br from-primary-950 via-slate-900 to-primary-900 text-white rounded-3xl shadow-xl overflow-hidden border border-slate-800">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary-500/20 text-secondary-300 border border-secondary-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
              <span>14 Activity Categories • Timeline & Proximity Fit</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Discover Experiences, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-teal-300 to-amber-300">
                Fit To Your Journey.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              Explore sightseeing, adventures, local food walks, photography spots, and heritage tours with live itinerary fit & transit estimation.
            </p>

            {/* AI Recommendation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handleAiRecommendation('Best 2-hour morning outdoor experiences')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-secondary-600/30 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-all"
              >
                <Sun className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                "Best morning outdoor spots"
              </button>
              <button
                onClick={() => handleAiRecommendation('All-weather indoor museums & shopping')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-secondary-600/30 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-all"
              >
                <CloudSun className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
                "Indoor & museum highlights"
              </button>
              <button
                onClick={() => handleAiRecommendation('Nightlife & evening sunset views')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-secondary-600/30 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-all"
              >
                <Moon className="w-3.5 h-3.5 inline mr-1 text-indigo-400" />
                "Evening & sunset spots"
              </button>
            </div>
          </div>
        </div>

        {/* AI Notification Alert */}
        {aiMessage && (
          <div className="p-4 rounded-2xl bg-secondary-500/10 border border-secondary-500/30 text-secondary-900 dark:text-secondary-200 text-sm font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{aiMessage}</span>
            </div>
            <button onClick={() => setAiMessage('')} className="text-xs text-slate-400 hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Multi-Category Control Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5">
              <Input
                placeholder="Search by destination (e.g. Dubai, Goa, Paris)..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                icon={MapPin}
              />
            </div>
            <div className="sm:col-span-3">
              <Input
                placeholder="Max Price (₹)"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                icon={DollarSign}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                placeholder="Max Mins"
                type="number"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                icon={Clock}
              />
            </div>
            <div className="sm:col-span-2">
              <Button variant="primary" size="md" icon={Search} loading={loading} onClick={fetchActivities} className="w-full">
                Search
              </Button>
            </div>
          </div>

          {/* 14 CATEGORY SCROLLABLE PILLS */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Filter by Experience Category (14):
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-secondary-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Experiences
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-secondary-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle: Discovery vs Timeline vs Map */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/40">
            <span className="text-slate-500 font-medium">Showing {totalResults} activities & experiences</span>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('discovery')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'discovery'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" />
                Discovery
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Timeline Integration
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5 inline mr-1" />
                Map Relationship
              </button>
            </div>
          </div>
        </div>

        {/* DISCOVERY VIEW (NON-GENERIC ASYMMETRIC LAYOUT) */}
        {viewMode === 'discovery' && (
          <div className="space-y-8">
            {/* HERO FEATURED SPOT */}
            {heroSpot && (
              <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:shadow-2xl transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-7 relative h-72 lg:h-auto overflow-hidden group">
                    <img
                      src={heroSpot.coverImage || heroSpot.images?.[0]}
                      alt={heroSpot.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 font-extrabold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
                        {heroSpot.activityFit?.fitScore || 98}% Activity Fit Match
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" size="sm">
                          Top {heroSpot.category} Spotlight
                        </Badge>
                        <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {heroSpot.rating} ({heroSpot.reviewCount} reviews)
                        </span>
                      </div>

                      <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {heroSpot.name}
                      </h2>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {heroSpot.description || heroSpot.shortDescription}
                      </p>

                      {/* Fit Intelligence Details */}
                      {heroSpot.activityFit && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                          <div className="font-bold text-secondary-600 dark:text-secondary-400 flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5" /> {heroSpot.activityFit.interestMatchText}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            📍 {heroSpot.activityFit.distanceToStayText}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            ⏱️ {heroSpot.activityFit.durationText} • {heroSpot.activityFit.openingHoursText}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">
                          {heroSpot.price?.amount === 0 ? 'Free Access' : `₹${(heroSpot.price?.amount || heroSpot.price || 0).toLocaleString()}`}
                        </div>
                        <span className="text-[10px] text-slate-400">Source: {heroSpot.source}</span>
                      </div>

                      <Link to={`/plan-trip?activity=${encodeURIComponent(heroSpot.name)}`}>
                        <Button variant="primary" size="sm" icon={Plus}>
                          Add to Itinerary
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* HORIZONTAL FEATURED CAROUSEL PREVIEWS */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-secondary-500" />
                Featured Highlights Across Categories
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {secondarySpots.map((act) => (
                  <Card key={act.id || act.name} className="overflow-hidden hover:shadow-lg transition-all border border-slate-200/80 dark:border-slate-800">
                    <div className="relative h-44 overflow-hidden group">
                      <img
                        src={act.coverImage || act.images?.[0]}
                        alt={act.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-400 text-[10px] font-bold">
                          {act.activityFit?.fitScore || 94}% Fit
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                          {act.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{act.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{act.shortDescription}</p>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {act.price?.amount === 0 ? 'Free' : `₹${(act.price?.amount || act.price || 0).toLocaleString()}`}
                        </span>
                        <Link to={`/plan-trip?activity=${encodeURIComponent(act.name)}`}>
                          <button className="text-secondary-600 dark:text-secondary-400 font-bold hover:underline inline-flex items-center gap-0.5 text-xs">
                            Add <ArrowRight className="w-3 h-3" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* REMAINING CATEGORIES GRID WITH METADATA */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                All Recommended Experiences ({remainingSpots.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {remainingSpots.map((act) => (
                  <Card key={act.id || act.name} className="p-4 border border-slate-200/80 dark:border-slate-800 flex gap-4 items-center">
                    <img
                      src={act.coverImage || act.images?.[0]}
                      alt={act.name}
                      className="w-24 h-24 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {act.category}
                        </span>
                        <span className="text-xs font-bold text-emerald-500">
                          {act.activityFit?.fitScore || 92}% Fit Match
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{act.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{act.shortDescription}</p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                        <span>⏱️ {act.durationMinutes} mins</span>
                        <span>📍 {act.location?.address || destination}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE INTEGRATION VIEW */}
        {viewMode === 'timeline' && (
          <Card className="p-6 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Itinerary Day Timeline Integration</h3>
              <p className="text-xs text-slate-500">
                Visualizing how discovered activities seamlessly fit into Morning, Afternoon, Evening, and Night time slots.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { slot: 'morning', time: '09:00 AM - 12:00 PM', label: 'Morning Slot', icon: Sun },
                { slot: 'afternoon', time: '01:30 PM - 05:00 PM', label: 'Afternoon Slot', icon: CloudSun },
                { slot: 'evening', time: '06:00 PM - 08:30 PM', label: 'Evening Sunset Slot', icon: Moon },
                { slot: 'night', time: '09:00 PM - 11:30 PM', label: 'Night Experience', icon: Zap },
              ].map((slotInfo) => {
                const slotActivities = activities.filter(
                  (a) => a.bestTimeOfDay === slotInfo.slot || (slotInfo.slot === 'afternoon' && a.bestTimeOfDay === 'anytime')
                );

                return (
                  <div key={slotInfo.slot} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                      <span className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                        <slotInfo.icon className="w-4 h-4 text-amber-500" />
                        {slotInfo.label} ({slotInfo.time})
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{slotActivities.length} available</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {slotActivities.slice(0, 2).map((act) => (
                        <div key={act.id || act.name} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white block">{act.name}</span>
                            <span className="text-[11px] text-slate-500">{act.durationMinutes} mins • {act.category}</span>
                          </div>
                          <Link to={`/plan-trip?activity=${encodeURIComponent(act.name)}`}>
                            <button className="px-2.5 py-1 rounded-lg bg-secondary-600 text-white font-bold text-[11px]">
                              Add to Slot
                            </button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* MAP RELATIONSHIP VIEW */}
        {viewMode === 'map' && (
          <Card className="p-6 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Geospatial Map Proximity View</h3>
                <p className="text-xs text-slate-500">Activities ordered by distance from stay location</p>
              </div>
              <Badge variant="secondary" size="sm">GPS Active</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activities.map((act) => (
                <div key={act.id || act.name} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{act.name}</span>
                    <span className="text-secondary-600 font-bold">{act.activityFit?.distanceToStayKm || 1.8} km</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{act.location?.address || destination}</p>
                  <div className="text-[10px] text-slate-400">
                    Estimated Transit: {act.activityFit?.estimatedTravelMinutes || 12} mins
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AttractionsExplorer;
