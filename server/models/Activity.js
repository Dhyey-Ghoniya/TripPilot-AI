const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    destinationName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
    },
    category: {
      type: String,
      enum: [
        'Sightseeing',
        'Adventure',
        'Food',
        'Shopping',
        'Nature',
        'Culture',
        'Nightlife',
        'Museums',
        'Beaches',
        'Wildlife',
        'Photography',
        'Religious',
        'Entertainment',
        'Local Experiences',
      ],
      default: 'Sightseeing',
      index: true,
    },
    shortDescription: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    },
    images: [{ type: String }],
    durationMinutes: {
      type: Number,
      default: 120, // 2 hours
      min: 15,
    },
    price: {
      amount: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR' },
      isFree: { type: Boolean, default: false },
    },
    rating: {
      type: Number,
      default: 4.6,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    location: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    openingHours: {
      open: { type: String, default: '09:00 AM' },
      close: { type: String, default: '06:00 PM' },
      daysOpen: [{ type: String }],
    },
    source: {
      type: String,
      default: 'TripPilot Engine',
    },
    bestTimeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'sunset', 'evening', 'night', 'anytime'],
      default: 'morning',
    },
    isIndoor: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String, trim: true }],
    bookingRequired: {
      type: Boolean,
      default: false,
    },
    bookingUrl: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual sync for title & name
ActivitySchema.pre('save', function (next) {
  if (this.name && !this.title) this.title = this.name;
  if (this.title && !this.name) this.name = this.title;
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Activity', ActivitySchema);
