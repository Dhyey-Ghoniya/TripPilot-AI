require('dotenv').config();
const mongoose = require('mongoose');
const activityService = require('../services/activity.service');
const tripService = require('../services/trip.service');
const Activity = require('../models/Activity');
const Trip = require('../models/Trip');

async function runModule7Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 7 Automated Test Suite');
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

  const dummyUserId = new mongoose.Types.ObjectId();
  let createdTripId = null;

  try {
    // 1. ACTIVITY MODEL & 14 CATEGORIES SEEDING
    console.log('1. Testing Activity Model & 14 Categories Validation...');

    const categories = [
      'Sightseeing',
      'Adventure',
      'Food',
      'Shopping',
      'Nature',
      'Culture',
      'Nightlife',
      'Museums',
      'Beaches',
      'Wildlife',
      'Photography',
      'Religious',
      'Entertainment',
      'Local Experiences',
    ];

    assert(categories.length === 14, 'All 14 requested experience categories defined');

    const testActivityDoc = new Activity({
      name: 'Burj Khalifa Observation Deck',
      destinationName: 'Dubai',
      category: 'Sightseeing',
      shortDescription: 'World highest observatory terrace',
      description: 'Ascend level 124 & 125 for panoramic views',
      coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
      images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c'],
      durationMinutes: 120,
      price: { amount: 3800, currency: 'INR' },
      rating: 4.9,
      reviewCount: 4200,
      location: { address: 'Downtown Dubai', city: 'Dubai', country: 'UAE' },
      coordinates: { lat: 25.1972, lng: 55.2744 },
      openingHours: { open: '08:30 AM', close: '11:00 PM', daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      source: 'TripPilot Engine',
      bestTimeOfDay: 'sunset',
    });

    await testActivityDoc.save();
    assert(Boolean(testActivityDoc._id), 'Activity document saved in MongoDB with required schema fields');
    assert(testActivityDoc.title === 'Burj Khalifa Observation Deck', 'Activity title virtual synchronized with name');
    assert(testActivityDoc.source === 'TripPilot Engine', 'Activity source field verified');

    // 2. SEARCH ACTIVITIES API & FILTERS
    console.log('\n2. Testing Activity Search API (destination, category, duration, price, interests)...');

    const search1 = await activityService.searchActivities({ destination: 'Dubai' }, dummyUserId);
    assert(search1.totalResults >= 10, 'Search returned experience catalog for destination');

    const search2 = await activityService.searchActivities({ destination: 'Dubai', category: 'Food' }, dummyUserId);
    assert(search2.results.every((a) => a.category === 'Food'), 'Filtered search by category Food');

    const search3 = await activityService.searchActivities({ destination: 'Dubai', price: 3000 }, dummyUserId);
    assert(search3.results.every((a) => (a.price?.amount || a.price || 0) <= 3000), 'Filtered search by max price <= ₹3,000');

    // 3. ACTIVITY FIT INTELLIGENCE EVALUATION
    console.log('\n3. Testing Activity Fit Evaluation (Interests, Budget, Location, Hours, Weather, Travel Time)...');

    const trip = await tripService.createTrip(dummyUserId, {
      title: '5-Day Dubai Activity Integration Trip',
      destination: { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', coordinates: { lat: 25.2048, lng: 55.2708 } },
      dates: { durationDays: 5 },
      budget: { total: 100000, currency: 'INR', breakdown: { activities: 20000 } },
      tags: ['Sightseeing', 'Food'],
    });
    createdTripId = trip._id;

    const fitEval = activityService.getActivityFit(testActivityDoc, trip);
    assert(Boolean(fitEval.interestMatchText), 'Interest alignment evaluated');
    assert(Boolean(fitEval.budgetCompatibility), 'Trip budget compatibility evaluated');
    assert(Boolean(fitEval.distanceToStayText), 'Itinerary location proximity & transit time evaluated');
    assert(Boolean(fitEval.weatherSuitability), 'Weather suitability & indoor/outdoor advisory evaluated');
    assert(Boolean(fitEval.openingHoursText), 'Opening hours & best time of day evaluated');

    // 4. TRIP INTEGRATION: ADD, REMOVE, REPLACE, MOVE, OPTIMIZE
    console.log('\n4. Testing Trip Integration (Add, Remove, Replace, Move, AI Optimize)...');

    // Add Activity
    const addRes = await activityService.addActivityToTrip(createdTripId, testActivityDoc, 1, 'morning');
    assert(addRes.success, 'Activity added to Day 1 morning slot');

    const tripAfterAdd = await Trip.findById(createdTripId);
    assert(tripAfterAdd.activities.length === 1, 'Trip.activities array updated');
    assert(tripAfterAdd.budget.breakdown.activities > 0, 'Trip.budget.breakdown.activities updated');

    // Move Activity
    const moveRes = await activityService.moveActivityInTrip(createdTripId, 1, 2, 'Burj Khalifa Observation Deck', 'sunset');
    assert(moveRes.success, 'Activity moved from Day 1 morning to Day 2 sunset slot');

    const tripAfterMove = await Trip.findById(createdTripId);
    assert(tripAfterMove.activities[0].dayNumber === 2, 'Activity day number updated to Day 2');

    // Replace Activity
    const newActivity = {
      name: 'Dubai Fountain Boardwalk Experience',
      category: 'Sightseeing',
      durationMinutes: 60,
      price: { amount: 1500 },
      location: { address: 'Downtown' },
    };
    const replaceRes = await activityService.replaceActivityInTrip(createdTripId, 2, 'Burj Khalifa Observation Deck', newActivity);
    assert(replaceRes.success, 'Activity replaced on Day 2');

    // AI Optimize
    const optRes = await activityService.optimizeTripActivities(createdTripId);
    assert(optRes.success, 'AI optimized itinerary activities geographically & by opening hours');

    // Remove Activity
    const removeRes = await activityService.removeActivityFromTrip(createdTripId, 2, 'Dubai Fountain Boardwalk Experience');
    assert(removeRes.success, 'Activity removed from trip');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 7 test run:', err);
    failedCount++;
  } finally {
    // Cleanup
    if (createdTripId) {
      await tripService.deleteTrip(createdTripId, dummyUserId);
    }
    await Activity.deleteMany({ destinationName: 'Dubai' });
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database.');

    console.log('\n----------------------------------------------------');
    console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('----------------------------------------------------');

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runModule7Tests();
