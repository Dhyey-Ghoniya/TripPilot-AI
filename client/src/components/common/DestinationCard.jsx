import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Heart, ArrowRight, Wallet } from 'lucide-react';
import Card from './Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const DestinationCard = ({
  destination,
  isSaved = false,
  onWishlistToggle,
  className = '',
}) => {
  if (!destination) return null;

  const destId = destination._id || destination.id;
  const slug = destination.slug || destination.id;
  const coverImg =
    destination.coverImage ||
    destination.imageUrl ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

  const categoryName =
    Array.isArray(destination.categories) && destination.categories.length > 0
      ? destination.categories[0]
      : destination.category || 'Travel';

  // Format daily budget display
  let budgetDisplay = '₹2,500 – ₹5,000 / day';
  if (typeof destination.estimatedBudget === 'object' && destination.estimatedBudget?.minPerDay) {
    budgetDisplay = `₹${destination.estimatedBudget.minPerDay.toLocaleString()} – ₹${destination.estimatedBudget.maxPerDay.toLocaleString()} / day`;
  } else if (typeof destination.estimatedBudget === 'string') {
    budgetDisplay = destination.estimatedBudget;
  }

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(destId, destination.name || destination.title);
    }
  };

  return (
    <Card
      hover
      className={`group overflow-hidden flex flex-col p-0 border border-slate-100 dark:border-slate-800 ${className}`}
    >
      {/* Image Banner */}
      <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={coverImg}
          alt={destination.name || destination.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Wishlist Heart Toggle */}
        <button
          onClick={handleHeartClick}
          className={`absolute top-3.5 right-3.5 p-2.5 rounded-full backdrop-blur-md transition shadow-md ${
            isSaved
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-400'
          }`}
          title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Category Badge */}
        <div className="absolute top-3.5 left-3.5">
          <Badge variant="secondary" size="sm">
            {categoryName}
          </Badge>
        </div>

        {/* Rating Chip */}
        <div className="absolute bottom-3.5 left-3.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-sm">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span>{destination.rating || 4.5}</span>
          {destination.reviewCount !== undefined && (
            <span className="text-slate-300 font-normal">({destination.reviewCount})</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition mb-1">
            {destination.name || destination.title}
          </h3>

          <p className="text-xs text-secondary-600 dark:text-secondary-400 font-semibold mb-2.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {destination.city || destination.location || ''}
            {destination.state ? `, ${destination.state}` : ''}
            {destination.country ? `, ${destination.country}` : ''}
          </p>

          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
            {destination.shortDescription || destination.description}
          </p>
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              Est. Budget
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              {budgetDisplay}
            </span>
          </div>

          <Link to={`/destinations/${slug}`} className="block">
            <Button variant="outline" size="sm" icon={ArrowRight} className="w-full">
              Explore Destination
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default DestinationCard;
