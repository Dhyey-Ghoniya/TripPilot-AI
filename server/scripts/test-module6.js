require('dotenv').config();
const mongoose = require('mongoose');
const hotelService = require('../services/hotel.service');
const hotelProviderManager = require('../services/hotelProviders/HotelProviderManager');
const bookingProvider = require('../services/hotelProviders/BookingProvider');
const agodaProvider = require('../services/hotelProviders/AgodaProvider');
const makeMyTripProvider = require('../services/hotelProviders/MakeMyTripProvider');
const tripComProvider = require('../services/hotelProviders/TripComProvider');
const expediaProvider = require('../services/hotelProviders/ExpediaProvider');
const hotelsComProvider = require('../services/hotelProviders/HotelsComProvider');
const tripService = require('../services/trip.service');
const Trip = require('../models/Trip');
const HotelSearch = require('../models/HotelSearch');

async function runModule6Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 6 Automated Test Suite');
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
    // 1. HOTEL PROVIDER ADAPTERS & DEEP-LINK GENERATION
    console.log('1. Testing 6 Hotel Provider Adapters & Deep-Link Redirection URLs...');

    const searchParams = {
      destination: 'Dubai',
      checkIn: '2026-10-15',
      checkOut: '2026-10-19',
      guests: 2,
      rooms: 1,
    };

    const bookingLink = bookingProvider.generateBookingLink({}, searchParams);
    assert(bookingLink.includes('booking.com') && bookingLink.includes('Dubai'), 'Booking.com deep-link generated with search parameters');

    const agodaLink = agodaProvider.generateBookingLink({}, searchParams);
    assert(agodaLink.includes('agoda.com') && agodaLink.includes('Dubai'), 'Agoda deep-link generated with search parameters');

    const mmtLink = makeMyTripProvider.generateBookingLink({}, searchParams);
    assert(mmtLink.includes('makemytrip.com') && mmtLink.includes('Dubai'), 'MakeMyTrip deep-link generated with search parameters');

    const tripComLink = tripComProvider.generateBookingLink({}, searchParams);
    assert(tripComLink.includes('trip.com') && tripComLink.includes('Dubai'), 'Trip.com deep-link generated with search parameters');

    const expediaLink = expediaProvider.generateBookingLink({}, searchParams);
    assert(expediaLink.includes('expedia.com') && expediaLink.includes('Dubai'), 'Expedia deep-link generated with search parameters');

    const hotelsComLink = hotelsComProvider.generateBookingLink({}, searchParams);
    assert(hotelsComLink.includes('hotels.com') && hotelsComLink.includes('Dubai'), 'Hotels.com deep-link generated with search parameters');

    // 2. CONCURRENT MULTI-PROVIDER HOTEL SEARCH & FILTERS
    console.log('\n2. Testing Concurrent Search Across 6 Providers with Filters...');
    const searchRes = await hotelService.searchHotels(searchParams, dummyUserId);

    assert(searchRes.totalResults >= 6, 'Search returned hotel results across all 6 provider adapters');
    assert(Boolean(searchRes.searchId), 'HotelSearch document persisted in MongoDB');

    const firstHotel = searchRes.results[0];
    assert(Boolean(firstHotel.bookingUrl), 'Hotel item has official provider redirection URL');
    assert(Boolean(firstHotel.hotelFit), 'Hotel Fit intelligence score & metadata calculated');

    // 3. HOTEL FIT INTELLIGENCE EVALUATION
    console.log('\n3. Testing Hotel Fit Evaluation (Budget, Day 1 & Day 2 distances, Airport)...');
    
    // Create a dummy trip with budget and itinerary context
    const trip = await tripService.createTrip(dummyUserId, {
      title: '5-Day Dubai Stay Integration Trip',
      destination: { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', coordinates: { lat: 25.2048, lng: 55.2708 } },
      dates: { durationDays: 5 },
      budget: { total: 100000, currency: 'INR', breakdown: { hotel: 35000 } },
    });
    createdTripId = trip._id;

    const fitEval = hotelService.getHotelFit(firstHotel, trip, 4);
    assert(Boolean(fitEval.budgetCompatibility), 'Budget compatibility calculated (e.g. Within Budget)');
    assert(Boolean(fitEval.distanceToDay1Text), 'Distance to Day 1 activities calculated');
    assert(Boolean(fitEval.distanceToDay2Text), 'Distance to Day 2 activities calculated');
    assert(Boolean(fitEval.airportDistanceText), 'Airport distance calculated');
    assert(Boolean(fitEval.estimatedTransportImpact), 'Estimated transport impact & daily cost computed');

    // 4. TRIP HOTEL ATTACHMENT & BUDGET / MAP / TRANSPORT UPDATES
    console.log('\n4. Testing Hotel Attachment to Trip & Budget / Map Updates...');
    const initialHotelBudget = trip.budget.breakdown.hotel || 0;

    const attachRes = await hotelService.attachHotelToTrip(createdTripId, firstHotel, dummyUserId);
    assert(attachRes.success, 'Hotel successfully attached to trip');

    const updatedTrip = await Trip.findById(createdTripId);
    assert(updatedTrip.hotel.name === firstHotel.name, 'Trip.hotel.name updated with selected hotel');
    assert(updatedTrip.hotel.status === 'shortlisted', 'Trip.hotel.status set to shortlisted');
    assert(updatedTrip.budget.breakdown.hotel > 0, 'Trip.budget.breakdown.hotel updated');
    assert(updatedTrip.mapData.waypoints.some((wp) => wp.name.includes('Stay Location')), 'MapData waypoints updated with Stay Location marker');

    // 5. AI STAY COPILOT COMMANDS
    console.log('\n5. Testing AI Stay Copilot Prompts...');

    // Command A: "Find a hotel near my Day 2 activities."
    const aiCmd1 = await hotelService.executeAiHotelCommand('Find a hotel near my Day 2 activities.', createdTripId, dummyUserId);
    assert(aiCmd1.action === 'near_day2', 'AI command "near Day 2 activities" executed successfully');
    assert(Boolean(aiCmd1.hotel), 'Closest hotel to Day 2 activities identified');

    // Command B: "Find a 4-star hotel under ₹20,000."
    const aiCmd2 = await hotelService.executeAiHotelCommand('Find a 4-star hotel under ₹20,000.', createdTripId, dummyUserId);
    assert(aiCmd2.action === 'filter_star_price', 'AI command "4-star under ₹20,000" executed successfully');
    assert(aiCmd2.hotels.every((h) => h.starRating === 4), 'All returned hotels are 4-star');

    // Command C: "Move my hotel closer to downtown."
    const aiCmd3 = await hotelService.executeAiHotelCommand('Move my hotel closer to downtown.', createdTripId, dummyUserId);
    assert(aiCmd3.action === 'move_downtown', 'AI command "Move hotel closer to downtown" executed');
    assert(Boolean(aiCmd3.hotel), 'Downtown hotel attached to trip');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 6 test run:', err);
    failedCount++;
  } finally {
    // Cleanup
    if (createdTripId) {
      await tripService.deleteTrip(createdTripId, dummyUserId);
    }
    await HotelSearch.deleteMany({ userId: dummyUserId });
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

runModule6Tests();
