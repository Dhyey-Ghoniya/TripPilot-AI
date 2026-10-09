const mongoose = require('mongoose');

const PlaceVisitedSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Sightseeing' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    notes: { type: String, default: '' },
    location: { type: String, default: '' },
  },
  { _id: true }
);

const TravelJournalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    notes: { type: String, default: '' },
    memories: [{ type: String }],
    photos: [{ type: String }],
    placesVisited: [PlaceVisitedSchema],
    ratings: {
      overall: { type: Number, min: 1, max: 5, default: 5 },
      accommodation: { type: Number, min: 1, max: 5, default: 5 },
      activities: { type: Number, min: 1, max: 5, default: 5 },
      transport: { type: Number, min: 1, max: 5, default: 5 },
      food: { type: Number, min: 1, max: 5, default: 5 },
    },
    highlights: [{ type: String }],
    location: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TravelJournal', TravelJournalSchema);
