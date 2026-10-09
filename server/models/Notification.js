const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, enum: ['info', 'alert', 'trip', 'recommendation'], default: 'info' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
