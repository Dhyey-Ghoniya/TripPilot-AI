import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, Tag, Sparkles, Compass } from 'lucide-react';
import Badge from '../ui/Badge';

const AttractionCard = ({ attraction }) => {
  const {
    name,
    slug,
    destination,
    coverImage,
    category,
    type,
    rating,
    reviewCount,
    ticketPrice,
    estimatedVisitDuration,
    tags,
    isFeatured,
    shortDescription,
  } = attraction;

  const destinationName = destination?.name || 'Destination';
  const priceDisplay = ticketPrice?.isFree || ticketPrice?.amount === 0 ? 'Free' : `₹${ticketPrice?.amount?.toLocaleString('en-IN')}`;
  
  const formatDuration = () => {
    if (!estimatedVisitDuration) return '1–2 hrs';
    const min = Math.round(estimatedVisitDuration.minMinutes / 60 * 10) / 10;
    const max = Math.round(estimatedVisitDuration.maxMinutes / 60 * 10) / 10;
    return `${min}–${max} hrs`;
  };

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900">
        <img
          src={coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              Featured
            </span>
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
            {category}
          </span>
        </div>

        {/* Destination & Rating Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1 text-slate-200 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
            <span className="truncate">{destinationName}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm text-amber-400 font-semibold shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{rating ? rating.toFixed(1) : '4.5'}</span>
            <span className="text-slate-400 text-[10px]">({reviewCount || 0})</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div>
          <Link to={`/explore/attractions/${slug}`} className="block">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-secondary-400 transition-colors line-clamp-1">
              {name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {shortDescription}
          </p>
        </div>

        {/* Key Details: Price & Duration */}
        <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <span>Visit: <strong>{formatDuration()}</strong></span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-300">
            <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Ticket: <strong className={ticketPrice?.isFree ? 'text-emerald-600 dark:text-emerald-400' : ''}>{priceDisplay}</strong></span>
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action CTA */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {type || 'Attraction'}
          </span>
          <Link
            to={`/explore/attractions/${slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-secondary-400 hover:text-primary-700 dark:hover:text-secondary-300 transition-colors"
          >
            <span>Explore Place</span>
            <Compass className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AttractionCard;
