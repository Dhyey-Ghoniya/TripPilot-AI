require('dotenv').config();
const mongoose = require('mongoose');
const aiTools = require('../services/aiTools.service');
const travelOrchestrator = require('../services/travelOrchestrator.service');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Expense = require('../models/Expense');

async function runModule11Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 11 Automated Test Suite');
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
    // 1. AI TOOLKIT VERIFICATION (ALL 13 FUNCTIONS)
    console.log('1. Testing AI Toolkit (13 Core Functions)...');

    const destRes = await aiTools.searchDestination('Dubai');
    assert(destRes.success && destRes.tool === 'searchDestination', 'searchDestination() executed');
    assert(destRes.source === 'INTERNAL', 'searchDestination source tagged as INTERNAL');

    const flightRes = await aiTools.searchFlights({ originAirport: 'AMD', destinationAirport: 'DXB' });
    assert(flightRes.success && flightRes.tool === 'searchFlights', 'searchFlights() executed');
    assert(flightRes.source === 'PROVIDER', 'searchFlights source tagged as PROVIDER');

    const hotelRes = await aiTools.searchHotels({ destination: 'Dubai' });
    assert(hotelRes.success && hotelRes.tool === 'searchHotels', 'searchHotels() executed');
    assert(hotelRes.source === 'PROVIDER', 'searchHotels source tagged as PROVIDER');

    const actRes = await aiTools.searchActivities({ destination: 'Dubai' });
    assert(actRes.success && actRes.tool === 'searchActivities', 'searchActivities() executed');

    const weatherRes = await aiTools.getWeather('Dubai', 5);
    assert(weatherRes.success && weatherRes.tool === 'getWeather', 'getWeather() executed');
    assert(weatherRes.source === 'PROVIDER', 'getWeather source tagged as PROVIDER');

    const routeRes = await aiTools.calculateRoute('Ahmedabad', 'Dubai');
    assert(routeRes.success && routeRes.tool === 'calculateRoute', 'calculateRoute() executed');
    assert(routeRes.source === 'API', 'calculateRoute source tagged as API');

    const budgetRes = await aiTools.estimateBudget({ destinationContext: destRes.data, durationDays: 5 });
    assert(budgetRes.success && budgetRes.tool === 'estimateBudget', 'estimateBudget() executed');
    assert(budgetRes.source === 'AI_ESTIMATE', 'estimateBudget source tagged as AI_ESTIMATE');

    const savedTripRes = await aiTools.saveTrip(dummyUserId, {
      destinationContext: destRes.data,
      origin: 'Ahmedabad',
      durationDays: 5,
      budget: budgetRes.data,
    });
    createdTripId = savedTripRes.data._id;
    assert(savedTripRes.success && savedTripRes.tool === 'saveTrip', 'saveTrip() executed');
    assert(savedTripRes.source === 'INTERNAL', 'saveTrip source tagged as INTERNAL');

    const itineraryRes = await aiTools.createItinerary(createdTripId, destRes.data, 5);
    const createdItineraryId = itineraryRes.data._id;
    assert(itineraryRes.success && itineraryRes.tool === 'createItinerary', 'createItinerary() executed');
    assert(itineraryRes.source === 'AI_ESTIMATE', 'createItinerary source tagged as AI_ESTIMATE');

    const updateItinRes = await aiTools.updateItinerary(createdItineraryId, { title: 'Updated Title' });
    assert(updateItinRes.success && updateItinRes.data.title === 'Updated Title', 'updateItinerary() executed');

    const addActRes = await aiTools.addActivity(createdItineraryId, 1, { title: 'Dhow Dinner Cruise', estimatedCost: 3000 });
    assert(addActRes.success && addActRes.source === 'USER_INPUT', 'addActivity() executed with USER_INPUT source');

    const remActRes = await aiTools.removeActivity(createdItineraryId, 1, 'Dhow Dinner Cruise');
    assert(remActRes.success && remActRes.source === 'USER_INPUT', 'removeActivity() executed with USER_INPUT source');

    const optTripRes = await aiTools.optimizeTrip(createdTripId, dummyUserId, 'Optimize route');
    assert(optTripRes.success && optTripRes.tool === 'optimizeTrip', 'optimizeTrip() executed');

    // 2. TRAVEL ORCHESTRATOR MULTI-DOMAIN COORDINATION & NATURAL LANGUAGE COMMANDS
    console.log('\n2. Testing TravelOrchestrator Natural Language Commands...');

    // Command 1: "Plan a 5-day Dubai trip from Ahmedabad."
    const orch1 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 5-day Dubai trip from Ahmedabad.',
      userId: dummyUserId,
      forceSynthesis: true,
    });
    assert(orch1.status === 'completed' && orch1.action === 'CREATE_TRIP', 'Command 1: "Plan a 5-day Dubai trip from Ahmedabad." executed');
    assert(orch1.dataSources.flights === 'PROVIDER' && orch1.dataSources.maps === 'API', 'Data sources properly attributed in multi-domain response');

    const testTripId = orch1.trip._id;

    // Command 2: "Find flights."
    const orch2 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Find flights.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch2.action === 'SEARCH_FLIGHTS' && orch2.source === 'PROVIDER', 'Command 2: "Find flights." returned SEARCH_FLIGHTS action');

    // Command 3: "Find a hotel near my activities."
    const orch3 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Find a hotel near my activities.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch3.action === 'SEARCH_HOTELS' && orch3.source === 'PROVIDER', 'Command 3: "Find a hotel near my activities." returned SEARCH_HOTELS action');

    // Command 4: "Add desert safari."
    const orch4 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Add desert safari.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch4.action === 'ADD_ACTIVITY' && orch4.source === 'USER_INPUT', 'Command 4: "Add desert safari." returned ADD_ACTIVITY action');

    // Command 5: "Remove shopping."
    const orch5 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Remove shopping.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch5.action === 'REMOVE_ACTIVITY' && orch5.source === 'USER_INPUT', 'Command 5: "Remove shopping." returned REMOVE_ACTIVITY action');

    // Command 6: "Make Day 3 cheaper."
    const orch6 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Make Day 3 cheaper.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch6.action === 'UPDATE_ITINERARY_ITEM' && orch6.source === 'AI_ESTIMATE', 'Command 6: "Make Day 3 cheaper." returned UPDATE_ITINERARY_ITEM action');

    // Command 7: "Move outdoor activities to a sunny day."
    const orch7 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Move outdoor activities to a sunny day.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch7.action === 'OPTIMIZE_WEATHER' && orch7.source === 'PROVIDER', 'Command 7: "Move outdoor activities to a sunny day." returned OPTIMIZE_WEATHER action');

    // Command 8: "Optimize my route."
    const orch8 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Optimize my route.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch8.action === 'OPTIMIZE_ROUTE' && orch8.source === 'API', 'Command 8: "Optimize my route." returned OPTIMIZE_ROUTE action');

    // Command 9: "Keep the total below ₹80,000."
    const orch9 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Keep the total below ₹80,000.',
      userId: dummyUserId,
      tripId: testTripId,
    });
    assert(orch9.action === 'UPDATE_BUDGET_LIMIT' && orch9.source === 'USER_INPUT', 'Command 9: "Keep the total below ₹80,000." returned UPDATE_BUDGET_LIMIT action');

    // 3. CONFIRMATION FLOW FOR DESTRUCTIVE ACTIONS
    console.log('\n3. Testing Confirmation Flow for Destructive Actions...');

    const unconfirmedRes = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Delete trip and clear itinerary.',
      userId: dummyUserId,
      tripId: testTripId,
      confirm: false,
    });
    assert(unconfirmedRes.status === 'confirmation_required', 'Destructive command returned confirmation_required status');
    assert(unconfirmedRes.requiresConfirmation === true, 'Flagged requiresConfirmation = true');
    assert(Boolean(unconfirmedRes.confirmationToken), 'Generated confirmationToken for UI prompt');

    const confirmedRes = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Delete trip and clear itinerary.',
      userId: dummyUserId,
      tripId: testTripId,
      confirm: true,
      confirmToken: unconfirmedRes.confirmationToken,
    });
    assert(confirmedRes.status !== 'confirmation_required', 'Confirmed action executed without blocking');

    // Cleanup synthesized test trip
    if (testTripId) {
      const t = await Trip.findById(testTripId);
      if (t?.itineraryId) await Itinerary.findByIdAndDelete(t.itineraryId);
      await Trip.findByIdAndDelete(testTripId);
    }

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 11 test run:', err);
    failedCount++;
  } finally {
    if (createdTripId) {
      await Expense.deleteMany({ tripId: createdTripId });
      await Trip.findByIdAndDelete(createdTripId);
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

runModule11Tests();
