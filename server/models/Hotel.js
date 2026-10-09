const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
    location: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    rating: { type: Number, default: 4.0 },
    imageUrl: { type: String, default: '' },
    amenities: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hotel', HotelSchema);
