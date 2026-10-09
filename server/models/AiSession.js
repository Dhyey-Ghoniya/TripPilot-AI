const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: true }
);

const AiSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messages: [MessageSchema],
    extractedParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    draftRequirements: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastAskedField: {
      type: String,
      default: null,
    },
    missingFields: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiSession', AiSessionSchema);
