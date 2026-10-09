const mongoose = require('mongoose');

const HotelSearchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      index: true,
    },
    searchParams: {
      destination: { type: String, required: true, trim: true },
      checkIn: { type: Date, required: true },
      checkOut: { type: Date, required: true },
      guests: {
        adults: { type: Number, default: 2 },
        children: { type: Number, default: 0 },
      },
      rooms: { type: Number, default: 1 },
      minRating: { type: Number, default: 4.0 },
      maxPricePerNight: { type: Number },
      propertyType: [{ type: String }], // hotel, resort, boutique, villa, apartment
      amenities: [{ type: String }], // wifi, pool, spa, breakfast, free_cancellation
    },
    results: [
      {
        hotelId: { type: String },
        name: { type: String, required: true },
        address: { type: String },
        neighborhood: { type: String },
        coordinates: {
          lat: { type: Number },
          lng: { type: Number },
        },
        starRating: { type: Number, default: 4 },
        userRating: { type: Number, default: 4.5 },
        reviewsCount: { type: Number, default: 0 },
        pricePerNight: {
          amount: { type: Number, required: true },
          currency: { type: String, default: 'INR' },
        },
        totalEstimate: { type: Number },
        images: [{ type: String }],
        coverImage: { type: String },
        amenities: [{ type: String }],
        vibeScore: { type: Number, default: 92 }, // AI neighborhood/ambiance match score
        distanceToCenterKm: { type: Number },
      },
    ],
    selectedHotelId: { type: String },
    status: {
      type: String,
      enum: ['active', 'expired', 'booked'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HotelSearch', HotelSearchSchema);
