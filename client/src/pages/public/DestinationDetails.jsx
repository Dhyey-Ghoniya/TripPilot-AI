import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Heart,
  Calendar,
  Wallet,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Info,
  Layers,
  Maximize2,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import ImageLightboxModal from '../../components/common/ImageLightboxModal';
import destinationService from '../../services/destinationService';
import attractionService from '../../services/attractionService';
import AttractionCard from '../../components/common/AttractionCard';
import useWishlist from '../../hooks/useWishlist';

const DestinationDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [destination, setDestination] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { isSaved, toggleWishlist, isAuthModalOpen, setIsAuthModalOpen } = useWishlist();

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await destinationService.getDestinationBySlug(slug);
        if (response && response.success && response.data?.destination) {
          const dest = response.data.destination;
          setDestination(dest);

          // Fetch associated attractions
          try {
            const attrRes = await attractionService.getAttractionsByDestination(dest._id, { limit: 6 });
            if (attrRes.success && attrRes.data?.attractions) {
              setAttractions(attrRes.data.attractions);
            }
          } catch (attrErr) {
            console.warn('Could not load destination attractions:', attrErr);
          }
        } else {
          setError(response?.message || 'Destination not found');
        }
      } catch (err) {
        setError(err.customMessage || err.message || 'Failed to load destination details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingState message="Loading destination details..." />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Destination Not Found"
          message={error || "The destination you're looking for doesn't exist."}
          onRetry={() => navigate('/explore')}
        />
      </div>
    );
  }

  const destId = destination._id || destination.id;
  const saved = isSaved(destId);

  const breadcrumbItems = [
    { label: 'Explore', href: '/explore' },
    { label: destination.name },
  ];

  const galleryImages = [
    destination.coverImage,
    ...(destination.images || []),
  ].filter(Boolean);

  const budget = destination.estimatedBudget || {};
  const bestTime = destination.bestTimeToVisit || {};
  const duration = destination.averageDuration || { minDays: 3, maxDays: 5 };

  return (
    <div className="space-y-10 pb-16">
      {/* BREADCRUMBS BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative h-[65vh] min-h-[420px] w-full rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={destination.coverImage}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top Actions */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
            <Link to="/explore">
              <Button variant="secondary" size="sm" icon={ArrowLeft} className="bg-slate-900/80 text-white backdrop-blur-md border-none">
                Back to Explore
              </Button>
            </Link>

            <button
              onClick={() => toggleWishlist(destId, destination.name)}
              className={`p-3 rounded-full backdrop-blur-md transition shadow-lg ${
                saved
                  ? 'bg-rose-500 text-white shadow-rose-500/30'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Hero Content Overlay */}
          <div className="absolute bottom-8 left-6 right-6 sm:left-10 sm:right-10 text-white space-y-4 max-w-3xl z-10">
            <div className="flex flex-wrap items-center gap-2">
              {(destination.categories || []).map((cat) => (
                <Badge key={cat} variant="secondary" size="sm" className="bg-white/20 text-white backdrop-blur-md border-none">
                  {cat}
                </Badge>
              ))}
              <div className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{destination.rating} ({destination.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
              {destination.name}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-secondary-400 shrink-0" />
              {destination.city}, {destination.state}, {destination.country}
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link to={`/plan-trip?destination=${encodeURIComponent(destination.name)}`}>
                <Button variant="accent" size="lg" icon={Sparkles}>
                  Plan a Trip Here
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DETAILS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: OVERVIEW, BUDGET, BEST TIME, TIPS */}
        <div className="lg:col-span-2 space-y-8">
          {/* ABOUT CARD */}
          <Card className="p-8 space-y-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">About {destination.name}</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {destination.description}
            </p>

            {/* Quick Info Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Recommended Stay</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {duration.minDays} - {duration.maxDays} Days
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Climate</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{destination.climate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Languages</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {(destination.languages || ['Hindi', 'English']).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Local Transport</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {destination.localTransport || 'Taxis, rentals'}
                </span>
              </div>
            </div>
          </Card>

          {/* BUDGET CARD */}
          <Card className="p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Estimated Daily Budget</h3>
                  <p className="text-xs text-slate-400">Per person per day cost range</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{budget.minPerDay?.toLocaleString() || '2,500'} – ₹{budget.maxPerDay?.toLocaleString() || '5,000'}
                </span>
                <span className="text-[10px] text-slate-400 block">per day</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">Accommodation</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ₹{budget.accommodation?.min} - ₹{budget.accommodation?.max}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">Food & Dining</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ₹{budget.food?.min} - ₹{budget.food?.max}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">Local Transport</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ₹{budget.localTransport?.min} - ₹{budget.localTransport?.max}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 font-semibold block">Sightseeing & Activities</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ₹{budget.activities?.min} - ₹{budget.activities?.max}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 italic">
              <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              Estimated costs are informational and may vary depending on season, availability and individual travel choices.
            </p>
          </Card>

          {/* BEST TIME TO VISIT CARD */}
          <Card className="p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Best Time to Visit</h3>
                <p className="text-xs text-slate-400">Peak weather conditions and travel seasons</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="accent" size="lg">
                  {bestTime.season || 'Winter & Spring'}
                </Badge>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {(bestTime.months || ['October', 'November', 'December', 'January']).join(' • ')}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {bestTime.description || 'Optimal weather conditions for sightseeing, outdoor excursions, and local festivals.'}
              </p>
            </div>
          </Card>

          {/* TRAVEL TIPS & SAFETY CARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Travel Tips
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {(destination.travelTips || [
                  'Carry valid government photo identification.',
                  'Pre-book local transportation and stays during peak season.',
                  'Try local culinary delicacies.',
                ]).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-secondary-600 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                Safety & Important Info
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {destination.safetyInformation || 'Standard travel precautions apply. Keep emergency contacts and hotel details easily accessible.'}
              </p>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: GALLERY & CTA */}
        <div className="space-y-8">
          {/* GALLERY GRID */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary-600" />
                Photo Gallery
              </h3>
              <span className="text-xs text-slate-400">{galleryImages.length} Photos</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setIsLightboxOpen(true);
                  }}
                  className="relative h-28 rounded-xl overflow-hidden cursor-pointer group"
                >
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* THINGS TO DO / ATTRACTIONS SECTION */}
          {attractions && attractions.length > 0 && (
            <Card className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary-600 dark:text-secondary-400" />
                    Things To Do in {destination.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Popular monuments, beaches, and experiences in this destination.
                  </p>
                </div>
                <Link
                  to={`/explore/attractions?destination=${destination.slug}`}
                  className="text-xs font-bold text-primary-600 dark:text-secondary-400 hover:underline inline-flex items-center gap-1"
                >
                  View All Places ({attractions.length}+)
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attractions.map((attraction) => (
                  <AttractionCard key={attraction._id} attraction={attraction} />
                ))}
              </div>
            </Card>
          )}

          {/* PLAN TRIP BANNER CARD */}
          <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-secondary-950 text-white space-y-4 border-none shadow-xl">
            <h3 className="text-xl font-bold text-white">Ready to visit {destination.name}?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create a personalized itinerary structure with route optimization and custom budget tracking.
            </p>
            <Link to={`/plan-trip?destination=${encodeURIComponent(destination.name)}`} className="block">
              <Button variant="accent" size="md" icon={Sparkles} className="w-full">
                Plan Trip to {destination.name}
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* GALLERY LIGHTBOX MODAL */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={galleryImages}
        currentIndex={lightboxIndex}
        onNavigate={setLightboxIndex}
      />

      {/* AUTH PROMPT MODAL FOR WISHLIST */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Sign in Required"
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4 py-2">
          <h4 className="font-bold text-base text-slate-900 dark:text-white">
            Save to your Wishlist
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to bookmark destinations to your personal travel wishlist.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login">
              <Button variant="primary" size="md" className="w-full">Log In</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="md" className="w-full">Create Account</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DestinationDetails;
