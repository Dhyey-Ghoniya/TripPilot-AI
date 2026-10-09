const mongoose = require('mongoose');

const FeatureFlagsSchema = new mongoose.Schema(
  {
    enableAiPlanner: { type: Boolean, default: true },
    enableFlightSearch: { type: Boolean, default: true },
    enableHotelSearch: { type: Boolean, default: true },
    enableRealTimeWeather: { type: Boolean, default: true },
    enableMapNavigation: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    allowUserRegistrations: { type: Boolean, default: true },
  },
  { _id: false }
);

const SystemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'main_config',
      unique: true,
    },
    platformName: {
      type: String,
      default: 'TripPilot AI',
    },
    tagline: {
      type: String,
      default: 'Your Intelligent AI Travel Companion & Itinerary Generator',
    },
    supportEmail: {
      type: String,
      default: 'support@trippilot.ai',
    },
    defaultCurrency: {
      type: String,
      default: 'INR',
    },
    rateLimitMax: {
      type: Number,
      default: 100,
    },
    rateLimitWindowMs: {
      type: Number,
      default: 900000, // 15 mins
    },
    providerFallbackEnabled: {
      type: Boolean,
      default: true,
    },
    systemNotice: {
      type: String,
      default: 'System operational. All AI models & provider adapters active.',
    },
    featureFlags: {
      type: FeatureFlagsSchema,
      default: () => ({}),
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
