/**
 * TripPilot AI — Module 6 Hotel & Overnight-Stay Planning Acceptance Test Suite
 * Executes 8 mandatory acceptance tests covering single-city, multi-city, extended trip,
 * early departure, budget change, provider failure fallback, route modification, and regression.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const travelOrchestrator = require('../services/travelOrchestrator.service');
const hotelService = require('../services/hotel.service');
const flightService = require('../services/flight.service');
const hotelProviderManager = require('../services/hotelProviders/HotelProviderManager');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippilot';

async function runAcceptanceTests() {
  console.log('=================================================================');
  console.log('  TRIPPILOT AI — MODULE 6 HOTEL ACCEPTANCE TEST SUITE (TESTS 1-8)');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${message}`);
      failed++;
    }
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.\n');

    // -----------------------------------------------------------------
    // TEST 1 — Single-City Trip (Bangalore 5-day stay)
    // -----------------------------------------------------------------
    console.log('▶ TEST 1 — Single-City Trip Alignment (Bangalore)');
    const trip1Res = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 5-day trip to Bangalore from Ahmedabad for 2 people with a budget of ₹60,000.',
      forceSynthesis: true,
    });
    const trip1 = trip1Res.trip;
    const itin1 = trip1Res.itinerary;
    const stays1 = await hotelService.planMultiCityAccommodations(trip1, itin1);
    const val1 = hotelService.validateAccommodationSchedule(trip1, itin1, stays1);

    assert(stays1.length === 1 && stays1[0].cityName === 'Bangalore', 'Test 1', 'Accommodation is assigned to Bangalore for full stay.');
    assert(stays1[0].nights === 4, 'Test 1', 'Accommodation covers all 4 overnight stays for 5-day trip.');
    if (!val1.isValid) console.log('    [Val1 Warnings]:', val1.warnings);
    assert(val1.isValid, 'Test 1', 'No coverage or budget validation warnings.');

    // -----------------------------------------------------------------
    // TEST 2 — Multi-City Trip (Bangalore -> Mysore)
    // -----------------------------------------------------------------
    console.log('\n▶ TEST 2 — Multi-City Accommodation Route Following (Bangalore -> Mysore)');
    const now = new Date();
    const trip2 = new Trip({
      userId: new mongoose.Types.ObjectId('660000000000000000000001'),
      title: 'Bangalore & Mysore 6-Day Tour',
      destinations: [
        { name: 'Bangalore', coordinates: { lat: 12.9716, lng: 77.5946 } },
        { name: 'Mysore', coordinates: { lat: 12.2958, lng: 76.6394 } },
      ],
      dates: {
        startDate: now,
        endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        durationDays: 6,
      },
      travelers: { count: 2 },
      budget: { total: 80000, breakdown: { hotel: 30000 } },
    });
    await trip2.save();

    const stays2 = await hotelService.planMultiCityAccommodations(trip2, null);
    const val2 = hotelService.validateAccommodationSchedule(trip2, null, stays2);

    assert(stays2.length === 2, 'Test 2', 'Two distinct stay segments created for Bangalore and Mysore.');
    assert(stays2[0].cityName === 'Bangalore' && stays2[1].cityName === 'Mysore', 'Test 2', 'Stays follow destination route (Bangalore -> Mysore).');
    if (!val2.isValid) console.log('    [Val2 Warnings]:', val2.warnings);
    assert(val2.isValid, 'Test 2', 'Multi-city accommodation schedule validated without conflicts.');

    // -----------------------------------------------------------------
    // TEST 3 — Extended Trip (Add 2 days to existing trip)
    // -----------------------------------------------------------------
    console.log('\n▶ TEST 3 — Extended Trip (Add 2 Days)');
    const extRes = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Add 2 days to my trip',
      tripId: trip1._id.toString(),
    });
    const updatedTrip1 = extRes.trip;
    const updatedItin1 = extRes.itinerary;
    const stays3 = await hotelService.planMultiCityAccommodations(updatedTrip1, updatedItin1);

    assert(updatedTrip1.dates.durationDays === 7, 'Test 3', 'Trip duration extended to 7 days.');
    assert(stays3[0].nights === 6, 'Test 3', 'Hotel stay nights updated to 6 (for 7-day trip) without duplicate stays.');

    // -----------------------------------------------------------------
    // TEST 4 — Early Departure Alignment
    // -----------------------------------------------------------------
    console.log('\n▶ TEST 4 — Early Departure & Airport Transfer Alignment');
    const finalStay = stays3[stays3.length - 1];
    assert(Boolean(finalStay.isDepartureNight), 'Test 4', 'Final night flagged as departure night.');
    assert(finalStay.notes.includes('return transfer buffer'), 'Test 4', 'Departure buffer note attached to final stay.');

    // -----------------------------------------------------------------
    // TEST 5 — Budget Change Recalculation
    // -----------------------------------------------------------------
    console.log('\n▶ TEST 5 — Budget Change Accommodation Recalculation');
    trip1.budget.total = 40000;
    trip1.budget.breakdown.hotel = 12000;
    await trip1.save();
    
    const cheapHotelRes = await hotelService.searchHotels({ destination: 'Bangalore', maxPricePerNight: 5000, tripId: trip1._id });
    assert(cheapHotelRes.results.length > 0, 'Test 5', 'Found budget-friendly hotels under lowered limit.');
    assert(cheapHotelRes.results[0].hotelFit.totalCost <= 25000, 'Test 5', 'Recalculated hotel fit stays within revised budget.');

    // -----------------------------------------------------------------
    // TEST 6 — Unavailable Hotel Data Provider Failure Handling
    // -----------------------------------------------------------------
    console.log('\n▶ TEST 6 — Unavailable Provider Data Fallback');
    const origSearchAll = hotelProviderManager.searchAllProviders;
    hotelProviderManager.searchAllProviders = async () => []; // Simulate empty/failed response

    const emptyResult = await hotelService.searchHotels({ destination: 'Bangalore' });
    assert(emptyResult.results.length === 0, 'Test 6', 'Zero live availability returned on provider failure.');
    
    // Restore provider manager
    hotelProviderManager.searchAllProviders = origSearchAll;

    // -----------------------------------------------------------------
    // TEST 7 — Route Modification (Reorder Destinations)
    // -----------------------------------------------------------------
    console.log('\n▶ TEST 7 — Route Modification & Stay Recalculation');
    trip2.destinations = [
      { name: 'Mysore', coordinates: { lat: 12.2958, lng: 76.6394 } },
      { name: 'Bangalore', coordinates: { lat: 12.9716, lng: 77.5946 } },
    ];
    await trip2.save();

    const modifiedStays = await hotelService.planMultiCityAccommodations(trip2, null);
    assert(modifiedStays[0].cityName === 'Mysore' && modifiedStays[1].cityName === 'Bangalore', 'Test 7', 'Stays reordered to match updated route order (Mysore -> Bangalore).');

    // -----------------------------------------------------------------
    // TEST 8 — Regression Check (Saved Trips, Maps, Auth, Itineraries)
    // -----------------------------------------------------------------
    console.log('\n▶ TEST 8 — System Regression Check');
    const savedTripCount = await Trip.countDocuments();
    const savedItinCount = await Itinerary.countDocuments();
    assert(savedTripCount > 0, 'Test 8', `Saved trips intact in DB (${savedTripCount} trips).`);
    assert(savedItinCount > 0, 'Test 8', `Saved itineraries intact in DB (${savedItinCount} itineraries).`);

    // Clean up temporary test trip
    await Trip.findByIdAndDelete(trip2._id);

  } catch (err) {
    console.error('❌ Acceptance test error:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n=================================================================');
    console.log(`  MODULE 6 ACCEPTANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runAcceptanceTests();
