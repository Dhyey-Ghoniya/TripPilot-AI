const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Flights',
        'Hotels',
        'Food',
        'Activities',
        'Transport',
        'Shopping',
        'Miscellaneous',
      ],
      default: 'Miscellaneous',
      index: true,
    },
    // Estimated = AI/system generated, Confirmed = provider-sourced, Actual = user-entered real spend
    costType: {
      type: String,
      enum: ['estimated', 'confirmed', 'actual'],
      default: 'actual',
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dayNumber: {
      type: Number,
      default: null,
    },
    paidBy: {
      type: String,
      default: 'Self',
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'other'],
      default: 'cash',
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    tags: [{ type: String, trim: true }],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    // Links expense to a specific itinerary activity
    linkedActivityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Whether this expense is included in budget totals
    isIncludedInBudget: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for trip-level queries
ExpenseSchema.index({ tripId: 1, category: 1, costType: 1 });
ExpenseSchema.index({ tripId: 1, date: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);
