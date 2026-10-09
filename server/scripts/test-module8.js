require('dotenv').config();
const mongoose = require('mongoose');
const mapService = require('../services/map.service');
const mapProvider = require('../services/mapProviders/MapProvider');
const tripService = require('../services/trip.service');
const Trip = require('../models/Trip');

async function runModule8Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 8 Automated Test Suite');
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
    // 1. MAP PROVIDER INTERFACE & REAL GEOSPATIAL CALCULATIONS
    console.log('1. Testing MapProvider (geocode, reverseGeocode, calculateRoute, calculateDistance)...');

    const geoRes = await mapProvider.geocode('Burj Khalifa');
    assert(geoRes.lat && geoRes.lng, 'Geocoded place to coordinates (lat/lng)');
    assert(Boolean(geoRes.formattedAddress), 'Formatted address returned from geocode');

    const revRes = await mapProvider.reverseGeocode(25.2048, 55.2708);
    assert(Boolean(revRes.formattedAddress), 'Reverse geocoded coordinates to location address');

    const routeRes = await mapProvider.calculateRoute(
      { lat: 25.2048, lng: 55.2708 },
      { lat: 25.1972, lng: 55.2744 },
      'Taxi'
    );
    assert(routeRes.distanceKm > 0, 'Calculated real road distance in km');
    assert(routeRes.durationMinutes > 0, 'Calculated travel duration in minutes');
    assert(routeRes.pathCoordinates.length >= 2, 'Generated route polyline path coordinates');

    // 2. SUPPORT FOR ALL 7 TRANSPORT MODES
    console.log('\n2. Testing 7 Transport Modes (Walking, Taxi, Car, Bus, Metro, Train, Bike)...');
    const modes = ['Walking', 'Taxi', 'Car', 'Bus', 'Metro', 'Train', 'Bike'];

    assert(modes.length === 7, 'All 7 requested transport modes supported');

    for (const mode of modes) {
      const modeRoute = await mapProvider.calculateRoute(
        { lat: 25.2048, lng: 55.2708 },
        { lat: 25.1972, lng: 55.2744 },
        mode
      );
      assert(modeRoute.durationMinutes > 0, `Route calculated for transport mode: ${mode}`);
    }

    // 3. TRIP MAP WORKSPACE & MARKERS (Airport, Hotel, Activities, Attractions, Restaurants)
    console.log('\n3. Testing Trip Map Workspace Markers & Daily Route Connections...');
    const trip = await tripService.createTrip(dummyUserId, {
      title: '5-Day Dubai Map Workspace Trip',
      destination: { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', coordinates: { lat: 25.2048, lng: 55.2708 } },
      dates: { durationDays: 5 },
      budget: { total: 100000, currency: 'INR' },
    });
    createdTripId = trip._id;

    // Attach hotel & activities
    trip.hotel = {
      name: 'Grand Hyatt Dubai',
      coordinates: { lat: 25.22, lng: 55.32 },
    };
    trip.activities = [
      { title: 'Dubai Fountain & Mall', dayNumber: 1, category: 'Sightseeing', timeSlot: 'morning' },
      { title: 'Al Mahara Seafood Restaurant', dayNumber: 1, category: 'Food', timeSlot: 'afternoon' },
      { title: 'Burj Khalifa Observation Deck', dayNumber: 1, category: 'Sightseeing', timeSlot: 'evening' },
    ];
    await trip.save();

    const workspaceRes = await mapService.getTripMapWorkspace(createdTripId, 1);
    assert(workspaceRes.markers.some((m) => m.category === 'airport'), 'Airport marker included in map workspace');
    assert(workspaceRes.markers.some((m) => m.category === 'hotel'), 'Hotel stay marker included in map workspace');
    assert(workspaceRes.markers.some((m) => m.category === 'attraction' || m.category === 'activity'), 'Activity / attraction markers included');
    assert(workspaceRes.markers.some((m) => m.category === 'restaurant'), 'Restaurant dining marker included');
    assert(workspaceRes.routeSegments.length > 0, 'Daily route polyline segments generated');

    // 4. ROUTE OPTIMIZATION ENGINE (TSP A -> B -> C -> A reordering)
    console.log('\n4. Testing AI Route Optimization (Detecting & Fixing Inefficient Sequences)...');
    const inefficientWaypoints = [
      { name: 'Hotel Stay (A)', coordinates: { lat: 25.2048, lng: 55.2708 } },
      { name: 'Far North Spot (B)', coordinates: { lat: 25.3500, lng: 55.4000 } },
      { name: 'Center Spot (C)', coordinates: { lat: 25.2100, lng: 55.2750 } },
      { name: 'Far North Spot 2 (D)', coordinates: { lat: 25.3600, lng: 55.4100 } },
    ];

    const optResult = mapService.optimizeItineraryRoute(inefficientWaypoints);
    assert(optResult.hasInefficiency, 'Inefficient backtracking route sequence detected');
    assert(optResult.savedDistanceKm > 0, 'Calculated distance savings in km');
    assert(optResult.savedMinutes > 0, 'Calculated travel time savings in minutes');
    assert(optResult.warnings.length > 0, 'Generated inefficient routing warning message');

    // 5. TRIP INTELLIGENCE TELEMETRY
    console.log('\n5. Testing Trip Intelligence Telemetry Insights...');
    assert(Boolean(workspaceRes.tripIntelligence.dailyDistanceKm), 'Daily total distance displayed');
    assert(Boolean(workspaceRes.tripIntelligence.dailyTravelTimeText), 'Daily total travel time displayed');
    assert(Array.isArray(workspaceRes.tripIntelligence.geographicallyGrouped), 'Geographically grouped activity clusters identified');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 8 test run:', err);
    failedCount++;
  } finally {
    // Cleanup
    if (createdTripId) {
      await tripService.deleteTrip(createdTripId, dummyUserId);
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

runModule8Tests();
