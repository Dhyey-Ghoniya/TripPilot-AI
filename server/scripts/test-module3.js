require('dotenv').config();
const mongoose = require('mongoose');
const travelOrchestrator = require('../services/travelOrchestrator.service');
const destinationResolver = require('../services/destinationResolver.service');
const aiExtractor = require('../services/aiExtractor.service');
const aiTools = require('../services/aiTools.service');
const aiSessionService = require('../services/aiSession.service');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const AiSession = require('../models/AiSession');

async function runModule3Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 3 Automated Test Suite');
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

  const createdTripIds = [];
  const createdSessionIds = [];

  try {
    // TEST PROMPT 1: "Plan 5 days in Goa from Ahmedabad for 2."
    console.log('\n1. Testing Prompt 1: "Plan 5 days in Goa from Ahmedabad for 2."');
    const result1 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan 5 days in Goa from Ahmedabad for 2.',
    });
    assert(result1.status === 'completed', 'Orchestration completed successfully');
    assert(result1.extractedParams.destination.toLowerCase() === 'goa', 'Destination extracted as Goa');
    assert(result1.extractedParams.durationDays === 5, 'Duration extracted as 5 days');
    assert(result1.extractedParams.origin.toLowerCase() === 'ahmedabad', 'Origin extracted as Ahmedabad');
    assert(result1.extractedParams.travelersCount === 2, 'Travelers count extracted as 2');
    assert(Boolean(result1.trip), 'Trip blueprint object created');
    assert(Boolean(result1.itinerary), 'Day-by-day itinerary generated');
    assert(result1.itinerary.days.length === 5, 'Generated itinerary has exactly 5 days');
    if (result1.trip) createdTripIds.push(result1.trip._id);

    // TEST PROMPT 2: "Plan 5 days in Dubai from Ahmedabad for 2."
    console.log('\n2. Testing Prompt 2: "Plan 5 days in Dubai from Ahmedabad for 2."');
    const result2 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan 5 days in Dubai from Ahmedabad for 2.',
    });
    assert(result2.status === 'completed', 'Orchestration completed successfully');
    assert(result2.destinationContext.name === 'Dubai', 'Destination resolved as Dubai');
    assert(result2.destinationContext.currency === 'AED', 'Currency resolved as AED');
    assert(result2.itinerary.days.length === 5, 'Generated itinerary has 5 days');
    if (result2.trip) createdTripIds.push(result2.trip._id);

    // TEST PROMPT 3: "Plan 7 days in Tokyo."
    console.log('\n3. Testing Prompt 3: "Plan 7 days in Tokyo."');
    const result3 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan 7 days in Tokyo.',
    });
    assert(result3.status === 'completed', 'Orchestration completed successfully');
    assert(result3.extractedParams.destination.toLowerCase() === 'tokyo', 'Destination extracted as Tokyo');
    assert(result3.extractedParams.durationDays === 7, 'Duration extracted as 7 days');
    assert(result3.itinerary.days.length === 7, 'Generated itinerary has 7 days');
    if (result3.trip) createdTripIds.push(result3.trip._id);

    // TEST PROMPT 4: "Plan Bali under ₹80,000."
    console.log('\n4. Testing Prompt 4: "Plan Bali under ₹80,000."');
    const result4 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan Bali under ₹80,000.',
      forceSynthesis: true,
    });
    assert(result4.extractedParams.destination.toLowerCase() === 'bali', 'Destination extracted as Bali');
    assert(result4.extractedParams.budget === 80000, 'Budget extracted as 80000');
    assert(result4.trip.budget.total === 80000, 'Trip budget total set to 80000');
    if (result4.trip) createdTripIds.push(result4.trip._id);


    // TEST PROMPT 5: "Plan a trip to an unknown destination." (MUST NOT REJECT)
    console.log('\n5. Testing Prompt 5: Unknown Destination ("Plan 4 days in Xyzville")');
    const result5 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan 4 days in Xyzville from Ahmedabad for 2.',
    });
    assert(result5.status === 'completed', 'System did NOT reject unknown destination');
    assert(Boolean(result5.destinationContext), 'DestinationContext synthesized for unknown location');
    assert(result5.destinationContext.name === 'Xyzville', 'Name formatted properly');
    assert(result5.itinerary.days.length === 4, 'Itinerary generated for unknown destination');
    if (result5.trip) createdTripIds.push(result5.trip._id);

    // TEST CONVERSATIONAL PLANNING & MISSING INFORMATION
    console.log('\n6. Testing Conversational Planning & Missing Information...');
    const resultMissing = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a trip to Paris.',
    });
    assert(resultMissing.status === 'need_clarification', 'System identified missing duration field');
    assert(resultMissing.missingFields.includes('duration'), 'Missing field correctly flagged as "duration"');
    assert(Boolean(resultMissing.copilotMessage), 'Conversational clarifying question generated');

    // TEST AI SESSION & MESSAGING
    console.log('\n7. Testing AI Session Service Messaging...');
    const session = await aiSessionService.createOrGetSession();
    createdSessionIds.push(session.sessionId);
    assert(Boolean(session.sessionId), 'AI Session created with unique sessionId');

    const msg1Res = await aiSessionService.handleUserMessage(session.sessionId, 'Plan a trip to London.');
    assert(msg1Res.orchestratorResult.status === 'need_clarification', 'Session turn 1 asks for duration');

    const msg2Res = await aiSessionService.handleUserMessage(session.sessionId, 'For 5 days from Ahmedabad for 2 people.');
    assert(msg2Res.orchestratorResult.status === 'completed', 'Session turn 2 completes synthesis');
    assert(Boolean(msg2Res.orchestratorResult.trip), 'Trip blueprint generated via multi-turn session');
    if (msg2Res.orchestratorResult.trip) createdTripIds.push(msg2Res.orchestratorResult.trip._id);

    // TEST AI TOOL ARCHITECTURE
    console.log('\n8. Testing AI Tool Architecture Interfaces...');
    const searchToolRes = await aiTools.searchDestination('Reykjavik');
    assert(searchToolRes.success && searchToolRes.data.name === 'Reykjavik', 'searchDestination tool executed');

    const budgetToolRes = await aiTools.estimateBudget({
      destinationContext: searchToolRes.data,
      durationDays: 5,
      travelersCount: 2,
    });
    assert(budgetToolRes.success && budgetToolRes.data.total > 0, 'estimateBudget tool executed');

  } catch (err) {
    console.error('⚠️ Unexpected error during test run:', err);
    failedCount++;
  } finally {
    // Cleanup generated database entries
    console.log('\n🧹 Cleaning up test database artifacts...');
    if (createdTripIds.length > 0) {
      await Trip.deleteMany({ _id: { $in: createdTripIds } });
      await Itinerary.deleteMany({ tripId: { $in: createdTripIds } });
    }
    if (createdSessionIds.length > 0) {
      await AiSession.deleteMany({ sessionId: { $in: createdSessionIds } });
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

runModule3Tests();
