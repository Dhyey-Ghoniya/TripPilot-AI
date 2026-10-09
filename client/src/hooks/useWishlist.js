import { useState, useEffect, useCallback } from 'react';
import wishlistService from '../services/wishlistService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const useWishlist = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [savedDestinationIds, setSavedDestinationIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      setSavedDestinationIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const response = await wishlistService.getWishlist();
      if (response && response.success && response.data?.destinations) {
        setWishlistItems(response.data.destinations);
        const ids = new Set(response.data.destinations.map((d) => d._id || d.id));
        setSavedDestinationIds(ids);
      }
    } catch (err) {
      console.warn('[Wishlist Hook Notice]:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (destinationId, destinationName = 'Destination') => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return false;
    }

    const isCurrentlySaved = savedDestinationIds.has(destinationId);

    // Optimistic UI Update
    setSavedDestinationIds((prev) => {
      const updated = new Set(prev);
      if (isCurrentlySaved) {
        updated.delete(destinationId);
      } else {
        updated.add(destinationId);
      }
      return updated;
    });

    try {
      if (isCurrentlySaved) {
        await wishlistService.removeFromWishlist(destinationId);
        showToast(`Removed ${destinationName} from wishlist`, 'info');
        setWishlistItems((prev) => prev.filter((item) => (item._id || item.id) !== destinationId));
      } else {
        await wishlistService.addToWishlist(destinationId);
        showToast(`Saved ${destinationName} to your wishlist! ❤️`, 'success');
      }
      return true;
    } catch (err) {
      // Revert optimistic update on failure
      setSavedDestinationIds((prev) => {
        const updated = new Set(prev);
        if (isCurrentlySaved) {
          updated.add(destinationId);
        } else {
          updated.delete(destinationId);
        }
        return updated;
      });
      showToast(err.customMessage || 'Failed to update wishlist', 'error');
      return false;
    }
  };

  const isSaved = (destinationId) => savedDestinationIds.has(destinationId);

  return {
    wishlistItems,
    savedDestinationIds,
    isSaved,
    toggleWishlist,
    isLoading,
    isAuthModalOpen,
    setIsAuthModalOpen,
    refetchWishlist: fetchWishlist,
  };
};

export default useWishlist;
