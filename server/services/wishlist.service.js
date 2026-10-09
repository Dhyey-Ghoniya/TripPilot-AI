const Wishlist = require('../models/Wishlist');
const Destination = require('../models/Destination');

class WishlistService {
  async getWishlist(userId) {
    const items = await Wishlist.find({ user: userId })
      .populate('destination')
      .sort({ createdAt: -1 });

    // Filter out deleted or inactive destinations
    const activeItems = items.filter(
      (item) => item.destination && item.destination.isActive
    );

    return activeItems.map((item) => item.destination);
  }

  async addToWishlist(userId, destinationId) {
    const destination = await Destination.findById(destinationId);
    if (!destination || !destination.isActive) {
      const error = new Error('Destination not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    const wishlistItem = await Wishlist.findOneAndUpdate(
      { user: userId, destination: destinationId },
      { user: userId, destination: destinationId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return wishlistItem;
  }

  async removeFromWishlist(userId, destinationId) {
    const result = await Wishlist.findOneAndDelete({
      user: userId,
      destination: destinationId,
    });

    if (!result) {
      const error = new Error('Wishlist item not found');
      error.statusCode = 404;
      throw error;
    }

    return { message: 'Destination removed from wishlist' };
  }

  async checkWishlistStatus(userId, destinationId) {
    const item = await Wishlist.findOne({
      user: userId,
      destination: destinationId,
    });
    return { isSaved: Boolean(item) };
  }
}

module.exports = new WishlistService();
