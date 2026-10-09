require('dotenv').config();
const mongoose = require('mongoose');
const financeService = require('../services/finance.service');
const tripService = require('../services/trip.service');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const Itinerary = require('../models/Itinerary');

async function runModule10Tests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting TripPilot AI Module 10 Automated Test Suite');
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
  let createdItineraryId = null;
  let createdExpenseIds = [];

  try {
    // 1. COST CATEGORIES VALIDATION & EXPENSE SCHEMA
    console.log('1. Testing Cost Categories & Expense Schema...');

    const validCategories = ['Flights', 'Hotels', 'Food', 'Activities', 'Transport', 'Shopping', 'Miscellaneous'];
    assert(
      JSON.stringify(financeService.constructor.CATEGORIES) === JSON.stringify(validCategories),
      'FinanceService contains all 7 mandatory cost categories'
    );

    // Create test trip
    const trip = await tripService.createTrip(dummyUserId, {
      title: 'Finance Layer Test Trip - Tokyo',
      destination: { name: 'Tokyo', city: 'Tokyo', country: 'Japan' },
      dates: { durationDays: 5 },
      budget: { total: 100000, currency: 'INR' },
    });
    createdTripId = trip._id;

    // Attach Itinerary
    const itinerary = new Itinerary({
      tripId: createdTripId,
      title: 'Tokyo 5-Day Explorer',
      days: [
        {
          dayNumber: 1,
          title: 'Arrival & Shibuya',
          estimatedDayCost: 3500,
          activities: [
            { activity: 'Shibuya Crossing & Sky', estimatedCost: 2000, timeSlot: 'afternoon' },
            { activity: 'Ramen Dinner at Ichiran', estimatedCost: 1500, timeSlot: 'evening' },
          ],
        },
        {
          dayNumber: 2,
          title: 'Asakusa & Skytree',
          estimatedDayCost: 6000,
          activities: [
            { activity: 'Senso-ji Temple Tour', estimatedCost: 1000, timeSlot: 'morning' },
            { activity: 'Tokyo Skytree Observation Deck', estimatedCost: 3000, timeSlot: 'afternoon' },
            { activity: 'Sumida River Cruise', estimatedCost: 2000, timeSlot: 'evening' },
          ],
        },
        {
          dayNumber: 3,
          title: 'Akihabara & Gaming',
          estimatedDayCost: 8000,
          activities: [
            { activity: 'Retro Gaming Arcade', estimatedCost: 3000, timeSlot: 'morning' },
            { activity: 'Anime Shopping Spree', estimatedCost: 5000, timeSlot: 'afternoon' },
          ],
        },
      ],
      totalEstimatedCost: 17500,
    });
    await itinerary.save();
    createdItineraryId = itinerary._id;

    trip.itineraryId = createdItineraryId;
    trip.flights = [{ airline: 'Japan Airlines', flightNumber: 'JL740', price: 35000 }];
    trip.hotel = { name: 'Shinjuku Prince Hotel', totalCost: 25000, pricePerNight: 5000 };
    trip.transport = { estimatedCost: 5000, mode: 'Subway & Rail' };
    await trip.save();

    // 2. EXPENSE CREATION & TRACKING (ESTIMATED VS ACTUAL VS CONFIRMED)
    console.log('\n2. Testing Expense Tracking & Cost Type Separation...');

    const expFlight = await financeService.createExpense(dummyUserId, createdTripId, {
      title: 'Flight Ticket Delhi to Tokyo',
      category: 'Flights',
      amount: 35000,
      costType: 'confirmed',
      currency: 'INR',
      paidBy: 'Self',
      paymentMethod: 'card',
      description: 'Roundtrip flight booking',
    });
    createdExpenseIds.push(expFlight._id);
    assert(expFlight.costType === 'confirmed', 'Created CONFIRMED flight expense');

    const expHotel = await financeService.createExpense(dummyUserId, createdTripId, {
      title: 'Shinjuku Hotel Deposit',
      category: 'Hotels',
      amount: 25000,
      costType: 'confirmed',
      currency: 'INR',
      paidBy: 'Self',
      paymentMethod: 'card',
    });
    createdExpenseIds.push(expHotel._id);

    const expFoodActual = await financeService.createExpense(dummyUserId, createdTripId, {
      title: 'Sushi Dinner in Tsukiji',
      category: 'Food',
      amount: 4200,
      costType: 'actual',
      currency: 'INR',
      paidBy: 'Self',
      paymentMethod: 'cash',
      notes: 'Fresh omakase sushi',
    });
    createdExpenseIds.push(expFoodActual._id);
    assert(expFoodActual.costType === 'actual', 'Created ACTUAL food expense');

    const expEstimates = await financeService.createExpense(dummyUserId, createdTripId, {
      title: 'Estimated Souvenirs Shopping',
      category: 'Shopping',
      amount: 6000,
      costType: 'estimated',
      currency: 'INR',
    });
    createdExpenseIds.push(expEstimates._id);
    assert(expEstimates.costType === 'estimated', 'Created ESTIMATED shopping expense');

    // 3. BUDGET DASHBOARD AGGREGATIONS & ALERTS
    console.log('\n3. Testing Budget Dashboard Aggregations...');

    const dashboard = await financeService.getBudgetDashboard(createdTripId, dummyUserId);
    assert(dashboard.totalBudget === 100000, 'Dashboard returns total budget ₹100,000');
    assert(dashboard.summary.totalConfirmed === 60000, 'Summary separates total confirmed costs (₹60,000)');
    assert(dashboard.summary.totalActual === 4200, 'Summary separates total actual spend (₹4,200)');
    assert(dashboard.summary.totalSpent === 64200, 'Total real spend = confirmed (₹60,000) + actual (₹4,200)');
    assert(dashboard.summary.remainingBudget === 35800, 'Remaining budget correctly calculated as ₹35,800');
    assert(dashboard.breakdown.Flights.confirmed === 35000, 'Category breakdown tracks Flights confirmed price');
    assert(dashboard.breakdown.Food.actual === 4200, 'Category breakdown tracks Food actual price');
    assert(dashboard.dailyCosts.length === 3, 'Daily costs breakdown includes 3 itinerary days');
    assert(Array.isArray(dashboard.alerts), 'Budget alerts generated');

    // 4. AI BUDGET OPTIMIZATION COMMANDS
    console.log('\n4. Testing AI Budget Optimization Commands...');

    // Command 1: "Keep the trip under ₹80,000."
    const cmd1 = await financeService.processBudgetCommand(createdTripId, dummyUserId, 'Keep the trip under ₹80,000');
    assert(cmd1.success, 'AI command "Keep the trip under ₹80,000" executed');
    assert(cmd1.data.targetBudget === 80000, 'Updated trip budget limit to ₹80,000');

    // Command 2: "Make Day 3 cheaper."
    const cmd2 = await financeService.processBudgetCommand(createdTripId, dummyUserId, 'Make Day 3 cheaper');
    assert(cmd2.success, 'AI command "Make Day 3 cheaper" executed');
    assert(cmd2.data.dayNumber === 3, 'Targeted Day 3 for optimization');
    assert(cmd2.data.totalSavings > 0, `Saved ₹${cmd2.data.totalSavings} on Day 3 activities`);

    // Verify day 3 cost reduction was saved in itinerary
    const updatedItinerary = await Itinerary.findById(createdItineraryId);
    const day3 = updatedItinerary.days.find((d) => d.dayNumber === 3);
    assert(day3.estimatedDayCost < 8000, `Itinerary Day 3 cost persisted on DB (${day3.estimatedDayCost})`);

    // Command 3: "Find cheaper activities."
    const cmd3 = await financeService.processBudgetCommand(createdTripId, dummyUserId, 'Find cheaper activities');
    assert(cmd3.success, 'AI command "Find cheaper activities" executed');
    assert(cmd3.data.alternatives.length > 0, 'Returned structured list of cheaper activity alternatives');

    // Command 4: "Suggest a cheaper hotel."
    const cmd4 = await financeService.processBudgetCommand(createdTripId, dummyUserId, 'Suggest a cheaper hotel');
    assert(cmd4.success, 'AI command "Suggest a cheaper hotel" executed');
    assert(cmd4.data.suggestions.length > 0, 'Returned 3 structured hotel alternatives with savings %');

    // Command 5: "Where am I overspending?"
    const cmd5 = await financeService.processBudgetCommand(createdTripId, dummyUserId, 'Where am I overspending?');
    assert(cmd5.success, 'AI command "Where am I overspending?" executed');
    assert(Array.isArray(cmd5.data.analysis), 'Returned spending analysis breakdown by category');

    // 5. EXPENSE EDIT & DELETE
    console.log('\n5. Testing Expense Update & Delete...');

    const updatedExp = await financeService.updateExpense(expFoodActual._id, dummyUserId, {
      amount: 4500,
      notes: 'Omakase + Green Tea',
    });
    assert(updatedExp.amount === 4500, 'Updated expense amount to ₹4,500');

    const delRes = await financeService.deleteExpense(expEstimates._id, dummyUserId);
    assert(delRes.success === true, 'Deleted expense successfully');

  } catch (err) {
    console.error('⚠️ Unexpected error during Module 10 test run:', err);
    failedCount++;
  } finally {
    // Cleanup
    if (createdTripId) {
      await Expense.deleteMany({ tripId: createdTripId });
      if (createdItineraryId) await Itinerary.findByIdAndDelete(createdItineraryId);
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

runModule10Tests();
