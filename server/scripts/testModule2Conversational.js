/**
 * Test Suite for Module 2: Conversational Requirement Collection & Intent Recognition
 * Verifies all 6 core acceptance scenarios specified in Module 2.
 */

const mongoose = require('mongoose');
const aiSessionService = require('../services/aiSession.service');
const AiSession = require('../models/AiSession');
const Trip = require('../models/Trip');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trippilot';

async function runModule2Tests() {
  console.log('====================================================');
  console.log('  TRIPPILOT AI — MODULE 2 CONVERSATIONAL TEST SUITE ');
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.\n');

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 1: Step-by-Step Requirement Collection (Multi-Turn)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ SCENARIO 1: Step-by-Step Requirement Collection');
    const session1Id = `mod2_test_stepbystep_${Date.now()}`;

    // Turn 1
    console.log('  User: "I want to visit Japan."');
    const t1 = await aiSessionService.handleUserMessage(session1Id, 'I want to visit Japan.');
    console.log(`  AI: "${t1.orchestratorResult.copilotMessage}"`);
    console.log(`  Session State: Destination=${t1.session.draftRequirements?.destination}, LastAsked=${t1.session.lastAskedField}\n`);

    // Turn 2
    console.log('  User: "Ahmedabad, India."');
    const t2 = await aiSessionService.handleUserMessage(session1Id, 'Ahmedabad, India.');
    console.log(`  AI: "${t2.orchestratorResult.copilotMessage}"`);
    console.log(`  Session State: Origin=${t2.session.draftRequirements?.origin}, LastAsked=${t2.session.lastAskedField}\n`);

    // Turn 3
    console.log('  User: "Seven days."');
    const t3 = await aiSessionService.handleUserMessage(session1Id, 'Seven days.');
    console.log(`  AI: "${t3.orchestratorResult.copilotMessage}"`);
    console.log(`  Session State: Duration=${t3.session.draftRequirements?.durationDays}, LastAsked=${t3.session.lastAskedField}\n`);

    // Turn 4
    console.log('  User: "December, but I haven\'t decided the exact dates."');
    const t4 = await aiSessionService.handleUserMessage(session1Id, "December, but I haven't decided the exact dates.");
    console.log(`  AI: "${t4.orchestratorResult.copilotMessage}"`);
    console.log(`  Session State: Month=${t4.session.draftRequirements?.travelMonth}, LastAsked=${t4.session.lastAskedField}\n`);

    // Turn 5
    console.log('  User: "Around ₹1,00,000 for two people."');
    const t5 = await aiSessionService.handleUserMessage(session1Id, 'Around ₹1,00,000 for two people.');
    console.log(`  AI: "${t5.orchestratorResult.copilotMessage}"`);
    console.log(`  Status: ${t5.session.status} | Trip ID: ${t5.session.tripId}\n`);

    if (t5.session.status === 'completed' && t5.session.tripId) {
      console.log('  ✅ SCENARIO 1 PASSED: Successfully collected all requirements turn-by-turn and generated trip!\n');
    } else {
      throw new Error('Scenario 1 Failed: Trip was not generated after complete requirements.');
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 2: Single-Turn Complete Prompt (No Re-asking)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ SCENARIO 2: Single-Turn Complete Prompt');
    const session2Id = `mod2_test_singleturn_${Date.now()}`;
    const singleMsg = 'Plan a seven-day trip to Japan from Ahmedabad for two people in December with a budget of ₹1,00,000.';

    console.log(`  User: "${singleMsg}"`);
    const stRes = await aiSessionService.handleUserMessage(session2Id, singleMsg);
    console.log(`  AI: "${stRes.orchestratorResult.copilotMessage}"`);
    console.log(`  Status: ${stRes.session.status} | Trip ID: ${stRes.session.tripId}`);

    if (stRes.session.status === 'completed' && stRes.session.tripId) {
      console.log('  ✅ SCENARIO 2 PASSED: Extracted all parameters upfront and created trip without asking redundant questions!\n');
    } else {
      throw new Error('Scenario 2 Failed: Did not complete trip on single comprehensive message.');
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 3: Changing an Earlier Answer
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ SCENARIO 3: Changing an Earlier Answer');
    const session3Id = `mod2_test_change_${Date.now()}`;

    await aiSessionService.handleUserMessage(session3Id, 'I want to visit Tokyo.');
    await aiSessionService.handleUserMessage(session3Id, 'From Delhi.');
    const chg1 = await aiSessionService.handleUserMessage(session3Id, '5 days.');
    console.log(`  Initial Duration: ${chg1.session.draftRequirements?.durationDays} days`);

    console.log('  User: "Actually, make it 10 days."');
    const chg2 = await aiSessionService.handleUserMessage(session3Id, 'Actually, make it 10 days.');
    console.log(`  Updated Duration: ${chg2.session.draftRequirements?.durationDays} days`);

    if (chg2.session.draftRequirements?.durationDays === 10) {
      console.log('  ✅ SCENARIO 3 PASSED: Successfully updated earlier requirement!\n');
    } else {
      throw new Error('Scenario 3 Failed: Duration was not updated to 10 days.');
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 4: User saying "You decide" (Proceed with Defaults)
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ SCENARIO 4: User Saying "You decide"');
    const session4Id = `mod2_test_defaults_${Date.now()}`;

    await aiSessionService.handleUserMessage(session4Id, 'I want to visit Switzerland.');
    console.log('  User: "You decide the rest."');
    const defRes = await aiSessionService.handleUserMessage(session4Id, 'You decide the rest.');
    console.log(`  AI: "${defRes.orchestratorResult.copilotMessage}"`);

    if (defRes.session.status === 'completed' && defRes.session.tripId) {
      console.log('  ✅ SCENARIO 4 PASSED: Generated trip with reasonable defaults when requested!\n');
    } else {
      throw new Error('Scenario 4 Failed: Did not proceed with defaults.');
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 5: User Asking to "Start over"
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ SCENARIO 5: User Asking to "Start over"');
    const session5Id = `mod2_test_reset_${Date.now()}`;

    await aiSessionService.handleUserMessage(session5Id, 'I want to visit Rome.');
    const rst1 = await aiSessionService.handleUserMessage(session5Id, 'From Mumbai.');
    console.log(`  Draft Destination before reset: ${rst1.session.draftRequirements?.destination}`);

    console.log('  User: "Start over"');
    const rst2 = await aiSessionService.handleUserMessage(session5Id, 'Start over');
    console.log(`  AI: "${rst2.orchestratorResult.copilotMessage}"`);
    console.log(`  Draft Destination after reset: "${rst2.session.draftRequirements?.destination || ''}"`);

    if (!rst2.session.draftRequirements?.destination && rst2.session.status === 'active') {
      console.log('  ✅ SCENARIO 5 PASSED: Successfully cleared requirements draft and reset session!\n');
    } else {
      throw new Error('Scenario 5 Failed: Session state was not reset.');
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 6: Session State Persistence Across Refresh
    // ─────────────────────────────────────────────────────────────────
    console.log('▶ SCENARIO 6: Session State Persistence (Browser Refresh Simulation)');
    const session6Id = `mod2_test_persist_${Date.now()}`;

    // Step 1: User sends destination
    await aiSessionService.handleUserMessage(session6Id, 'I want to visit London.');
    await aiSessionService.handleUserMessage(session6Id, 'From Ahmedabad.');

    // Simulate Page Refresh / New Request by fetching session directly from DB
    console.log('  Simulating browser refresh — re-fetching session from MongoDB...');
    const reloadedSession = await AiSession.findOne({ sessionId: session6Id });
    console.log(`  Persisted Destination: ${reloadedSession.draftRequirements?.destination}`);
    console.log(`  Persisted Origin: ${reloadedSession.draftRequirements?.origin}`);
    console.log(`  Persisted Last Asked: ${reloadedSession.lastAskedField}`);

    // Continue conversation on reloaded session
    console.log('  User sends next answer: "5 days."');
    const contRes = await aiSessionService.handleUserMessage(session6Id, '5 days.');

    if (
      contRes.session.draftRequirements?.destination === 'London' &&
      contRes.session.draftRequirements?.origin === 'Ahmedabad' &&
      contRes.session.draftRequirements?.durationDays === 5
    ) {
      console.log('  ✅ SCENARIO 6 PASSED: Session state perfectly persisted across request cycles!\n');
    } else {
      throw new Error('Scenario 6 Failed: Session state was lost across reloads.');
    }

    console.log('====================================================');
    console.log('   ALL 6 MODULE 2 CONVERSATIONAL SCENARIOS PASSED!  ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ MODULE 2 TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runModule2Tests();
