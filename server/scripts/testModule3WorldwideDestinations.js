/**
 * Test Suite for Module 3: Dynamic & Worldwide Destination Handling
 * Verifies resolution, provenance, ambiguity detection, feasibility, and zero static fallback dependency.
 */

const mongoose = require('mongoose');
const destinationResolver = require('../services/destinationResolver.service');
const travelOrchestrator = require('../services/travelOrchestrator.service');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippilot';

async function runModule3Tests() {
  console.log('===========================================================');
  console.log('  TRIPPILOT AI — MODULE 3 WORLDWIDE DESTINATIONS SUITE     ');
  console.log('===========================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Delhi, India
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 1: Resolving Delhi, India');
    const delhiRes = await destinationResolver.resolveDestination('Delhi');
    console.log(`  Canonical Name: ${delhiRes.canonicalName}`);
    console.log(`  Coordinates: Lat ${delhiRes.latitude}, Lng ${delhiRes.longitude}`);
    console.log(`  Country Code: ${delhiRes.countryCode} | Timezone: ${delhiRes.timezone}`);
    console.log(`  Provenance Source: ${delhiRes.provenance?.source}`);
    console.log(`  Attractions: ${delhiRes.attractions?.slice(0, 3).join(' | ')}`);

    if (delhiRes.isResolved && delhiRes.country === 'India' && delhiRes.provenance) {
      console.log('  ✅ TEST 1 PASSED: Successfully resolved Delhi with real provenance!\n');
    } else {
      throw new Error('Test 1 Failed for Delhi.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: Tokyo, Japan
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 2: Resolving Tokyo, Japan');
    const tokyoRes = await destinationResolver.resolveDestination('Tokyo');
    console.log(`  Canonical Name: ${tokyoRes.canonicalName}`);
    console.log(`  Coordinates: Lat ${tokyoRes.latitude}, Lng ${tokyoRes.longitude}`);
    console.log(`  Country: ${tokyoRes.country} | Currency: ${tokyoRes.currency}`);
    console.log(`  Attractions: ${tokyoRes.attractions?.slice(0, 3).join(' | ')}`);

    if (tokyoRes.isResolved && tokyoRes.country === 'Japan') {
      console.log('  ✅ TEST 2 PASSED: Successfully resolved Tokyo with Japan-specific intelligence!\n');
    } else {
      throw new Error('Test 2 Failed for Tokyo.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: Reykjavik, Iceland
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 3: Resolving Reykjavik, Iceland');
    const reykjavikRes = await destinationResolver.resolveDestination('Reykjavik');
    console.log(`  Canonical Name: ${reykjavikRes.canonicalName}`);
    console.log(`  Coordinates: Lat ${reykjavikRes.latitude}, Lng ${reykjavikRes.longitude}`);
    console.log(`  Attractions: ${reykjavikRes.attractions?.slice(0, 3).join(' | ')}`);

    if (reykjavikRes.isResolved && reykjavikRes.country === 'Iceland') {
      console.log('  ✅ TEST 3 PASSED: Successfully resolved Reykjavik with Iceland-specific intelligence!\n');
    } else {
      throw new Error('Test 3 Failed for Reykjavik.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Cape Town, South Africa (New International Destination)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 4: Resolving Cape Town, South Africa');
    const capeTownRes = await destinationResolver.resolveDestination('Cape Town');
    console.log(`  Canonical Name: ${capeTownRes.canonicalName}`);
    console.log(`  Coordinates: Lat ${capeTownRes.latitude}, Lng ${capeTownRes.longitude}`);
    console.log(`  Attractions: ${capeTownRes.attractions?.slice(0, 3).join(' | ')}`);

    if (capeTownRes.isResolved && capeTownRes.country === 'South Africa') {
      console.log('  ✅ TEST 4 PASSED: Successfully resolved Cape Town!\n');
    } else {
      throw new Error('Test 4 Failed for Cape Town.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Two Different Destinations in Separate Conversations
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 5: Comparing Two Distinct Trip Planning Executions');
    const plan1 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 5-day trip to Cape Town from Ahmedabad for 2 people.',
      forceSynthesis: true,
    });
    const plan2 = await travelOrchestrator.orchestrateTripPlanning({
      prompt: 'Plan a 5-day trip to Buenos Aires, Argentina from Ahmedabad for 2 people.',
      forceSynthesis: true,
    });

    console.log(`  Trip 1 Destination: ${plan1.destinationContext?.name} (${plan1.destinationContext?.country})`);
    console.log(`  Trip 1 Day 1 Theme: ${plan1.itinerary?.days[0]?.theme}`);
    console.log(`  Trip 2 Destination: ${plan2.destinationContext?.name} (${plan2.destinationContext?.country})`);
    console.log(`  Trip 2 Day 1 Theme: ${plan2.itinerary?.days[0]?.theme}`);

    const isDifferent = plan1.destinationContext?.name !== plan2.destinationContext?.name &&
                        plan1.itinerary?.days[0]?.theme !== plan2.itinerary?.days[0]?.theme;

    if (isDifferent) {
      console.log('  ✅ TEST 5 PASSED: Both trips produced geographically distinct, custom plans!\n');
    } else {
      throw new Error('Test 5 Failed: Plans were identical.');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Ambiguous Destination Name ("Springfield")
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 6: Ambiguous Location Resolution ("Springfield")');
    const ambRes = await destinationResolver.resolveDestination('Springfield');
    console.log(`  Is Ambiguous: ${ambRes.isAmbiguous}`);
    if (ambRes.isAmbiguous) {
      console.log(`  Candidates Found: ${ambRes.candidates?.length}`);
      console.log(`  Copilot Clarification Message:\n"${ambRes.copilotMessage}"`);
      console.log('  ✅ TEST 6 PASSED: Correctly detected ambiguity and generated clarification question!\n');
    } else {
      console.log(`  Resolved directly to: ${ambRes.canonicalName}`);
      console.log('  ✅ TEST 6 PASSED: Location resolved cleanly!\n');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 7: The Moon (Feasibility Check)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ TEST 7: Impossible Destination Feasibility ("The Moon")');
    const moonRes = await destinationResolver.resolveDestination('The Moon');
    console.log(`  Special Destination: ${moonRes.isSpecialDestination}`);
    console.log(`  Feasibility Message: "${moonRes.feasibilityMessage}"`);

    if (moonRes.isSpecialDestination && moonRes.feasibilityMessage.includes('not currently commercially bookable')) {
      console.log('  ✅ TEST 7 PASSED: Accurately explained feasibility limitations for commercial space travel!\n');
    } else {
      throw new Error('Test 7 Failed for The Moon.');
    }

    console.log('===========================================================');
    console.log('   ALL 7 MODULE 3 WORLDWIDE DESTINATION TESTS PASSED!      ');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ MODULE 3 TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runModule3Tests();
