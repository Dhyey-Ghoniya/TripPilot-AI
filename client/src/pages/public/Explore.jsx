import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  Search,
  MapPin,
  Calendar,
  Wallet,
  Star,
  Clock,
  ArrowRight,
  Send,
  Layers,
  Map as MapIcon,
  Grid,
  TrendingUp,
  Heart,
  Zap,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/common/Modal';
import exploreService from '../../services/exploreService';
import useWishlist from '../../hooks/useWishlist';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AI_PROMPT_PRESETS = [
  'Find destinations like my previous trip.',
  'Suggest a 4-day adventure trip.',
  'Where can I travel under ₹30,000?',
  'Top beach escapes for a 5-day vacation.',
  'Cultural & food tour in Asia under ₹50,000.',
];

const Explore = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { isSaved, toggleWishlist } = useWishlist();

  const [exploreData, setExploreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('editorial'); // 'editorial' | 'map'
  const [selectedCategory, setSelectedCategory] = useState('All');

  // AI Discovery input state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Load explore page data
  useEffect(() => {
    const fetchExplore = async () => {
      setIsLoading(true);
      try {
        const res = await exploreService.getExploreData();
        setExploreData(res?.data || res);
      } catch (err) {
        console.error('[Explore] Error loading discovery layer:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExplore();
  }, []);

  // Handle AI Discovery search
  const handleRunAiDiscovery = async (customPrompt = null) => {
    const query = customPrompt || aiPrompt;
    if (!query || !query.trim()) return;

    setIsAiLoading(true);
    setShowAiModal(true);
    try {
      const res = await exploreService.aiDiscovery(query.trim());
      setAiResult(res?.data || res);
    } catch (err) {
      console.error('[Explore] AI Discovery error:', err);
      setAiResult({ success: false, message: 'Could not process discovery request.' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading Discovery Layer...</span>
      </div>
    );
  }

  const {
    recommendedForYou = [],
    aiDiscoveries = [],
    travelCollections = [],
    popularExperiences = [],
    weekendIdeas = [],
  } = exploreData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO EDITORIAL & AI DISCOVERY BAR                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-2xl space-y-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>AI Travel Discovery Layer</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Explore Beyond Boundaries
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Discover personalized destinations, curated travel collections, and top experiences powered by profile preferences, past trip memory, and AI budget optimization.
          </p>

          {/* AI Search & Discovery Prompt Input */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-indigo-300 shrink-0" />
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAiDiscovery()}
                  placeholder="Ask AI Copilot (e.g. 'Suggest a 4-day adventure trip under ₹30,000')..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleRunAiDiscovery()}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-secondary-500 to-indigo-600 text-white text-xs font-bold hover:from-secondary-600 hover:to-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {isAiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Discover</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prompt Presets */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick Discovery Prompts:</span>
            {AI_PROMPT_PRESETS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiPrompt(prompt);
                  handleRunAiDiscovery(prompt);
                }}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-[11px] font-semibold text-slate-300 border border-white/10 transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle Bar (Editorial vs Map) */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">View Mode:</span>
            <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl">
              <button
                onClick={() => setViewMode('editorial')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'editorial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Editorial Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Discovery Map
              </button>
            </div>
          </div>

          <Link to="/plan-trip" className="flex items-center gap-1.5 text-xs font-bold text-secondary-400 hover:underline">
            <span>Build custom trip with AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* INTERACTIVE MAP DISCOVERY VIEW (IF TOGGLED)                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {viewMode === 'map' ? (
        <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Interactive Global Discovery Map</h3>
            </div>
            <Badge variant="secondary" size="sm">
              {recommendedForYou.length + weekendIdeas.length} Pins Loaded
            </Badge>
          </div>

          <div className="relative h-[480px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div className="space-y-1 max-w-md">
              <h4 className="text-lg font-bold text-white">Interactive Destination Radar</h4>
              <p className="text-xs text-slate-400">
                Visualizing destinations, regional climate zones, and experience clusters worldwide. Click any marker to view personalized score.
              </p>
            </div>
            {/* Pins Showcase Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl pt-2">
              {recommendedForYou.slice(0, 4).map((d) => (
                <div
                  key={d._id || d.name}
                  onClick={() => navigate(`/destinations/${d.slug || d._id}`)}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-left space-y-1 border border-white/10"
                >
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">{d.matchScore}% Match</span>
                  <span className="text-xs font-bold text-white block truncate">{d.name}</span>
                  <span className="text-[10px] text-slate-400 block">{d.country}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* EDITORIAL GRID SECTIONS (ALL 5 SECTIONS)                        */
        /* ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-14">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 1: RECOMMENDED FOR YOU (Personalized)                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary-500" />
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Recommended for You</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Personalized matching based on profile preferences, past trip memory, wishlist, and budget patterns
                </p>
              </div>
              <Badge variant="emerald" size="sm">
                Privacy Protected & Privacy Compliant
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedForYou.map((dest) => {
                const id = dest._id;
                return (
                  <Card key={id} className="group overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col">
                    {/* Image Header */}
                    <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={dest.coverImage || dest.images?.[0]}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Personalization Match Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md">
                          {dest.matchScore}% Match
                        </span>
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => toggleWishlist(id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition backdrop-blur-sm"
                      >
                        <Heart className={`w-4 h-4 ${isSaved(id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>

                      {/* Title Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] uppercase font-bold text-slate-300 block">{dest.state ? `${dest.state}, ${dest.country}` : dest.country}</span>
                        <h3 className="text-lg font-black truncate">{dest.name}</h3>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{dest.shortDescription}</p>

                        {/* Recommendation Reason */}
                        <div className="p-2.5 rounded-xl bg-secondary-500/10 text-secondary-700 dark:text-secondary-300 text-[11px] font-semibold flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-secondary-500 shrink-0" />
                          <span className="truncate">{dest.recommendationReason}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Daily Budget</span>
                          <span className="font-black text-slate-900 dark:text-white">~{formatCurrency(dest.estimatedBudget?.maxPerDay || 4000)}/day</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/destinations/${dest.slug || dest._id}`)}
                        >
                          Explore
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 2: AI DISCOVERIES (Prompt Cards)                      */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-purple-500" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">AI Discoveries</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Natural language travel discovery — trigger instant AI destination & trip recommendation synthesis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiDiscoveries.map((disc) => (
                <Card
                  key={disc.id}
                  className="p-6 border border-purple-200/60 dark:border-purple-900/30 hover:border-purple-400 transition-all duration-300 flex flex-col justify-between space-y-4 bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="accent" size="xs">{disc.badge}</Badge>
                      <Sparkles className="w-4 h-4 text-purple-500 group-hover:rotate-12 transition-transform" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{disc.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{disc.description}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setAiPrompt(disc.prompt);
                        handleRunAiDiscovery(disc.prompt);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500 text-purple-600 dark:text-purple-400 hover:text-white text-xs font-bold transition flex items-center justify-between"
                    >
                      <span>Run Discovery</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 3: TRAVEL COLLECTIONS (Editorial Banners)             */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Travel Collections</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Handcrafted editorial themes grouped by travel style, landscape, and cultural heritage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {travelCollections.map((coll) => (
                <div
                  key={coll.id}
                  className="relative rounded-3xl overflow-hidden h-64 group cursor-pointer border border-slate-200 dark:border-slate-800 shadow-xl"
                  onClick={() => handleRunAiDiscovery(`Show ${coll.title} destinations`)}
                >
                  <img
                    src={coll.coverImage}
                    alt={coll.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                      {coll.tag}
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-xs font-semibold text-indigo-300 block">{coll.destinationCount} Destinations</span>
                    <h3 className="text-xl font-black">{coll.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-1">{coll.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 4: POPULAR EXPERIENCES (Activities & Attractions)    */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Popular Experiences</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top-rated activities, tours, and unique sightseeing experiences recommended by travelers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularExperiences.map((exp) => (
                <Card key={exp.id} className="overflow-hidden border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={exp.coverImage} alt={exp.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{exp.rating}</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{exp.category} · {exp.location}</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{exp.title}</h4>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>{Math.round(exp.durationMinutes / 60)}h</span>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white">{formatCurrency(exp.estimatedCost)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 5: WEEKEND IDEAS (2-3 Day Getaways)                   */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Weekend Ideas</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quick 2-3 day escapes with transparent total budget estimates
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {weekendIdeas.map((idea) => (
                <Card key={idea._id} className="p-5 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="emerald" size="xs">{idea.quickTag}</Badge>
                      <span className="text-xs font-bold text-slate-400">{idea.idealDays} Days</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{idea.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{idea.shortDescription}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Trip Est.</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(idea.estimatedTotalBudget)}</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/plan-trip?destination=${encodeURIComponent(idea.name)}&duration=3`)}
                    >
                      Plan Weekend
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AI DISCOVERY RESULT MODAL                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="AI Discovery Synthesis"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 py-2">
          {isAiLoading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">Synthesizing personalized AI recommendations...</span>
            </div>
          ) : aiResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Discovery Response</span>
                <p className="font-semibold text-purple-900 dark:text-purple-200 text-sm">{aiResult.message}</p>
              </div>

              {/* Discovery Results */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matches Found ({aiResult.results?.length || 0})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(aiResult.results || []).map((item, idx) => {
                    const dest = item.destination || item;
                    return (
                      <Card key={idx} className="p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{dest.name || item.title}</span>
                          {item.estimatedTotal4DayCost && (
                            <Badge variant="emerald" size="xs">{formatCurrency(item.estimatedTotal4DayCost)}</Badge>
                          )}
                        </div>

                        {item.highlights && (
                          <ul className="text-[11px] text-slate-500 space-y-1">
                            {item.highlights.map((h, i) => (
                              <li key={i}>• {h}</li>
                            ))}
                          </ul>
                        )}

                        {dest.shortDescription && (
                          <p className="text-xs text-slate-500 line-clamp-2">{dest.shortDescription}</p>
                        )}

                        <div className="pt-2 flex justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setShowAiModal(false);
                              navigate(`/plan-trip?destination=${encodeURIComponent(dest.name || 'Dubai')}`);
                            }}
                          >
                            Plan This Trip →
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400">No results found.</span>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Explore;
