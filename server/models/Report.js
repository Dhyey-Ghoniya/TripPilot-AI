const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      required: true,
      enum: ['Review', 'Journal', 'Activity', 'Trip', 'Destination', 'Comment', 'User'],
      index: true,
    },
    contentId: {
      type: String,
      required: true,
      index: true,
    },
    contentTitle: {
      type: String,
      default: 'Untitled Content',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterEmail: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'Spam or Misleading',
        'Inappropriate Content',
        'Misinformation',
        'Hate Speech or Harassment',
        'Copyright Violation',
        'Other',
      ],
      default: 'Inappropriate Content',
    },
    details: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    actionTaken: {
      type: String,
      enum: ['NONE', 'CONTENT_REMOVED', 'USER_WARNED', 'USER_BANNED', 'DISMISSED'],
      default: 'NONE',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
