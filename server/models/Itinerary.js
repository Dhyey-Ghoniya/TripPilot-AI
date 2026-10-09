const mongoose = require('mongoose');

const ItineraryActivitySchema = new mongoose.Schema(
  {
    time: { type: String }, // e.g. "09:00 AM" or "Morning"
    timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], default: 'morning' },
    activity: { type: String, required: true },
    location: { type: String, default: '' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    durationMinutes: { type: Number, default: 90 },
    estimatedCost: { type: Number, default: 0 },
    transportModeToNext: { type: String, default: 'Walking' }, // Taxi, Walking, Metro, Bus
    transportDurationMinutes: { type: Number, default: 15 },
    notes: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  },
  { _id: true }
);

const ItineraryDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  date: { type: Date },
  title: { type: String, default: '' },
  theme: { type: String, default: 'Exploration & Culture' }, // e.g., "Historic Quarter", "Beach Day", "Mountain Trek"
  summary: { type: String, default: '' },
  activities: [ItineraryActivitySchema],
  meals: {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
  },
  dayNotes: { type: String, default: '' },
  estimatedDayCost: { type: Number, default: 0 },
});

const ItinerarySchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    title: { type: String, default: 'Generated Itinerary' },
    days: [ItineraryDaySchema],
    totalEstimatedCost: { type: Number, default: 0 },
    isAiGenerated: { type: Boolean, default: false },
    aiModelUsed: { type: String, default: 'TripPilot Engine v1' },
    optimizationGoal: {
      type: String,
      enum: ['balanced', 'budget_saving', 'relaxed_pace', 'maximum_sights'],
      default: 'balanced',
    },
    weatherChecked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Itinerary', ItinerarySchema);
