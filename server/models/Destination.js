const mongoose = require('mongoose');

const CATEGORIES_ENUM = [
  'Beach',
  'Mountains',
  'Nature',
  'Adventure',
  'Historical',
  'Cultural',
  'Wildlife',
  'Religious',
  'Food',
  'Luxury',
  'Family',
  'Romantic',
  'Photography',
  'Shopping',
  'Relaxation',
];

const EstimatedBudgetSchema = new mongoose.Schema(
  {
    minPerDay: { type: Number, required: true },
    maxPerDay: { type: Number, required: true },
    accommodation: {
      min: { type: Number, default: 1000 },
      max: { type: Number, default: 3000 },
    },
    food: {
      min: { type: Number, default: 500 },
      max: { type: Number, default: 1200 },
    },
    localTransport: {
      min: { type: Number, default: 300 },
      max: { type: Number, default: 800 },
    },
    activities: {
      min: { type: Number, default: 300 },
      max: { type: Number, default: 1000 },
    },
  },
  { _id: false }
);

const BestTimeToVisitSchema = new mongoose.Schema(
  {
    months: [{ type: String }],
    season: { type: String, default: 'Winter' },
    description: { type: String, default: 'Pleasant weather for travel.' },
  },
  { _id: false }
);

const AverageDurationSchema = new mongoose.Schema(
  {
    minDays: { type: Number, default: 2 },
    maxDays: { type: Number, default: 5 },
  },
  { _id: false }
);

const DestinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    country: { type: String, required: true, default: 'India', trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    images: [{ type: String }],
    coverImage: { type: String, required: true },
    categories: [{ type: String, enum: CATEGORIES_ENUM }],
    tags: [{ type: String }],
    estimatedBudget: { type: EstimatedBudgetSchema, required: true },
    currency: { type: String, default: 'INR' },
    bestTimeToVisit: { type: BestTimeToVisitSchema, default: () => ({}) },
    averageDuration: { type: AverageDurationSchema, default: () => ({ minDays: 3, maxDays: 5 }) },
    popularityScore: { type: Number, default: 80 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    latitude: { type: Number },
    longitude: { type: Number },
    climate: { type: String, default: 'Tropical / Moderate' },
    languages: [{ type: String }],
    localTransport: { type: String, default: 'Taxis, buses, auto-rickshaws, and rentals available.' },
    safetyInformation: { type: String, default: 'Standard travel precautions apply. Keep emergency contacts handy.' },
    travelTips: [{ type: String }],
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Helper function to generate slug from name
DestinationSchema.statics.generateSlug = function (name) {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

module.exports = mongoose.model('Destination', DestinationSchema);
module.exports.CATEGORIES_ENUM = CATEGORIES_ENUM;
