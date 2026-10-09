const mongoose = require('mongoose');
const { ATTRACTION_CATEGORIES, ATTRACTION_TYPES } = require('../constants/attractionConstants');

const OpeningHourDaySchema = new mongoose.Schema(
  {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '18:00' },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const OpeningHoursSchema = new mongoose.Schema(
  {
    monday: { type: OpeningHourDaySchema, default: () => ({ open: '09:00', close: '18:00', closed: false }) },
    tuesday: { type: OpeningHourDaySchema, default: () => ({ open: '09:00', close: '18:00', closed: false }) },
    wednesday: { type: OpeningHourDaySchema, default: () => ({ open: '09:00', close: '18:00', closed: false }) },
    thursday: { type: OpeningHourDaySchema, default: () => ({ open: '09:00', close: '18:00', closed: false }) },
    friday: { type: OpeningHourDaySchema, default: () => ({ open: '09:00', close: '18:00', closed: false }) },
    saturday: { type: OpeningHourDaySchema, default: () => ({ open: '09:00', close: '18:00', closed: false }) },
    sunday: { type: OpeningHourDaySchema, default: () => ({ open: '09:00', close: '18:00', closed: false }) },
    notes: { type: String, default: 'Open all days unless specified.' },
  },
  { _id: false }
);

const TicketPriceSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    adult: { type: Number, default: 0, min: 0 },
    child: { type: Number, default: 0, min: 0 },
    foreignVisitor: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: false },
  },
  { _id: false }
);

const EstimatedVisitDurationSchema = new mongoose.Schema(
  {
    minMinutes: { type: Number, default: 60, min: 15 },
    maxMinutes: { type: Number, default: 180, min: 15 },
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true },
    area: { type: String, trim: true },
  },
  { _id: false }
);

const BestTimeToVisitSchema = new mongoose.Schema(
  {
    months: [{ type: String }],
    season: { type: String, default: 'All Season' },
    description: { type: String, default: 'Pleasant weather recommended for outdoor visits.' },
  },
  { _id: false }
);

const ContactSchema = new mongoose.Schema(
  {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  { _id: false }
);

const AttractionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
      index: true,
    },
    shortDescription: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ATTRACTION_CATEGORIES,
      index: true,
    },
    type: {
      type: String,
      default: 'Tourist Attraction',
      enum: ATTRACTION_TYPES,
      index: true,
    },
    tags: [{ type: String }],
    images: [{ type: String }],
    coverImage: { type: String, required: true },
    location: { type: LocationSchema, default: () => ({}) },
    openingHours: { type: OpeningHoursSchema, default: () => ({}) },
    ticketPrice: { type: TicketPriceSchema, default: () => ({ amount: 0, isFree: true }) },
    estimatedVisitDuration: { type: EstimatedVisitDurationSchema, default: () => ({ minMinutes: 60, maxMinutes: 180 }) },
    bestTimeToVisit: { type: BestTimeToVisitSchema, default: () => ({}) },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 80 },
    facilities: [{ type: String }],
    accessibility: { type: String, default: 'Wheelchair Accessible' },
    safetyInformation: { type: String, default: 'Follow safety guidelines and respect local regulations.' },
    travelTips: [{ type: String }],
    contact: { type: ContactSchema, default: () => ({}) },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
AttractionSchema.index({ name: 'text', description: 'text', tags: 'text' });
AttractionSchema.index({ destination: 1, isActive: 1 });
AttractionSchema.index({ category: 1, isActive: 1 });

// Static method to generate slug
AttractionSchema.statics.generateSlug = function (name) {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

module.exports = mongoose.model('Attraction', AttractionSchema);
