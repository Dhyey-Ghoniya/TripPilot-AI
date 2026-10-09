require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const authService = require('../services/auth.service');
const userPreferenceService = require('../services/userPreference.service');
const { verifyToken } = require('../utils/jwt');

async function runModule2Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 2 Automated Test Suite');
  console.log('----------------------------------------------------\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippilot';
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB database:', mongoUri);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failedCount++;
    }
  }

  const testEmail = `test.user.${Date.now()}@trippilot.ai`;
  const initialPassword = 'SecurePassword@123';
  const newPassword = 'NewSecretPass#2026';
  let createdUserId = null;
  let authToken = null;

  try {
    // 1. REGISTRATION
    console.log('\n1. Testing User Registration...');
    const regResult = await authService.register({
      name: 'Test Traveler',
      email: testEmail,
      password: initialPassword,
      phone: '+1 555-0199',
      role: 'ADMIN', // Attempting self-register as ADMIN
    });

    assert(Boolean(regResult.user), 'User object returned on registration');
    assert(Boolean(regResult.token), 'JWT token returned on registration');
    assert(regResult.user.role === 'USER', 'Security check: Self-registration as ADMIN forced role to USER');
    assert(regResult.user.email === testEmail, 'Email matches registered input');
    assert(!regResult.user.password, 'Password hash omitted from returned safe user object');
    createdUserId = regResult.user._id || regResult.user.id;
    authToken = regResult.token;

    // 2. DUPLICATE EMAIL
    console.log('\n2. Testing Duplicate Email Registration...');
    try {
      await authService.register({
        name: 'Duplicate Traveler',
        email: testEmail,
        password: initialPassword,
      });
      assert(false, 'Duplicate registration should have thrown an error');
    } catch (err) {
      assert(err.statusCode === 409, 'Duplicate email throws 409 Conflict error');
    }

    // 3. LOGIN - SUCCESS
    console.log('\n3. Testing Valid User Login...');
    const loginResult = await authService.login({
      email: testEmail,
      password: initialPassword,
    });
    assert(Boolean(loginResult.user), 'Login returns user object');
    assert(Boolean(loginResult.token), 'Login returns JWT token');

    // 4. LOGIN - INVALID PASSWORD
    console.log('\n4. Testing Invalid Password Login...');
    try {
      await authService.login({
        email: testEmail,
        password: 'WrongPassword!999',
      });
      assert(false, 'Invalid password should have thrown an error');
    } catch (err) {
      assert(err.statusCode === 401, 'Invalid password returns 401 Unauthorized');
    }

    // 5. SESSION PERSISTENCE & ME ROUTE
    console.log('\n5. Testing Session Persistence (Current User Retrieval)...');
    const meResult = await authService.getCurrentUser(createdUserId);
    assert(meResult.email === testEmail, 'Current user correctly retrieved from session');

    const decoded = verifyToken(authToken);
    assert(decoded.userId.toString() === createdUserId.toString(), 'JWT token successfully verified');

    // 6. PROFILE UPDATE
    console.log('\n6. Testing Profile Update...');
    const updatedProfile = await authService.updateProfile(createdUserId, {
      name: 'Updated Traveler Name',
      phone: '+1 999-888-7777',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    });
    assert(updatedProfile.name === 'Updated Traveler Name', 'Full name updated successfully');
    assert(updatedProfile.phone === '+1 999-888-7777', 'Phone number updated successfully');
    assert(Boolean(updatedProfile.avatar), 'Avatar updated successfully');

    // 7. PASSWORD CHANGE
    console.log('\n7. Testing Password Change...');
    const passResult = await authService.changePassword(
      createdUserId,
      initialPassword,
      newPassword,
      newPassword
    );
    assert(passResult.message === 'Password changed successfully', 'Password changed successfully');

    // Verify login with new password
    const newLoginResult = await authService.login({
      email: testEmail,
      password: newPassword,
    });
    assert(Boolean(newLoginResult.token), 'Login succeeded with new password');

    // 8. TRAVEL PREFERENCES & UserPreferenceService OVERRIDES
    console.log('\n8. Testing UserPreferenceService & AI Preferences Overrides...');
    const defaultPrefs = await userPreferenceService.updateTravelPreferences(createdUserId, {
      budgetRange: 'Moderate',
      travelStyle: 'Relaxed',
      preferredTransport: ['Flight', 'Train'],
      accommodationPreference: ['Boutique'],
      interests: ['Beach', 'Food'],
      foodPreferences: ['Vegetarian'],
      preferredActivities: ['Sightseeing'],
    });

    assert(defaultPrefs.budgetRange === 'Moderate', 'Base preference saved');
    assert(defaultPrefs.interests.includes('Beach'), 'Interests saved');

    // Test trip-specific override resolution
    const mergedPrefs = await userPreferenceService.getUserTravelPreferences(createdUserId, {
      budgetRange: 'Luxury', // Trip override
      interests: ['Historical', 'Museums'], // Trip override
    });

    assert(mergedPrefs.budgetRange === 'Luxury', 'Trip override successfully replaced default budgetRange');
    assert(mergedPrefs.interests.includes('Historical'), 'Trip override replaced default interests');
    assert(mergedPrefs.travelStyle === 'Relaxed', 'Unmodified preference inherited from base user preferences');

  } catch (err) {
    console.error('⚠️ Unexpected error during test run:', err);
    failedCount++;
  } finally {
    // Cleanup test user
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
      console.log('\n🧹 Cleaned up test user records from database.');
    }
    await mongoose.disconnect();
    console.log('✅ Disconnected from database.');

    console.log('\n----------------------------------------------------');
    console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('----------------------------------------------------');

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runModule2Tests();
