const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['planning', 'upcoming', 'ongoing', 'completed', 'cancelled', 'draft', 'saved', 'archived'],
      default: 'planning',
      index: true,
    },
    // Destinations supporting information
    destinations: [{
      name: { type: String, required: true, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, default: 'India', trim: true },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
      placeId: { type: String, default: '' },
      coverImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      },
    }],
    origin: {
      name: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
      airportCode: { type: String, default: '', trim: true },
    },
    // Travel timeline & dates
    dates: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      durationDays: { type: Number, default: 1 },
      isFlexible: { type: Boolean, default: false },
    },
    duration: { type: Number, default: 1 },
    // Travelers configuration
    travelers: {
      count: { type: Number, default: 1, min: 1 },
      type: {
        type: String,
        enum: ['solo', 'couple', 'family', 'friends', 'group'],
        default: 'solo',
      },
      adults: { type: Number, default: 1 },
      children: { type: Number, default: 0 },
    },
    travelerProfiles: [{
      name: { type: String },
      ageGroup: { type: String },
      preferences: [{ type: String }],
    }],
    // Budget structure
    budget: {
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      spent: { type: Number, default: 0 },
      breakdown: {
        flights: { type: Number, default: 0 },
        hotel: { type: Number, default: 0 },
        activities: { type: Number, default: 0 },
        food: { type: Number, default: 0 },
        transit: { type: Number, default: 0 },
        misc: { type: Number, default: 0 },
      },
    },
    // Flights attached to trip
    flightSearchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlightSearch',
    },
    flights: [
      {
        direction: { type: String, enum: ['outbound', 'return'], default: 'outbound' },
        airline: { type: String, default: '' },
        flightNumber: { type: String, default: '' },
        departureAirport: { type: String, default: '' },
        arrivalAirport: { type: String, default: '' },
        departureTime: { type: Date },
        arrivalTime: { type: Date },
        price: { type: Number, default: 0 },
        cabinClass: { type: String, default: 'Economy' },
        bookingReference: { type: String, default: '' },
        status: { type: String, enum: ['searched', 'shortlisted', 'booked'], default: 'searched' },
      },
    ],
    // Hotel / Stays attached to trip
    hotelSearchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HotelSearch',
    },
    hotels: [{
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      roomType: { type: String, default: 'Standard Room' },
      checkIn: { type: Date },
      checkOut: { type: Date },
      pricePerNight: { type: Number, default: 0 },
      totalCost: { type: Number, default: 0 },
      rating: { type: Number, default: 4.5 },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
      imageUrl: { type: String, default: '' },
      bookingReference: { type: String, default: '' },
      status: { type: String, enum: ['searched', 'shortlisted', 'booked'], default: 'searched' },
    }],
    // Activities attached to trip
    activities: [
      {
        activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
        title: { type: String, required: true },
        dayNumber: { type: Number, default: 1 },
        timeSlot: { type: String, default: 'morning' }, // morning, afternoon, evening, night
        durationMinutes: { type: Number, default: 120 },
        location: { type: String, default: '' },
        estimatedCost: { type: Number, default: 0 },
        status: { type: String, enum: ['planned', 'completed', 'skipped'], default: 'planned' },
        notes: { type: String, default: '' },
      },
    ],
    restaurants: [
      {
        name: { type: String },
        cuisine: { type: String },
        dayNumber: { type: Number },
        timeSlot: { type: String },
        estimatedCost: { type: Number, default: 0 },
      }
    ],
    // Itinerary reference
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
    },
    // Map & Geospatial routing info
    mapData: {
      center: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
      zoom: { type: Number, default: 11 },
      waypoints: [
        {
          name: { type: String },
          lat: { type: Number },
          lng: { type: Number },
          dayNumber: { type: Number },
          order: { type: Number },
        },
      ],
    },
    // Weather forecast snapshot
    weatherForecast: [
      {
        date: { type: Date },
        tempMin: { type: Number },
        tempMax: { type: Number },
        condition: { type: String },
        icon: { type: String },
        advisory: { type: String },
      },
    ],
    // Local transport configuration
    transportSegments: [{
      mode: { type: String, default: 'Rental Car' }, // Metro, Taxi, Rental Car, Walking, Bus, Flight
      provider: { type: String, default: '' },
      estimatedCost: { type: Number, default: 0 },
      departure: { type: String, default: '' },
      arrival: { type: String, default: '' },
      departureTime: { type: Date },
      arrivalTime: { type: Date },
      notes: { type: String, default: '' },
    }],
    // AI Recommendations & intelligence insights
    aiRecommendations: [
      {
        title: { type: String, required: true },
        category: {
          type: String,
          enum: ['flight', 'hotel', 'activity', 'food', 'route', 'budget', 'safety', 'packing'],
          default: 'activity',
        },
        description: { type: String, required: true },
        confidenceScore: { type: Number, default: 95 },
        suggestedDay: { type: Number },
        estimatedCost: { type: Number, default: 0 },
        isAdopted: { type: Boolean, default: false },
      },
    ],
    // Trip customization & style tags
    travelStyle: {
      type: String,
      enum: ['balanced', 'cultural', 'adventure', 'relaxation', 'luxury', 'foodie', 'budget-backpacker'],
      default: 'balanced',
    },
    interests: [{ type: String, trim: true }],
    preferences: [{ type: String, trim: true }],
    transportPreference: { type: String, default: '' },
    accommodationPreference: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: '' },
    // Conversational AI State
    conversation: [
      {
        sender: { type: String, enum: ['user', 'ai', 'system'] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
        context: { type: mongoose.Schema.Types.Mixed },
      }
    ],
    selectedOptions: { type: mongoose.Schema.Types.Mixed },
    constraints: [{ type: String }],
    optimizationHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String },
        changes: { type: mongoose.Schema.Types.Mixed },
      }
    ],
    // Road Trip Specific Model Data
    tripType: {
      type: String,
      enum: ['flight', 'road_trip', 'train', 'multi_modal'],
      default: 'flight',
    },
    isRoadTrip: {
      type: Boolean,
      default: false,
    },
    roadTripData: {
      originCity: { type: String, default: '' },
      destinationCity: { type: String, default: '' },
      totalDistanceKm: { type: Number, default: 0 },
      totalDrivingHours: { type: Number, default: 0 },
      suggestedDailyKm: { type: Number, default: 350 },
      fuelEstimateCost: { type: Number, default: 0 },
      tollEstimateCost: { type: Number, default: 0 },
      stops: [
        {
          name: { type: String },
          distanceKm: { type: Number },
          dayNumber: { type: Number },
          notes: { type: String },
          type: { type: String, enum: ['overnight', 'rest_stop', 'scenic', 'fuel'], default: 'scenic' },
          coordinates: {
            lat: { type: Number },
            lng: { type: Number },
          }
        }
      ]
    },
    // Bookings & Preparation
    bookingChecklist: [
      {
        item: { type: String },
        type: { type: String }, // flight, hotel, activity, insurance, visa
        status: { type: String, enum: ['pending', 'booked', 'not_needed'], default: 'pending' },
        reference: { type: String },
      }
    ],
    travelRequirements: {
      visa: { type: String },
      passportValidity: { type: String },
      vaccinations: [{ type: String }],
      insurance: { type: String },
      currencyAdvice: { type: String },
      adapters: { type: String },
    },
    packingList: [
      {
        category: { type: String },
        items: [
          {
            name: { type: String },
            packed: { type: Boolean, default: false },
          }
        ]
      }
    ],
    // Sharing & collaboration
    shareSettings: {
      isPublic: { type: Boolean, default: false },
      shareCode: { type: String, default: () => Math.random().toString(36).substring(2, 10).toUpperCase() },
      allowComments: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Virtual property for trip duration
TripSchema.virtual('calculatedDurationDays').get(function () {
  if (this.dates?.startDate && this.dates?.endDate) {
    const diffTime = Math.abs(new Date(this.dates.endDate) - new Date(this.dates.startDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  return this.dates?.durationDays || 1;
});

// Configure virtuals in toJSON
TripSchema.set('toJSON', { virtuals: true });
TripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trip', TripSchema);
