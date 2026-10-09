require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trippilot';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@trippilot.ai').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass@123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`[Seed] Admin user already exists: ${adminEmail}`);
      process.exit(0);
    }

    const adminUser = new User({
      firstName: 'TripPilot',
      lastName: 'Administrator',
      email: adminEmail,
      password: adminPassword, // Pre-save hook will hash
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      travelPreferences: {},
    });

    await adminUser.save();
    console.log(`[Seed] Success! Admin user created with email: ${adminEmail}`);
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedAdmin();
