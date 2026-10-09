const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
    cuisine: { type: String, required: true },
    averageCostForTwo: { type: Number, required: true },
    rating: { type: Number, default: 4.2 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', RestaurantSchema);
