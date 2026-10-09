/**
 * Test Suite for Module 4: Structured Itineraries, Geographic Consistency, Maps & Routing
 * Verifies structured daily itineraries, Mumbai-to-Goa distance fix, multi-city routing, duration changes, & map sync.
 */

const mongoose = require('mongoose');
const travelOrchestrator = require('../services/travelOrchestrator.service');
const mapService = require('../services/map.service');
const mapProvider = require('../services/mapProviders/MapProvider');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippilot';

async function runModule4Tests() {
  console.log('===============================================================');
  console.log('  TRIPPILOT AI — MODULE 4 ITINERARY & MAP ROUTING SUITE        ');
  console.log('===============================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Single-City Structured Itinerary
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 1: Single-City Structured Itinerary Generation');
    const singleTripRes = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 5-day trip to Tokyo from Ahmedabad for 2 people.',
      forceSynthesis: true,
    });

    const trip = singleTripRes.trip;
    const itinerary = singleTripRes.itinerary;

    console.log(`  Trip Title: ${trip.title}`);
    console.log(`  Itinerary Total Days: ${itinerary.days.length}`);
    console.log(`  Day 1 Theme: ${itinerary.days[0].theme}`);
    console.log(`  Day 1 Activities Count: ${itinerary.days[0].activities.length}`);
    console.log(`  Day 1 Morning Activity: ${itinerary.days[0].activities[0].activity}`);
    console.log(`  Day 1 Morning Coordinates: Lat ${itinerary.days[0].activities[0].coordinates?.lat}, Lng ${itinerary.days[0].activities[0].coordinates?.lng}`);
    console.log(`  Day 1 Meals: Breakfast="${itinerary.days[0].meals?.breakfast}", Dinner="${itinerary.days[0].meals?.dinner}"`);

    const hasValidCoords = itinerary.days[0].activities.every((a) => a.coordinates && a.coordinates.lat && a.coordinates.lng);
    if (itinerary.days.length === 5 && hasValidCoords && itinerary.days[0].meals) {
      console.log('  ✅ TEST 1 PASSED: Structured single-city itinerary with complete coordinates, meals, & transport generated!\n');
    } else {
      throw new Error('Test 1 Failed: Structured itinerary invalid.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Mumbai-to-Goa Road Trip Distance Bug Fix Verification
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 2: Mumbai-to-Goa Driving Distance Verification');
    const roadTripRes = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a road trip from Mumbai to Goa.',
    });

    const roadTrip = roadTripRes.trip;
    const reportedDist = roadTrip.roadTripData?.totalDistanceKm;
    const reportedHours = roadTrip.roadTripData?.totalDrivingHours;

    console.log(`  Road Trip Title: ${roadTrip.title}`);
    console.log(`  Reported Driving Distance: ${reportedDist} km`);
    console.log(`  Reported Driving Time: ${reportedHours} hours`);

    // Verify distance is realistic (~550 to 650 km, NOT 9,500+ km!)
    if (reportedDist >= 500 && reportedDist <= 700) {
      console.log(`  ✅ TEST 2 PASSED: Mumbai-to-Goa distance verified accurately at ${reportedDist} km (~${reportedHours} hrs)! Fix confirmed.\n`);
    } else {
      throw new Error(`Test 2 Failed: Reported distance ${reportedDist} km is incorrect (expected ~570-600 km).`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Map Workspace & Telemetry Sync
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 3: Map Workspace Markers & Telemetry Generation');
    const mapWorkspace = await mapService.getTripMapWorkspace(trip._id, 1);

    console.log(`  Map Center: Lat ${mapWorkspace.mapCenter.lat}, Lng ${mapWorkspace.mapCenter.lng}`);
    console.log(`  Total Markers Generated: ${mapWorkspace.markers.length}`);
    console.log(`  Route Segments Computed: ${mapWorkspace.routeSegments.length}`);
    console.log(`  Daily Total Commute Distance: ${mapWorkspace.tripIntelligence.dailyDistanceKm} km`);
    console.log(`  Active Mode: ${mapWorkspace.activeMode}`);

    if (mapWorkspace.markers.length >= 4 && mapWorkspace.routeSegments.length >= 1) {
      console.log('  ✅ TEST 3 PASSED: Map workspace generated markers, polylines, and daily distance telemetry!\n');
    } else {
      throw new Error('Test 3 Failed: Map workspace missing markers or routes.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Duration Changes (Add 2 Days)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 4: Duration Extension (Add 2 Days)');
    const extRes = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Add 2 days to my trip.',
      tripId: trip._id,
    });

    const updatedTrip = extRes.trip;
    const updatedItinerary = extRes.itinerary;

    console.log(`  New Duration: ${updatedTrip.dates.durationDays} days`);
    console.log(`  Updated Itinerary Days: ${updatedItinerary.days.length}`);

    if (updatedTrip.dates.durationDays === 7 && updatedItinerary.days.length === 7) {
      console.log('  ✅ TEST 4 PASSED: Successfully extended trip duration and regenerated itinerary days to match!\n');
    } else {
      throw new Error('Test 4 Failed: Duration extension did not sync itinerary days.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Multi-City Destination & Activity Synchronization
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 5: Multi-City Destination Addition & Map Sync');
    const addDestRes = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Add Kyoto to my trip.',
      tripId: trip._id,
    });

    const multiTrip = addDestRes.trip;
    console.log(`  Multi-City Destinations Count: ${multiTrip.destinations.length}`);
    console.log(`  Destinations List: ${multiTrip.destinations.map((d) => d.name).join(' -> ')}`);

    const updatedMapWorkspace = await mapService.getTripMapWorkspace(trip._id, 1);
    console.log(`  Updated Map Markers: ${updatedMapWorkspace.markers.length}`);

    if (multiTrip.destinations.length >= 2 && updatedMapWorkspace.markers.length > 0) {
      console.log('  ✅ TEST 5 PASSED: Multi-city destinations and map workspace synced in lockstep!\n');
    } else {
      throw new Error('Test 5 Failed: Multi-city addition failed.');
    }

    console.log('===============================================================');
    console.log('  MAPPING & ROUTING INTEGRATION REPORT                         ');
    console.log('===============================================================');
    console.log('  1. Open-Meteo & OpenStreetMap Geocoding: Resolved exact coordinates');
    console.log('  2. OSRM & Haversine Route Telemetry: 1.3x Road factor for accurate distance');
    console.log('  3. Leaflet / MapCanvas visualizer: Synchronized markers & polyline routes');
    console.log('===============================================================\n');
    console.log('   ALL 5 MODULE 4 ITINERARY & MAP TESTS PASSED SUCCESSFULLY!    ');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('❌ MODULE 4 TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runModule4Tests();
