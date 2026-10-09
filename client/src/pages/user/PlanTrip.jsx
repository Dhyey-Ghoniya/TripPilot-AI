import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Plane,
  Building2,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Info,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import tripService from '../../services/tripService';
import journalService from '../../services/journalService';

const PlanTrip = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const initialDestination = queryParams.get('destination') || 'Tokyo, Japan';
  const initialOrigin = queryParams.get('origin') || 'Ahmedabad, India';
  const initialBudget = queryParams.get('budget') || '85000';
  const initialDays = Number(queryParams.get('days')) || 6;
  const initialTravelers = queryParams.get('travelers') || 'Couple (2)';
  const initialPrompt = queryParams.get('prompt') || '';

  // Form State
  const [destination, setDestination] = useState(initialDestination);
  const [origin, setOrigin] = useState(initialOrigin);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState(initialDays);
  const [travelersType, setTravelersType] = useState(initialTravelers);
  const [budgetTotal, setBudgetTotal] = useState(initialBudget);
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [aiCustomNotes, setAiCustomNotes] = useState(initialPrompt);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [personalization, setPersonalization] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      journalService.getPersonalizationProfile()
        .then((res) => {
          if (res?.data?.copilotPersonalization) {
            setPersonalization(res.data.copilotPersonalization);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Calculate live budget distribution
  const totalNum = Number(budgetTotal) || 50000;
  const budgetAllocation = {
    flights: Math.round(totalNum * 0.35),
    hotel: Math.round(totalNum * 0.35),
    activities: Math.round(totalNum * 0.15),
    food: Math.round(totalNum * 0.1),
    transit: Math.round(totalNum * 0.05),
  };

  // Generate real-time preview structure
  useEffect(() => {
    const calculatedEndDate = new Date(
      new Date(startDate).getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];

    setGeneratedPreview({
      destination,
      origin,
      startDate,
      endDate: calculatedEndDate,
      durationDays,
      travelers: travelersType,
      budget: totalNum,
      days: Array.from({ length: durationDays }, (_, i) => ({
        day: i + 1,
        theme:
          i === 0
            ? 'Arrival & Neighborhood Walk'
            : i === durationDays - 1
            ? 'Farewell Highlights & Departure'
            : i % 2 === 1
            ? 'Historic Sights & Culture'
            : 'Culinary Trail & Modern Landmarks',
      })),
    });
  }, [destination, origin, startDate, durationDays, travelersType, totalNum]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const calculatedEndDate = new Date(
      new Date(startDate).getTime() + (durationDays - 1) * 24 * 60 * 60 * 1000
    );

    const payload = {
      title: `${destination} AI Blueprint`,
      destination: {
        name: destination,
        city: destination.split(',')[0].trim(),
        country: destination.includes(',') ? destination.split(',')[1].trim() : 'Global',
      },
      origin: {
        name: origin,
        city: origin.split(',')[0].trim(),
      },
      dates: {
        startDate: new Date(startDate),
        endDate: calculatedEndDate,
        durationDays,
      },
      travelers: {
        count: travelersType.includes('1') ? 1 : travelersType.includes('2') ? 2 : 4,
        type: travelersType.toLowerCase().includes('solo')
          ? 'solo'
          : travelersType.toLowerCase().includes('couple')
          ? 'couple'
          : 'friends',
      },
      budget: {
        total: totalNum,
        currency: 'INR',
        breakdown: budgetAllocation,
      },
      travelStyle,
      notes: aiCustomNotes,
    };

    try {
      if (isAuthenticated) {
        const response = await tripService.createTrip(payload);
        if (response && (response.success || response.data)) {
          const createdTrip = response.data || response;
          const targetId = createdTrip._id || createdTrip.id;
          addToast('Trip blueprint synthesized and opened in workspace!', 'success');
          if (targetId) {
            navigate(`/trips/${targetId}`);
          } else {
            navigate('/my-trips');
          }
          return;
        }
      }
      
      // If guest mode / not authenticated, inform user and allow saving after login
      addToast('Trip blueprint synthesized! Sign in to permanently sync and collaborate.', 'info');
      // Save temporary local draft
      sessionStorage.setItem('trippilot_draft', JSON.stringify(payload));
      navigate('/login?redirect=/my-trips');
    } catch (err) {
      console.error('[PlanTrip Error]:', err);
      addToast(err.customMessage || 'Failed to save trip. Check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-600 dark:text-secondary-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous Journey Engineering</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          AI Trip Command Center
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Configure your trip parameters. TripPilot AI calculates optimal pacing, flight corridors, neighborhood stays, and budget distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Parameters (7 cols) */}
        <form onSubmit={handleCreateTrip} className="lg:col-span-7 space-y-6">
          {/* AI Personalization Matrix Banner */}
          {personalization && (
            <Card className="p-5 bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-500/30 text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">AI Personalization Active</span>
                </div>
                <Badge variant="teal" size="sm" className="bg-teal-500/20 text-teal-300 border-teal-500/30">Auto-Tuned</Badge>
              </div>

              <div className="text-xs text-slate-300">
                <p className="font-semibold text-white mb-1.5">User frequently chooses:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(personalization.userFrequentlyChooses || ['Nature', 'Adventure', 'Budget hotels', 'Public transport']).map((choice, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-900/60 border border-teal-500/40 text-teal-200 text-xs font-medium">
                      ✓ {choice}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Non-sensitive travel characteristics only
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const extra = `Preferred style: ${(personalization.userFrequentlyChooses || ['Nature', 'Adventure', 'Budget hotels', 'Public transport']).join(', ')}`;
                    setAiCustomNotes((prev) => prev ? `${prev}. ${extra}` : extra);
                    addToast('Applied your learned travel preferences to trip blueprint notes!', 'success');
                  }}
                  className="text-teal-300 font-bold hover:underline"
                >
                  Apply to Blueprint
                </button>
              </div>
            </Card>
          )}

          <Card className="p-6 sm:p-8 space-y-6 border border-slate-200/80 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              Core Trip Coordinates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Destination (Anywhere in the World)"
                placeholder="e.g. Tokyo, Japan"
                icon={MapPin}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
              <Input
                label="Departure Origin City"
                placeholder="e.g. Ahmedabad, India"
                icon={Plane}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="date"
                icon={Calendar}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Duration (Days)
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-secondary-500"
                >
                  <option value={3}>3 Days (Weekend)</option>
                  <option value={4}>4 Days (Short Trip)</option>
                  <option value={5}>5 Days</option>
                  <option value={6}>6 Days (Recommended)</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={10}>10 Days (Extended)</option>
                  <option value={14}>14 Days (Grand Voyage)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Travelers
                </label>
                <select
                  value={travelersType}
                  onChange={(e) => setTravelersType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-secondary-500"
                >
                  <option value="Solo (1)">Solo (1 Traveler)</option>
                  <option value="Couple (2)">Couple (2 Travelers)</option>
                  <option value="Friends (3-4)">Friends (3-4 Travelers)</option>
                  <option value="Family (4)">Family (4 Travelers)</option>
                  <option value="Group (5+)">Group (5+ Travelers)</option>
                </select>
              </div>
            </div>

            {/* Target Budget & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Target Total Budget (₹ INR)"
                type="number"
                icon={Wallet}
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Travel Style & Pace
                </label>
                <select
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-secondary-500"
                >
                  <option value="balanced">Balanced Exploration</option>
                  <option value="cultural">Culture, History & Arts</option>
                  <option value="adventure">High Energy & Outdoors</option>
                  <option value="relaxation">Relaxed & Wellness</option>
                  <option value="foodie">Culinary & Street Food Trail</option>
                  <option value="luxury">Luxury & Exclusive</option>
                  <option value="budget-backpacker">Smart Backpacker</option>
                </select>
              </div>
            </div>

            {/* Custom AI Instructions */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                AI Copilot Instructions & Preferences (Optional)
              </label>
              <textarea
                rows="3"
                value={aiCustomNotes}
                onChange={(e) => setAiCustomNotes(e.target.value)}
                placeholder="e.g. Include vegetarian dining, prioritize photography spots at sunrise, prefer boutique hotels with good views..."
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-secondary-500 focus:outline-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Instant synthesis of days, flights & stays</span>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={Sparkles}
                loading={isSubmitting}
                className="w-full sm:w-auto"
              >
                Synthesize Trip Blueprint
              </Button>
            </div>
          </Card>
        </form>

        {/* Right: Live Blueprint Simulation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-slate-900 text-white border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Live Architecture Preview
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Ready to Generate
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">{destination}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                From {origin} · {durationDays} Days · {travelersType}
              </p>
            </div>

            {/* Budget Allocation Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Target Budget Allocation</span>
                <span className="font-black text-emerald-400 text-sm">₹{totalNum.toLocaleString('en-IN')}</span>
              </div>

              {/* Progress bar visual */}
              <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden flex">
                <div style={{ width: '35%' }} className="bg-sky-500" title="Flights: 35%" />
                <div style={{ width: '35%' }} className="bg-amber-500" title="Stays: 35%" />
                <div style={{ width: '15%' }} className="bg-emerald-500" title="Activities: 15%" />
                <div style={{ width: '10%' }} className="bg-rose-500" title="Food: 10%" />
                <div style={{ width: '5%' }} className="bg-indigo-500" title="Transit: 5%" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Flights: ₹{budgetAllocation.flights.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Stays: ₹{budgetAllocation.hotel.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Activities: ₹{budgetAllocation.activities.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Food & Dining: ₹{budgetAllocation.food.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Generated Days Roadmap */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-300 block">Day Sequencing Preview</span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {generatedPreview?.days?.map((d) => (
                  <div
                    key={d.day}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-secondary-500/20 text-secondary-400 font-bold flex items-center justify-center text-[11px]">
                        {d.day}
                      </span>
                      <span className="font-semibold text-slate-200">{d.theme}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Optimized</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
              <span>Full route polylines and live weather attach automatically on creation.</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlanTrip;
