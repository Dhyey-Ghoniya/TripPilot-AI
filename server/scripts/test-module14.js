require('dotenv').config();
const mongoose = require('mongoose');
const journalService = require('../services/journal.service');
const personalizationService = require('../services/personalization.service');
const tripService = require('../services/trip.service');
const travelOrchestrator = require('../services/travelOrchestrator.service');
const TravelJournal = require('../models/TravelJournal');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Itinerary = require('../models/Itinerary');

async function runModule14Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 14 Automated Test Suite');
  console.log('   Post-Trip Intelligence, Travel Journal, Analytics & Personalization');
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
  let createdJournalId = null;
  let createdExpenseId = null;

  try {
    // 0. CREATE USER MODEL FIXTURE
    const testUser = new User({
      _id: dummyUserId,
      firstName: 'Pilot',
      lastName: 'Tester',
      email: `tester_mod14_${Date.now()}@trippilot.ai`,
      password: 'HashedPassword123!',
      travelPreferences: {
        interests: ['Sightseeing'],
        preferredTransport: ['Public transport'],
        accommodationPreference: ['Budget hotels'],
      },
    });
    await testUser.save();

    // ─────────────────────────────────────────────────────────────────
    // 1. TRAVEL JOURNAL CRUD & DATA PERSISTENCE
    // ─────────────────────────────────────────────────────────────────
    console.log('1. Testing Travel Journal Feature (Notes, Memories, Photos, Places, Ratings, Highlights)...');

    const journalPayload = {
      title: 'Majestic Himachal Adventure & Mountain Highs',
      location: 'Manali, Himachal Pradesh',
      notes: 'Unforgettable 5-day mountain escape. Crisp pine air, roaring Beas river, and quiet nights.',
      content: 'Unforgettable 5-day mountain escape. Crisp pine air, roaring Beas river, and quiet nights.',
      memories: [
        'Sunrise chai looking out at snow-capped Solang ridge',
        'Rented bicycle to explore Old Manali cedar forests',
        'Stargazing by the campsite bonfire at 11 PM',
      ],
      photos: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
      ],
      placesVisited: [
        {
          name: 'Solang Valley',
          category: 'Adventure',
          rating: 5,
          notes: 'Thrilling paragliding and panoramic valley views',
          location: 'Solang, Manali',
        },
        {
          name: 'Hadimba Temple',
          category: 'Cultural',
          rating: 5,
          notes: 'Ancient wooden pagoda surrounded by cedar groves',
          location: 'Dhungri, Manali',
        },
      ],
      ratings: {
        overall: 5,
        accommodation: 5,
        activities: 5,
        transport: 4,
        food: 5,
      },
      highlights: ['Nature', 'Adventure', 'Snow Peaks', 'Alpine Forest'],
      isPublic: false,
    };

    // Test Create Journal
    const createdJournal = await journalService.createJournal(dummyUserId, journalPayload);
    createdJournalId = createdJournal._id;

    assert(createdJournal && createdJournal._id, 'Travel journal created and persisted to MongoDB');
    assert(createdJournal.notes.includes('Unforgettable 5-day mountain escape'), 'Notes saved properly');
    assert(Array.isArray(createdJournal.memories) && createdJournal.memories.length === 3, 'Memories saved (3 entries)');
    assert(Array.isArray(createdJournal.photos) && createdJournal.photos.length === 2, 'Photos saved (2 URLs)');
    assert(Array.isArray(createdJournal.placesVisited) && createdJournal.placesVisited.length === 2, 'Places visited saved with ratings & categories');
    assert(createdJournal.ratings.overall === 5 && createdJournal.ratings.accommodation === 5, 'Multi-dimension 5-star ratings saved');
    assert(createdJournal.highlights.includes('Nature') && createdJournal.highlights.includes('Adventure'), 'Highlights saved (Nature, Adventure)');

    // Test Query Journals with Search
    const searchRes = await journalService.getUserJournals(dummyUserId, { search: 'Solang' });
    assert(searchRes.journals.length >= 1, 'Journal search query filters by keyword ("Solang")');

    // Test Read Single Journal
    const retrievedJournal = await journalService.getJournalById(createdJournalId, dummyUserId);
    assert(retrievedJournal.title === journalPayload.title, 'Retrieve single journal by ID verified');

    // Test Update Journal
    const updatedJournal = await journalService.updateJournal(createdJournalId, dummyUserId, {
      title: 'Updated: Majestic Himachal Adventure',
      highlights: ['Nature', 'Adventure', 'Alpine Forest', 'Trek'],
    });
    assert(updatedJournal.title.startsWith('Updated:'), 'Journal updated successfully');
    assert(updatedJournal.highlights.includes('Trek'), 'Updated journal highlights verified');

    // ─────────────────────────────────────────────────────────────────
    // 2. TRIP ANALYTICS ENGINE
    // ─────────────────────────────────────────────────────────────────
    console.log('\n2. Testing Trip Analytics Engine (Spending, Categories, Activities, Destinations, Patterns)...');

    // Create a completed trip blueprint
    const completedTrip = await tripService.createTrip(dummyUserId, {
      title: 'Himachal Nature Expedition',
      destination: { name: 'Manali', city: 'Manali', country: 'India' },
      dates: { durationDays: 5 },
      budget: {
        total: 35000,
        currency: 'INR',
        spent: 32000,
        breakdown: {
          flights: 12000,
          hotel: 9000,
          activities: 5000,
          food: 4000,
          transit: 2000,
          misc: 0,
        },
      },
      transport: {
        mode: 'Public transport',
      },
      travelStyle: 'adventure',
      tags: ['Nature', 'Adventure', 'Mountains'],
    });
    createdTripId = completedTrip._id;

    // Attach an activity to the trip
    completedTrip.activities = [
      {
        title: 'Jogini Waterfall Trek',
        dayNumber: 2,
        location: 'Vashisht, Manali',
        estimatedCost: 800,
        status: 'completed',
      },
    ];
    // Attach hotel
    completedTrip.hotel = {
      name: 'Himalayan Riverside Stay',
      roomType: 'Budget Room',
      pricePerNight: 1800,
      rating: 4.8,
    };
    await completedTrip.save();

    // Mark completed
    await tripService.markCompleted(createdTripId, dummyUserId);

    // Attach an Expense document
    const exp = new Expense({
      tripId: createdTripId,
      userId: dummyUserId,
      title: 'Local Bus Pass & Shared Cab',
      amount: 1500,
      category: 'Transport',
      costType: 'actual',
    });
    await exp.save();
    createdExpenseId = exp._id;

    // Link journal to this trip
    createdJournal.tripId = createdTripId;
    await createdJournal.save();

    // Run Analytics
    const analytics = await personalizationService.getTripAnalytics(dummyUserId);

    assert(analytics.totalSpending >= 32000, 'Total spending calculated accurately');
    assert(Array.isArray(analytics.spendingCategories) && analytics.spendingCategories.length > 0, 'Spending categories breakdown generated');
    const hotelSpend = analytics.spendingCategories.find((c) => c.category === 'Hotels');
    assert(hotelSpend && hotelSpend.amount >= 9000, 'Hotel category spending aggregated');

    assert(analytics.activitiesCompleted.totalCompleted >= 2, 'Activities completed tracked across trip and journal');
    assert(analytics.activitiesCompleted.list.some((a) => a.title.includes('Waterfall') || a.title.includes('Solang')), 'Activities list populated');

    assert(analytics.destinationsVisited.totalDestinations >= 1, 'Destinations visited counted');
    assert(analytics.destinationsVisited.list.some((d) => d.name === 'Manali'), 'Destinations visited list includes "Manali"');

    assert(analytics.travelPatterns.favoriteInterests.includes('Nature') || analytics.travelPatterns.favoriteInterests.includes('Adventure'), 'Travel patterns: top favorite interests identified');
    assert(analytics.travelPatterns.preferredTransport.includes('Public transport'), 'Travel patterns: preferred transport ("Public transport") identified');
    assert(analytics.travelPatterns.preferredAccommodation.includes('Budget hotels'), 'Travel patterns: preferred accommodation ("Budget hotels") identified');

    // ─────────────────────────────────────────────────────────────────
    // 3. FUTURE AI PERSONALIZATION & STRICT PRIVACY COMPLIANCE
    // ─────────────────────────────────────────────────────────────────
    console.log('\n3. Testing Future AI Personalization & Privacy Guardrails...');

    const personalizationRes = await personalizationService.getOrUpdateFuturePersonalization(dummyUserId);
    assert(personalizationRes.success === true, 'getOrUpdateFuturePersonalization() executed');

    const copilotMatrix = personalizationRes.copilotPersonalization;
    assert(Array.isArray(copilotMatrix.userFrequentlyChooses), 'userFrequentlyChooses array provided');
    assert(copilotMatrix.userFrequentlyChooses.includes('Nature'), 'User frequently chooses: Nature');
    assert(copilotMatrix.userFrequentlyChooses.includes('Adventure'), 'User frequently chooses: Adventure');
    assert(copilotMatrix.userFrequentlyChooses.includes('Budget hotels'), 'User frequently chooses: Budget hotels');
    assert(copilotMatrix.userFrequentlyChooses.includes('Public transport'), 'User frequently chooses: Public transport');

    // Check exact prompt string format
    console.log('\n  Learned Preferences Output:');
    console.log('  ------------------------------------------');
    console.log(copilotMatrix.formattedSummary.split('\n').map((l) => `  ${l}`).join('\n'));
    console.log('  ------------------------------------------');

    assert(copilotMatrix.formattedSummary.includes('User frequently chooses:'), 'Formatted summary header verified');
    assert(copilotMatrix.formattedSummary.includes('Nature') && copilotMatrix.formattedSummary.includes('Adventure'), 'Summary contains Nature and Adventure');
    assert(copilotMatrix.formattedSummary.includes('Budget hotels'), 'Summary contains Budget hotels');
    assert(copilotMatrix.formattedSummary.includes('Public transport'), 'Summary contains Public transport');

    // Anti-Bias Privacy Audit Check:
    assert(copilotMatrix.privacyCompliance?.sensitiveCharacteristicsInferred === false, 'Privacy Guarantee: Zero sensitive personal characteristics inferred');
    assert(Array.isArray(copilotMatrix.privacyCompliance?.protectedCategoriesAudited), 'Audited protected categories list present');

    // Check persistence to User model
    const refreshedUser = await User.findById(dummyUserId);
    assert(refreshedUser.travelPreferences.interests.includes('Nature'), 'User model updated with learned non-sensitive interests');
    assert(refreshedUser.travelPreferences.preferredTransport.includes('Public transport'), 'User model updated with learned transport preference');
    assert(refreshedUser.travelPreferences.accommodationPreference.includes('Budget hotels'), 'User model updated with learned accommodation preference');

    // Ensure sensitive fields do NOT exist in travel preferences schema
    assert(refreshedUser.travelPreferences.religion === undefined, 'Privacy check: No religion field inferred');
    assert(refreshedUser.travelPreferences.race === undefined, 'Privacy check: No race field inferred');
    assert(refreshedUser.travelPreferences.politics === undefined, 'Privacy check: No politics field inferred');

    // Test AI Travel Orchestrator consumes learned preferences for future trip planning
    console.log('\n4. Testing AI Trip Orchestrator Integration with Learned Personalization...');
    const futureTripBlueprint = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 4-day trip to Rishikesh',
      userId: dummyUserId,
      forceSynthesis: true,
    });

    assert(futureTripBlueprint.status === 'completed', 'AI Orchestrator successfully planned trip using learned preferences');
    assert(futureTripBlueprint.trip !== null, 'Trip blueprint created with personalized parameters');

    // Delete journal entry test
    await journalService.deleteJournal(createdJournalId, dummyUserId);
    const postDeleteCheck = await TravelJournal.findById(createdJournalId);
    assert(postDeleteCheck === null, 'Journal delete removes entry from database');
    createdJournalId = null;

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 14 test execution:', err);
    failedCount++;
  } finally {
    // Cleanup fixtures
    if (createdJournalId) {
      await TravelJournal.findByIdAndDelete(createdJournalId);
    }
    if (createdExpenseId) {
      await Expense.findByIdAndDelete(createdExpenseId);
    }
    if (createdTripId) {
      const t = await Trip.findById(createdTripId);
      if (t?.itineraryId) await Itinerary.findByIdAndDelete(t.itineraryId);
      await Trip.findByIdAndDelete(createdTripId);
    }
    await User.findByIdAndDelete(dummyUserId);
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database.');

    console.log('\n----------------------------------------------------');
    console.log(`📊 MODULE 14 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('----------------------------------------------------');

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runModule14Tests();
