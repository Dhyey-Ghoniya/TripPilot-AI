import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Compass } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import DestinationCard from '../../components/common/DestinationCard';
import DestinationCardSkeleton from '../../components/common/DestinationCardSkeleton';
import EmptyState from '../../components/common/EmptyState';
import useWishlist from '../../hooks/useWishlist';

const Wishlist = () => {
  const { wishlistItems, isLoading, isSaved, toggleWishlist } = useWishlist();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="sm" className="mb-1">
            Bookmarked Places
          </Badge>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Saved Wishlist</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Destinations you have saved for future trip planning
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          {wishlistItems.length} Saved {wishlistItems.length === 1 ? 'Destination' : 'Destinations'}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <DestinationCardSkeleton key={i} />
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save destinations you would like to explore later while browsing."
          actionLabel="Explore Destinations"
          onAction={() => (window.location.href = '/explore')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlistItems.map((dest) => {
            const id = dest._id || dest.id;
            return (
              <DestinationCard
                key={id}
                destination={dest}
                isSaved={isSaved(id)}
                onWishlistToggle={toggleWishlist}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
