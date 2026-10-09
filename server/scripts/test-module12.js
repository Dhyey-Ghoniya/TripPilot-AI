require('dotenv').config();
const mongoose = require('mongoose');
const exploreService = require('../services/explore.service');
const tripService = require('../services/trip.service');
const Trip = require('../models/Trip');

async function runModule12Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 12 Automated Test Suite');
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
    // Setup dummy past trip for personalization testing
    const trip = await tripService.createTrip(dummyUserId, {
      title: 'Past Adventure Trip to Manali',
      destination: { name: 'Manali', city: 'Manali', country: 'India' },
      dates: { durationDays: 4 },
      budget: { total: 25000, currency: 'INR' },
      tags: ['Mountains', 'Adventure', 'Nature'],
    });
    createdTripId = trip._id;

    // 1. EXPLORE DISCOVERY LAYER DATA (ALL 5 SECTIONS)
    console.log('1. Testing Explore Page Data & All 5 Sections...');

    const exploreRes = await exploreService.getExploreData(dummyUserId);
    assert(exploreRes.success === true, 'getExploreData() executed successfully');

    const { recommendedForYou, aiDiscoveries, travelCollections, popularExperiences, weekendIdeas } = exploreRes.data;

    assert(Array.isArray(recommendedForYou) && recommendedForYou.length > 0, 'Section 1: "Recommended for You" section populated');
    assert(recommendedForYou[0].matchScore !== undefined, 'Recommended destination includes personalization matchScore %');
    assert(Boolean(recommendedForYou[0].recommendationReason), 'Recommended destination includes privacy-compliant recommendation reason string');

    assert(Array.isArray(aiDiscoveries) && aiDiscoveries.length === 3, 'Section 2: "AI Discoveries" section populated with 3 prompt cards');

    assert(Array.isArray(travelCollections) && travelCollections.length === 4, 'Section 3: "Travel Collections" section populated with editorial themed collections');

    assert(Array.isArray(popularExperiences) && popularExperiences.length > 0, 'Section 4: "Popular Experiences" section populated with top attractions/activities');

    assert(Array.isArray(weekendIdeas) && weekendIdeas.length > 0, 'Section 5: "Weekend Ideas" section populated with quick 2-3 day getaways & budget estimates');

    // 2. AI NATURAL LANGUAGE DISCOVERY ENDPOINTS
    console.log('\n2. Testing AI Natural Language Discovery Requests...');

    // Prompt A: "Find destinations like my previous trip."
    const disc1 = await exploreService.handleAiDiscovery(dummyUserId, 'Find destinations like my previous trip.');
    assert(disc1.success === true && disc1.intent === 'SIMILAR_TO_PREVIOUS_TRIP', 'Prompt A: "Find destinations like my previous trip." executed');
    assert(disc1.results.length > 0, 'Returned recommendations matching previous trip scenery & tags');

    // Prompt B: "Suggest a 4-day adventure trip."
    const disc2 = await exploreService.handleAiDiscovery(dummyUserId, 'Suggest a 4-day adventure trip.');
    assert(disc2.success === true && disc2.intent === '4DAY_ADVENTURE_SUGGESTION', 'Prompt B: "Suggest a 4-day adventure trip." executed');
    assert(disc2.results[0].durationDays === 4, 'Returned tailored 4-day adventure trip blueprints');

    // Prompt C: "Where can I travel under ₹30,000?"
    const disc3 = await exploreService.handleAiDiscovery(dummyUserId, 'Where can I travel under ₹30,000?');
    assert(disc3.success === true && disc3.intent === 'BUDGET_DISCOVERY', 'Prompt C: "Where can I travel under ₹30,000?" executed');
    assert(disc3.maxBudget === 30000, 'Filtered budget-friendly destinations fitting max limit of ₹30,000');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 12 test run:', err);
    failedCount++;
  } finally {
    if (createdTripId) {
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

runModule12Tests();
