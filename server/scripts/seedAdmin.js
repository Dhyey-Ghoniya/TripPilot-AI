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

    let adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      adminUser.password = adminPassword;
      adminUser.role = 'ADMIN';
      adminUser.isActive = true;
      await adminUser.save();
      console.log(`[Seed] Success! Existing admin password updated for: ${adminEmail}`);
      process.exit(0);
    }

    adminUser = new User({
      firstName: 'TripPilot',
      lastName: 'Administrator',
      email: adminEmail,
      password: adminPassword,
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
