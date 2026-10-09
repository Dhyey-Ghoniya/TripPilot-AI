require('dotenv').config();
const mongoose = require('mongoose');
const flightService = require('../services/flight.service');
const flightProviderManager = require('../services/flightProviders/FlightProviderManager');
const ixigoProvider = require('../services/flightProviders/IxigoProvider');
const makeMyTripProvider = require('../services/flightProviders/MakeMyTripProvider');
const cleartripProvider = require('../services/flightProviders/CleartripProvider');
const skyscannerProvider = require('../services/flightProviders/SkyscannerProvider');
const tripComProvider = require('../services/flightProviders/TripComProvider');
const expediaProvider = require('../services/flightProviders/ExpediaProvider');
const tripService = require('../services/trip.service');
const Trip = require('../models/Trip');
const FlightSearch = require('../models/FlightSearch');

async function runModule5Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 5 Automated Test Suite');
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
    // 1. PROVIDER ADAPTERS & DEEP-LINK GENERATION
    console.log('1. Testing Flight Provider Adapters & Deep-Link Redirection URLs...');

    const searchParams = {
      originAirport: 'AMD',
      destinationAirport: 'DXB',
      departureDate: '2026-10-15',
    };

    const ixigoLink = ixigoProvider.generateBookingLink(null, searchParams);
    assert(ixigoLink.includes('ixigo.com') && ixigoLink.includes('AMD') && ixigoLink.includes('DXB'), 'Ixigo deep-link generated with parameters');

    const mmtLink = makeMyTripProvider.generateBookingLink(null, searchParams);
    assert(mmtLink.includes('makemytrip.com') && mmtLink.includes('AMD-DXB'), 'MakeMyTrip deep-link generated with parameters');

    const cleartripLink = cleartripProvider.generateBookingLink(null, searchParams);
    assert(cleartripLink.includes('cleartrip.com') && cleartripLink.includes('AMD'), 'Cleartrip deep-link generated with parameters');

    const skyscannerLink = skyscannerProvider.generateBookingLink(null, searchParams);
    assert(skyscannerLink.includes('skyscanner.com') && skyscannerLink.includes('amd'), 'Skyscanner deep-link generated with parameters');

    const tripComLink = tripComProvider.generateBookingLink(null, searchParams);
    assert(tripComLink.includes('trip.com') && tripComLink.includes('amd-to-dxb'), 'Trip.com deep-link generated with parameters');

    const expediaLink = expediaProvider.generateBookingLink(null, searchParams);
    assert(expediaLink.includes('expedia.com') && expediaLink.includes('AMD'), 'Expedia deep-link generated with parameters');

    // 2. CONCURRENT MULTI-PROVIDER SEARCH
    console.log('\n2. Testing Concurrent Search Across 6 Providers...');
    const searchRes = await flightService.searchFlights(searchParams, dummyUserId);

    assert(searchRes.totalResults >= 6, 'Search returned flight results from all 6 provider adapters');
    assert(Boolean(searchRes.searchId), 'FlightSearch document persisted in MongoDB');

    const firstResult = searchRes.results[0];
    assert(Boolean(firstResult.bookingUrl), 'Flight item has official provider redirection URL');
    assert(Boolean(firstResult.score), 'AI match score calculated for flight item');

    // 3. TRIP FLIGHT ATTACHMENT & BUDGET UPDATE
    console.log('\n3. Testing Flight Attachment to Trip & Budget Update...');
    const trip = await tripService.createTrip(dummyUserId, {
      title: '5-Day Dubai Flight Integration Trip',
      destination: { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates' },
      origin: { name: 'Ahmedabad', city: 'Ahmedabad' },
      dates: { durationDays: 5 },
      budget: { total: 100000, currency: 'INR' },
    });
    createdTripId = trip._id;

    const initialFlightBudget = trip.budget.breakdown.flights || 0;

    const attachRes = await flightService.attachFlightToTrip(createdTripId, firstResult, dummyUserId);
    assert(attachRes.success, 'Flight successfully attached to trip');

    const updatedTrip = await Trip.findById(createdTripId);
    assert(updatedTrip.flights.length === 1, 'Flight item added to trip.flights array');
    assert(
      updatedTrip.budget.breakdown.flights === initialFlightBudget + (firstResult.price.amount || firstResult.price),
      'Trip budget breakdown for flights updated dynamically'
    );

    // 4. AI FLIGHT COMMANDS
    console.log('\n4. Testing AI Flight Commands...');

    // Command A: "Find flights from Ahmedabad to Dubai"
    const aiCmd1 = await flightService.executeAiFlightCommand('Find flights from Ahmedabad to Dubai', createdTripId, dummyUserId);
    assert(aiCmd1.action === 'search', 'AI command "Find flights" executed search action');
    assert(aiCmd1.flights.length >= 6, 'AI command returned flight matrix results');

    // Command B: "Find the cheapest reasonable option"
    const aiCmd2 = await flightService.executeAiFlightCommand('Find the cheapest reasonable option', createdTripId, dummyUserId);
    assert(aiCmd2.action === 'cheapest', 'AI command "Find cheapest" executed');
    assert(Boolean(aiCmd2.cheapestFlight), 'Cheapest flight option identified');

    // Command C: "Add this flight to my trip"
    const aiCmd3 = await flightService.executeAiFlightCommand('Add this flight to my trip', createdTripId, dummyUserId);
    assert(aiCmd3.action === 'attach', 'AI command "Add this flight to my trip" executed attachment');

    const finalTrip = await Trip.findById(createdTripId);
    assert(finalTrip.flights.length === 2, 'Second flight attached to trip via AI command');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 5 test run:', err);
    failedCount++;
  } finally {
    // Cleanup
    if (createdTripId) {
      await tripService.deleteTrip(createdTripId, dummyUserId);
    }
    await FlightSearch.deleteMany({ userId: dummyUserId });
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

runModule5Tests();
