require('dotenv').config();
const mongoose = require('mongoose');
const tripService = require('../services/trip.service');
const itineraryService = require('../services/itinerary.service');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

async function runModule4Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 4 Automated Test Suite');
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

  try {
    // 1. CREATE TRIP & INITIAL ITINERARY
    console.log('1. Testing Trip & Itinerary Blueprint Creation...');
    const trip = await tripService.createTrip(dummyUserId, {
      title: '5-Day Dubai Workspace Blueprint',
      destination: { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates' },
      origin: { name: 'Ahmedabad', city: 'Ahmedabad' },
      dates: { durationDays: 5 },
      budget: { total: 80000, currency: 'INR' },
    });

    assert(Boolean(trip._id), 'Trip created successfully');
    assert(Boolean(trip.itineraryId), 'Initial itinerary attached to trip');

    // 2. OPEN TRIP (GET /api/trips/:id)
    console.log('\n2. Testing Open Trip Retrieval...');
    const retrievedTrip = await tripService.getTripById(trip._id, dummyUserId);
    assert(retrievedTrip.title === '5-Day Dubai Workspace Blueprint', 'Trip retrieved with correct title');
    assert(Boolean(retrievedTrip.itineraryId), 'Itinerary populated on trip retrieval');

    // 3. EDIT ITINERARY - ADD ACTIVITY
    console.log('\n3. Testing Add Activity to Itinerary...');
    const itin1 = await itineraryService.addActivity(trip.itineraryId, 1, {
      time: '10:00 AM',
      activity: 'Visit Burj Khalifa At The Top',
      location: 'Downtown Dubai',
      durationMinutes: 120,
      estimatedCost: 3500,
      category: 'Sightseeing',
    });

    const day1 = itin1.days.find((d) => d.dayNumber === 1);
    assert(day1.activities.length === 1, 'Activity added to Day 1');
    assert(day1.activities[0].activity === 'Visit Burj Khalifa At The Top', 'Activity title matches');
    const addedActivityId = day1.activities[0]._id;

    // Add second activity
    const itin2 = await itineraryService.addActivity(trip.itineraryId, 1, {
      time: '02:00 PM',
      activity: 'Explore Dubai Mall & Souk Al Bahar',
      location: 'Downtown Dubai',
      durationMinutes: 180,
      estimatedCost: 1500,
      category: 'Shopping',
    });
    assert(itin2.days.find((d) => d.dayNumber === 1).activities.length === 2, 'Second activity added to Day 1');

    // 4. EDIT ITINERARY - REORDER ACTIVITIES
    console.log('\n4. Testing Reorder Activities...');
    const day1Activities = itin2.days.find((d) => d.dayNumber === 1).activities;
    const reorderedIds = [day1Activities[1]._id.toString(), day1Activities[0]._id.toString()];
    const itinReordered = await itineraryService.reorderActivities(trip.itineraryId, 1, reorderedIds);
    assert(
      itinReordered.days.find((d) => d.dayNumber === 1).activities[0]._id.toString() === reorderedIds[0],
      'Activities successfully reordered'
    );

    // 5. EDIT ITINERARY - DELETE ACTIVITY
    console.log('\n5. Testing Delete Activity...');
    const itinAfterDelete = await itineraryService.deleteActivity(trip.itineraryId, 1, addedActivityId);
    assert(
      itinAfterDelete.days.find((d) => d.dayNumber === 1).activities.length === 1,
      'Activity deleted cleanly'
    );

    // 6. REGENERATE DAY
    console.log('\n6. Testing Regenerate Day via AI...');
    const itinRegenDay = await itineraryService.regenerateDay(trip.itineraryId, 1);
    assert(
      itinRegenDay.days.find((d) => d.dayNumber === 1).activities.length === 3,
      'Day 1 regenerated with fresh AI activity slots'
    );

    // 7. AI TRIP ASSISTANT COMMAND EXECUTION
    console.log('\n7. Testing AI Trip Assistant Commands...');

    // Command A: "Make Day 1 cheaper"
    const cmd1Res = await itineraryService.executeAiTripCommand(trip._id, 'Make Day 1 cheaper');
    assert(cmd1Res.actionSummary.includes('Reduced costs'), 'AI Command "Make Day 1 cheaper" executed');

    // Command B: "Add a beach"
    const cmd2Res = await itineraryService.executeAiTripCommand(trip._id, 'Add a beach');
    assert(cmd2Res.actionSummary.includes('beach'), 'AI Command "Add a beach" executed');

    // Command C: "Remove shopping"
    const cmd3Res = await itineraryService.executeAiTripCommand(trip._id, 'Remove shopping');
    assert(cmd3Res.actionSummary.includes('shopping'), 'AI Command "Remove shopping" executed');

    // Command D: "Make this day less rushed"
    const cmd4Res = await itineraryService.executeAiTripCommand(trip._id, 'Make this day less rushed');
    assert(cmd4Res.actionSummary.includes('relaxed'), 'AI Command "Make this day less rushed" executed');

    // 8. BUDGET UPDATE VERIFICATION
    console.log('\n8. Testing Budget Calculation & Update Verification...');
    const finalTrip = await Trip.findById(trip._id);
    assert(Boolean(finalTrip.budget.total), 'Budget total persisted');
    assert(finalTrip.budget.total === 80000, 'Total budget matches 80000');

    // 9. CLEANUP DELETION
    console.log('\n9. Testing Trip Deletion & Workspace Cleanup...');
    await tripService.deleteTrip(trip._id, dummyUserId);
    const checkTrip = await Trip.findById(trip._id);
    const checkItin = await Itinerary.findById(trip.itineraryId);
    assert(!checkTrip, 'Trip record deleted');
    assert(!checkItin, 'Associated itinerary deleted');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 4 test run:', err);
    failedCount++;
  } finally {
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

runModule4Tests();
