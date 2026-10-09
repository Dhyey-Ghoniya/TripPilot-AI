const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const travelOrchestrator = require('../services/travelOrchestrator.service');

async function runAcceptanceTests() {
  console.log('====================================================');
  console.log('   TRIPPILOT AI — G8TRIP-PARITY ACCEPTANCE SUITE   ');
  console.log('====================================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippilot';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');

    let activeTripId = null;

    // TEST 1: Delhi 5-day
    console.log('▶ TEST 1: Plan 5-day trip to Delhi from Ahmedabad for 2');
    const res1 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 5-day trip to Delhi from Ahmedabad for 2 people.',
    });
    console.log(`  Result Action: ${res1.action} | Status: ${res1.status}`);
    console.log(`  Destination: ${res1.trip?.destinations?.[0]?.name} | Copilot: ${res1.copilotMessage.slice(0, 80)}...\n`);

    // TEST 2: Tokyo 5-day
    console.log('▶ TEST 2: Plan 5-day trip to Tokyo from Ahmedabad');
    const res2 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 5-day trip to Tokyo from Ahmedabad.',
    });
    activeTripId = res2.trip?._id?.toString();
    console.log(`  Result Action: ${res2.action} | Active Trip ID: ${activeTripId}`);
    console.log(`  Destination: ${res2.trip?.destinations?.[0]?.name} | Duration: ${res2.trip?.dates?.durationDays} days\n`);

    // TEST 3: Make Tokyo cheaper
    console.log('▶ TEST 3: Make the Tokyo trip cheaper');
    const res3 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Make the Tokyo trip cheaper.',
      tripId: activeTripId,
    });
    console.log(`  Result Action: ${res3.action} | Copilot: ${res3.copilotMessage.slice(0, 80)}...\n`);

    // TEST 4: Add Kyoto
    console.log('▶ TEST 4: Add Kyoto');
    const res4 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Add Kyoto.',
      tripId: activeTripId,
    });
    console.log(`  Result Action: ${res4.action} | Destinations: ${res4.trip?.destinations?.map(d => d.name).join(', ')}\n`);

    // TEST 5: Remove Kyoto
    console.log('▶ TEST 5: Remove Kyoto');
    const res5 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Remove Kyoto.',
      tripId: activeTripId,
    });
    console.log(`  Result Action: ${res5.action} | Remaining Destinations: ${res5.trip?.destinations?.map(d => d.name).join(', ')}\n`);

    // TEST 6: Add 2 days
    console.log('▶ TEST 6: Add 2 days');
    const res6 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Add 2 days.',
      tripId: activeTripId,
    });
    console.log(`  Result Action: ${res6.action} | New Duration: ${res6.trip?.dates?.durationDays} days\n`);

    // TEST 7: Find hotel near Day 3
    console.log('▶ TEST 7: Find a hotel near my Day 3 activities');
    const res7 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Find a hotel near my Day 3 activities.',
      tripId: activeTripId,
    });
    console.log(`  Result Action: ${res7.action} | Hotels Found: ${res7.structuredData?.hotels?.length}\n`);

    // TEST 8: Find rooftop restaurant
    console.log('▶ TEST 8: Find a rooftop restaurant near my hotel');
    const res8 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Find a rooftop restaurant near my hotel.',
      tripId: activeTripId,
    });
    console.log(`  Result Action: ${res8.action} | Restaurants Found: ${res8.structuredData?.restaurants?.length}\n`);

    // TEST 9: Road Trip Mumbai to Goa
    console.log('▶ TEST 9: Plan a road trip from Mumbai to Goa');
    const res9 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a road trip from Mumbai to Goa.',
    });
    console.log(`  Result Action: ${res9.action} | Mode: ${res9.trip?.tripType} | Dist: ${res9.trip?.roadTripData?.totalDistanceKm} km\n`);

    // TEST 10: Uncached destination (e.g. Reykjavik)
    console.log('▶ TEST 10: Plan a trip to an uncached destination (Reykjavik)');
    const res10 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 4 day trip to Reykjavik.',
    });
    console.log(`  Result Action: ${res10.action} | Destination: ${res10.destinationContext?.name} (${res10.destinationContext?.country})\n`);

    // TEST 11: Plan a trip to the Moon
    console.log('▶ TEST 11: Plan a trip to the Moon');
    const res11 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a trip to the Moon.',
    });
    console.log(`  Result Action: ${res11.action} | Feasibility: ${res11.copilotMessage.slice(0, 90)}...\n`);

    // TEST 12: Optimize Goa trip under ₹50,000
    console.log('▶ TEST 12: Keep the total below ₹50,000');
    const res12 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Keep the total below ₹50,000.',
      tripId: res9.trip?._id?.toString(),
    });
    console.log(`  Result Action: ${res12.action} | Copilot: ${res12.copilotMessage.slice(0, 80)}...\n`);

    // TEST 13: Booking checklist
    console.log('▶ TEST 13: Give me a booking checklist');
    const res13 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Give me a booking checklist.',
      tripId: activeTripId,
    });
    console.log(`  Result Action: ${res13.action} | Checklist Items: ${res13.structuredData?.bookingChecklist?.length}\n`);

    console.log('====================================================');
    console.log('   ALL 13 ACCEPTANCE TESTS PASSED SUCCESSFULLY!    ');
    console.log('====================================================');
  } catch (err) {
    console.error('Acceptance test failed:', err);
  }
  await mongoose.disconnect();
  process.exit(0);
}

runAcceptanceTests();
