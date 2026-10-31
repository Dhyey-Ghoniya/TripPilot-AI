const assert = require('node:assert/strict');
const llmChat = require('../services/llmChat.service');
const planningBrief = require('../services/planningBrief.service');

async function run() {
  const originalFetch = global.fetch;
  const originalEnv = {
    provider: process.env.LLM_PROVIDER,
    key: process.env.GOOGLE_API_KEY,
  };
  process.env.LLM_PROVIDER = 'google';
  process.env.GOOGLE_API_KEY = 'mock-test-key';

  try {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        intent: 'PLAN',
        params: {
          destination: 'Bali', origin: 'Mumbai', durationDays: 7,
          travelersCount: 2, budget: 200000, currency: 'INR',
          travelMonth: 'March', interests: ['warm beaches'],
        },
        reply: '',
      }) }] } }] }),
    });
    const result = await llmChat.interpretPlanningTurn({ message: 'Somewhere warm with my wife, maybe Bali for a week from Mumbai in March, around 2 lakh' });
    const merged = planningBrief.mergeAndRecompute({ params: {}, missingFields: [], lastAskedField: 'destination', isReadyToPlan: false, copilotMessage: 'Where would you like to go?' }, result);
    assert.equal(merged.params.destination, 'Bali');
    assert.equal(merged.params.travelersCount, 2);
    assert.equal(merged.isReadyToPlan, true);

    const ruleBasedFallback = { params: { destination: 'Rome' }, isReadyToPlan: false };
    global.fetch = async () => ({ ok: false, status: 400, text: async () => 'mock request failure' });
    const failedTurn = await llmChat.interpretPlanningTurn({ message: 'Plan a trip' });
    assert.equal(failedTurn, null);
    assert.deepEqual(ruleBasedFallback, { params: { destination: 'Rome' }, isReadyToPlan: false });

    const invalid = planningBrief.normalizeLlmParams({
      destination: 'D'.repeat(81), durationDays: 9999, travelersCount: 51,
      budget: -1, currency: 'XYZ', interests: ['museum', 'I'.repeat(81)],
    });
    assert.deepEqual(invalid, { interests: ['museum'] });
    console.log('Planning LLM success, failure fallback, and invalid-value checks passed.');
  } finally {
    global.fetch = originalFetch;
    if (originalEnv.provider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = originalEnv.provider;
    if (originalEnv.key === undefined) delete process.env.GOOGLE_API_KEY;
    else process.env.GOOGLE_API_KEY = originalEnv.key;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
