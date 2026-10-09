require('dotenv').config();
const mongoose = require('mongoose');
const tripService = require('../services/trip.service');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Expense = require('../models/Expense');

async function runModule13Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 13 Automated Test Suite');
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
  let duplicatedTripId = null;

  try {
    // 1. CREATE INITIAL TRIP BLUEPRINT
    console.log('1. Testing Trip Creation & Initial Blueprint...');

    const trip = await tripService.createTrip(dummyUserId, {
      title: 'Module 13 Management Trip - Paris',
      destination: { name: 'Paris', city: 'Paris', country: 'France' },
      dates: { durationDays: 5 },
      budget: { total: 120000, currency: 'INR' },
      travelStyle: 'cultural',
      tags: ['Culture', 'Museums', 'Gastronomy'],
    });
    createdTripId = trip._id;
    assert(trip.status === 'planning', 'Trip created with planning/draft status');
    assert(Boolean(trip.itineraryId), 'Auto-generated initial itinerary shell linked');

    // 2. MY TRIPS TAB CATEGORIZATION
    console.log('\n2. Testing My Trips Tab Categorization (Upcoming, Drafts, Saved, Completed, Archived)...');

    const draftsRes = await tripService.getUserTrips(dummyUserId, { tab: 'drafts' });
    assert(draftsRes.trips.length >= 1, 'Tab "Drafts" correctly retrieves planning/draft trips');

    // 3. TRIP ACTIONS (DUPLICATE, ARCHIVE, SHARE, EXPORT)
    console.log('\n3. Testing Trip Actions (Duplicate, Archive, Share, Export)...');

    // Action A: 1-Click Clone / Duplicate Trip
    const clonedTrip = await tripService.duplicateTrip(createdTripId, dummyUserId);
    duplicatedTripId = clonedTrip._id;
    assert(clonedTrip.title.includes('Copy of'), 'Cloned trip titled with "Copy of [Title]" prefix');
    assert(clonedTrip.status === 'draft', 'Cloned trip starts as fresh draft');
    assert(Boolean(clonedTrip.itineraryId), 'Cloned trip contains cloned itinerary object');

    // Action B: Archive / Unarchive
    const archiveRes = await tripService.archiveTrip(createdTripId, dummyUserId);
    assert(archiveRes.trip.status === 'archived', 'Archived trip status updated to "archived"');

    const restoreRes = await tripService.archiveTrip(createdTripId, dummyUserId);
    assert(restoreRes.trip.status === 'planning', 'Restored trip status toggled back');

    // Action C: Share & Privacy Check
    trip.shareSettings.isPublic = true;
    await trip.save();

    const sharedTrip = await tripService.getSharedTrip(trip.shareSettings.shareCode);
    assert(sharedTrip.isReadOnly === true, 'Shared trip returns read-only flag for non-owners');
    assert(sharedTrip.userId === undefined, 'Privacy enforcement: Owner user ID stripped from shared payload');

    // Action D: Export Trip Data
    const exportData = await tripService.exportTrip(createdTripId, dummyUserId);
    assert(Boolean(exportData.exportTimestamp), 'Export data package generated');
    assert(Array.isArray(exportData.itineraryDays), 'Export package includes day-by-day itinerary');

    // 4. COMPLETED TRIPS & TRAVEL HISTORY ANALYTICS
    console.log('\n4. Testing Completed Trips & Travel Analytics...');

    // Add actual expense for trip
    const exp = new Expense({
      tripId: createdTripId,
      userId: dummyUserId,
      title: 'Louvre Entrance & Guided Tour',
      amount: 4500,
      category: 'Activities',
      costType: 'actual',
    });
    await exp.save();

    const completeRes = await tripService.markCompleted(createdTripId, dummyUserId);
    assert(completeRes.trip.status === 'completed', 'Marked trip as completed');

    const analytics = await tripService.getCompletedTripsAnalytics(dummyUserId);
    assert(analytics.travelHistory.totalCompletedTrips >= 1, 'Completed trip added to Travel History analytics');
    assert(analytics.travelHistory.countriesList.includes('France'), 'Travel History tracks visited countries ("France")');
    assert(analytics.expenseAnalysis.categorySpendTotals.Activities === 4500, 'Expense Analysis tracks category actual spend');
    assert(Array.isArray(analytics.futurePersonalization.topPreferredTags), 'Personalization profile extracts top preferred tags for future recommendations');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 13 test run:', err);
    failedCount++;
  } finally {
    if (createdTripId) {
      await Expense.deleteMany({ tripId: createdTripId });
      const t1 = await Trip.findById(createdTripId);
      if (t1?.itineraryId) await Itinerary.findByIdAndDelete(t1.itineraryId);
      await Trip.findByIdAndDelete(createdTripId);
    }
    if (duplicatedTripId) {
      const t2 = await Trip.findById(duplicatedTripId);
      if (t2?.itineraryId) await Itinerary.findByIdAndDelete(t2.itineraryId);
      await Trip.findByIdAndDelete(duplicatedTripId);
    }
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

runModule13Tests();
