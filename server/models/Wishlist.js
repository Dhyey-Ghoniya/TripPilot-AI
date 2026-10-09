const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate saved wishlist items for a user
WishlistSchema.index({ user: 1, destination: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);
