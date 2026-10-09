const mongoose = require('mongoose');

const FlightSearchSchema = new mongoose.Schema(
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
      originAirport: { type: String, required: true, uppercase: true, trim: true },
      destinationAirport: { type: String, required: true, uppercase: true, trim: true },
      departureDate: { type: Date, required: true },
      returnDate: { type: Date },
      isRoundTrip: { type: Boolean, default: true },
      passengers: {
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        infants: { type: Number, default: 0 },
      },
      cabinClass: {
        type: String,
        enum: ['economy', 'premium_economy', 'business', 'first'],
        default: 'economy',
      },
      maxStops: { type: Number, default: 1 },
      preferredAirlines: [{ type: String }],
    },
    results: [
      {
        flightId: { type: String },
        airline: { type: String, required: true },
        airlineCode: { type: String },
        flightNumber: { type: String },
        departureAirport: { type: String, required: true },
        arrivalAirport: { type: String, required: true },
        departureTime: { type: Date, required: true },
        arrivalTime: { type: Date, required: true },
        durationMinutes: { type: Number },
        stopsCount: { type: Number, default: 0 },
        price: {
          amount: { type: Number, required: true },
          currency: { type: String, default: 'INR' },
        },
        cabinClass: { type: String, default: 'economy' },
        seatsRemaining: { type: Number, default: 9 },
        isEcoFriendly: { type: Boolean, default: false },
        score: { type: Number, default: 90 }, // AI flight score based on price/duration ratio
      },
    ],
    selectedFlightId: { type: String },
    status: {
      type: String,
      enum: ['active', 'expired', 'booked'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FlightSearch', FlightSearchSchema);
