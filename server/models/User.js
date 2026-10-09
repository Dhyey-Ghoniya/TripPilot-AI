const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TravelPreferencesSchema = new mongoose.Schema(
  {
    budgetRange: {
      type: String,
      enum: ['Budget', 'Moderate', 'Luxury'],
      default: 'Moderate',
    },
    travelStyle: {
      type: String,
      enum: ['Relaxed', 'Moderate', 'Fast-Paced', 'Adventurous', 'Cultural', 'Luxury'],
      default: 'Moderate',
    },
    preferredTransport: [{ type: String }], // e.g. Flight, Train, Car, Public
    accommodationPreference: [{ type: String }], // e.g. Hotel, Resort, Homestay, Hostel, Boutique
    accommodationType: [{ type: String }], // Backwards compatibility alias
    interests: [{ type: String }], // e.g. Adventure, Nature, Beach, Food, Historical, Cultural, etc.
    foodPreferences: [{ type: String }], // e.g. Vegetarian, Non-Vegetarian, Vegan, Halal, Seafood, Local
    preferredActivities: [{ type: String }], // e.g. Sightseeing, Hiking, Museums, Beach, Dining
    preferredTravelTypes: [{ type: String }], // e.g. Solo, Couple, Family, Friends
    preferredTripDuration: { type: String, default: '3-5 Days' },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, default: '' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    travelPreferences: {
      type: TravelPreferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// Virtual getter for name
UserSchema.virtual('fullName').get(function () {
  return (this.name || `${this.firstName || ''} ${this.lastName || ''}`).trim();
});

// Virtual getter for passwordHash alias
UserSchema.virtual('passwordHash').get(function () {
  return this.password;
});

// Pre-save hook to ensure name, avatar, and password hash are synchronized
UserSchema.pre('save', async function (next) {
  // Sync name
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  } else if (this.name && (!this.firstName || !this.lastName)) {
    const parts = this.name.trim().split(' ');
    this.firstName = parts[0] || 'User';
    this.lastName = parts.slice(1).join(' ') || parts[0] || 'User';
  }

  // Sync avatar and profileImage
  if (this.profileImage && !this.avatar) {
    this.avatar = this.profileImage;
  } else if (this.avatar && !this.profileImage) {
    this.profileImage = this.avatar;
  }

  // Hash password before saving if modified
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to return safe sanitized user object
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  obj.name = obj.name || `${obj.firstName || ''} ${obj.lastName || ''}`.trim();
  obj.avatar = obj.avatar || obj.profileImage || '';
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);

