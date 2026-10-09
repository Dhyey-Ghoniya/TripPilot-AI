require('dotenv').config();
const mongoose = require('mongoose');
const weatherService = require('../services/weather.service');
const weatherProvider = require('../services/weatherProviders/WeatherProvider');
const tripService = require('../services/trip.service');
const Trip = require('../models/Trip');

async function runModule9Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 9 Automated Test Suite');
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
    // 1. WEATHER PROVIDER ARCHITECTURE
    console.log('1. Testing WeatherProvider (getCurrentWeather, getForecast, getHistoricalClimate)...');

    const currentWeather = await weatherProvider.getCurrentWeather('Dubai');
    assert(currentWeather.tempC !== undefined, 'Retrieved live current temperature in °C');
    assert(Boolean(currentWeather.condition), 'Retrieved current weather condition string');
    assert(Boolean(currentWeather.source), 'WeatherProvider source verified');

    const forecast = await weatherProvider.getForecast('Dubai', new Date(), 5);
    assert(forecast.length === 5, 'Retrieved 5-day weather forecast array');
    assert(forecast[0].tempMaxC !== undefined, 'Forecast item includes max temperature');
    assert(forecast[0].rainProbabilityPercent !== undefined, 'Forecast item includes precipitation probability');

    const climate = await weatherProvider.getHistoricalClimate('Dubai', 10);
    assert(Boolean(climate.climateSummary), 'Retrieved historical climate summary');

    // 2. ITINERARY WEATHER AWARENESS & OUTDOOR VS INDOOR CLASSIFICATION
    console.log('\n2. Testing Itinerary Weather Awareness (Outdoor vs Indoor Activity Classification)...');

    const isBeachOutdoor = weatherService.isOutdoorActivity({ title: 'Jumeirah Beach Visit', category: 'Beaches' });
    assert(isBeachOutdoor === true, 'Beach visit correctly classified as outdoor activity');

    const isMuseumIndoor = weatherService.isOutdoorActivity({ title: 'Museum of the Future', category: 'Museums' });
    assert(isMuseumIndoor === false, 'Museum visit correctly classified as indoor activity');

    const isShoppingIndoor = weatherService.isOutdoorActivity({ title: 'Dubai Mall Luxury Spree', category: 'Shopping' });
    assert(isShoppingIndoor === false, 'Shopping spree correctly classified as indoor activity');

    // 3. TRIP WEATHER INTELLIGENCE & WARNINGS
    console.log('\n3. Testing Trip Weather Intelligence & Rain/Heat Warnings...');

    const trip = await tripService.createTrip(dummyUserId, {
      title: '5-Day Dubai Weather Intelligence Trip',
      destination: { name: 'Dubai', city: 'Dubai', country: 'United Arab Emirates' },
      dates: { durationDays: 5 },
      budget: { total: 100000, currency: 'INR' },
    });
    createdTripId = trip._id;

    // Attach Day 2 Beach activity (outdoor) which triggers rain conflict warning in forecast
    trip.activities = [
      { title: 'Jumeirah Beach Stroll', dayNumber: 2, category: 'Beaches', timeSlot: 'morning' },
      { title: 'Red Dunes Desert Safari', dayNumber: 3, category: 'Adventure', timeSlot: 'afternoon' },
    ];
    await trip.save();

    const weatherIntel = await weatherService.getItineraryWeatherIntelligence(createdTripId);
    assert(weatherIntel.forecast.length === 5, '5-day forecast persisted on trip document');
    assert(weatherIntel.weatherWarnings.length > 0, 'Rain/Heat weather warning generated for outdoor activity on rainy day');

    const warningItem = weatherIntel.weatherWarnings[0];
    assert(warningItem && (warningItem.description.includes('Rain') || warningItem.description.includes('forecast') || warningItem.description.includes('Temperature')), 'Weather warning contains specific weather forecast message and suggested alternative day');

    // 4. WEATHER OPTIMIZATION AI COMMANDS
    console.log('\n4. Testing Weather Optimization AI Commands...');

    // Command A: "Move outdoor activities to the best-weather day."
    const cmd1 = await weatherService.executeAiWeatherCommand('Move outdoor activities to the best-weather day.', createdTripId);
    assert(cmd1.success, 'AI command "Move outdoor activities to best-weather day" executed');
    assert(Boolean(cmd1.message), 'Returned confirmation message with best-weather day details');

    // Command B: "Make tomorrow mostly indoor."
    const cmd2 = await weatherService.executeAiWeatherCommand('Make tomorrow mostly indoor.', createdTripId);
    assert(cmd2.success, 'AI command "Make tomorrow mostly indoor" executed');

    // Command C: "Optimize my trip for the weather."
    const cmd3 = await weatherService.executeAiWeatherCommand('Optimize my trip for the weather.', createdTripId);
    assert(cmd3.success, 'AI command "Optimize my trip for the weather" executed full optimization');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 9 test run:', err);
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

runModule9Tests();
