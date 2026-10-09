import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Tag,
  Star,
  Sparkles,
  Calendar,
  Compass,
  ShieldAlert,
  Lightbulb,
  Phone,
  Globe,
  Mail,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import attractionService from '../../services/attractionService';
import AttractionCard from '../../components/common/AttractionCard';
import ImageLightboxModal from '../../components/common/ImageLightboxModal';
import Button from '../../components/ui/Button';

const AttractionDetails = () => {
  const { slug } = useParams();
  const [attraction, setAttraction] = useState(null);
  const [relatedAttractions, setRelatedAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await attractionService.getAttractionBySlug(slug);

        if (res.success && res.data?.attraction) {
          const mainAttraction = res.data.attraction;
          setAttraction(mainAttraction);

          // Fetch related attractions for destination
          if (mainAttraction.destination?._id) {
            try {
              const relRes = await attractionService.getAttractionsByDestination(
                mainAttraction.destination._id,
                { limit: 4 }
              );
              if (relRes.success && relRes.data?.attractions) {
                setRelatedAttractions(
                  relRes.data.attractions.filter((a) => a._id !== mainAttraction._id)
                );
              }
            } catch (err) {
              console.warn('Could not fetch related attractions:', err);
            }
          }
        } else {
          setError('Attraction details not found.');
        }
      } catch (err) {
        console.error('Error fetching attraction details:', err);
        setError(err.response?.data?.message || 'Failed to load attraction details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto" />
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !attraction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attraction Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'Requested place does not exist.'}</p>
          <Link to="/explore/attractions">
            <Button variant="primary" size="sm">Back to Attractions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    destination,
    coverImage,
    images = [],
    category,
    type,
    shortDescription,
    description,
    rating,
    reviewCount,
    ticketPrice,
    estimatedVisitDuration,
    openingHours,
    location,
    bestTimeToVisit,
    facilities = [],
    accessibility,
    safetyInformation,
    travelTips = [],
    contact,
    tags = [],
    isFeatured,
  } = attraction;

  const allGalleryImages = [coverImage, ...images].filter(Boolean);

  const formatDuration = () => {
    if (!estimatedVisitDuration) return '1–2 Hours';
    const min = Math.round((estimatedVisitDuration.minMinutes / 60) * 10) / 10;
    const max = Math.round((estimatedVisitDuration.maxMinutes / 60) * 10) / 10;
    return `${min}–${max} Hours`;
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/explore/attractions" className="hover:text-primary-600 transition-colors">Attractions</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {destination && (
            <>
              <Link to={`/destinations/${destination.slug}`} className="hover:text-primary-600 transition-colors">{destination.name}</Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-slate-900 dark:text-white font-semibold truncate">{name}</span>
        </nav>

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[16/8] md:aspect-[21/9] shadow-xl">
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Link
              to="/explore/attractions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-white border border-white/20 hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div className="flex gap-2">
              {isFeatured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow">
                  <Sparkles className="w-3.5 h-3.5" /> Featured
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-600 text-white shadow">
                {category}
              </span>
            </div>
          </div>

          {/* Bottom Hero Info */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            {destination && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-300">
                <MapPin className="w-4 h-4" />
                <span>{destination.name}, {destination.state}, {destination.country}</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{rating ? rating.toFixed(1) : '4.5'}</span>
                <span className="text-slate-400 font-normal">({reviewCount || 0} reviews)</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-primary-400" />
                <span>Duration: {formatDuration()}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Ticket: {ticketPrice?.isFree ? 'Free' : `₹${ticketPrice?.amount}`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Details Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Short & Full Description */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary-600" /> About {name}
              </h2>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic border-l-4 border-primary-500 pl-3">
                "{shortDescription}"
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {description}
              </p>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Photo Gallery & Lightbox Trigger */}
            {allGalleryImages.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Photo Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allGalleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                      className="aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity group relative bg-slate-100 dark:bg-slate-900"
                    >
                      <img src={img} alt={`${name} ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities & Accessibility */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Facilities & Accessibility</h2>
              {facilities && facilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facilities.map((fac, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {fac}
                    </span>
                  ))}
                </div>
              )}
              {accessibility && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                  <strong>Accessibility Info:</strong> {accessibility}
                </p>
              )}
            </div>

            {/* Travel Tips & Safety Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {travelTips && travelTips.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" /> Travel Tips
                  </h3>
                  <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300 list-disc list-inside">
                    {travelTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {safetyInformation && (
                <div className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600" /> Safety Information
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    {safetyInformation}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Information Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Ticket Price Breakdown Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" /> Ticket & Entry Pricing
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">General Adult</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {ticketPrice?.isFree || ticketPrice?.adult === 0 ? 'Free' : `₹${ticketPrice?.adult || ticketPrice?.amount}`}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">Children</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {ticketPrice?.isFree || ticketPrice?.child === 0 ? 'Free' : `₹${ticketPrice?.child}`}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Foreign Visitor</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {ticketPrice?.isFree ? 'Free' : `₹${ticketPrice?.foreignVisitor || ticketPrice?.amount}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Opening Hours Schedule Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" /> Opening Hours
              </h3>

              <div className="space-y-1.5 text-xs">
                {daysOfWeek.map((day) => {
                  const dayData = openingHours?.[day] || { open: '09:00', close: '18:00', closed: false };
                  return (
                    <div key={day} className="flex justify-between items-center py-1 capitalize">
                      <span className="font-medium text-slate-600 dark:text-slate-400">{day}</span>
                      {dayData.closed ? (
                        <span className="text-red-500 font-semibold text-[11px] bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">Closed</span>
                      ) : (
                        <span className="text-slate-900 dark:text-white font-mono">{dayData.open} – {dayData.close}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {openingHours?.notes && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
                  Note: {openingHours.notes}
                </p>
              )}
            </div>

            {/* Location & Coordinates */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary-500" /> Location Details
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {location?.address || 'Address not specified'}
              </p>
              {location?.latitude && location?.longitude && (
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Attractions Section */}
        {relatedAttractions.length > 0 && (
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                More Places in {destination?.name}
              </h2>
              <Link to={`/explore/attractions?destination=${destination?.slug}`} className="text-xs font-bold text-primary-600 dark:text-secondary-400 hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedAttractions.slice(0, 3).map((rel) => (
                <AttractionCard key={rel._id} attraction={rel} />
              ))}
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <ImageLightboxModal
            images={allGalleryImages}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onSelectImage={setLightboxIndex}
          />
        )}
      </div>
    </div>
  );
};

export default AttractionDetails;
