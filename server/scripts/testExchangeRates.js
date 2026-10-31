const assert = require('node:assert/strict');
const { createExchangeRatesService, parseEcbRatesCsv } = require('../services/exchangeRates.service');

const csv = [
  'FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE',
  'D,INR,EUR,SP00,A,2026-10-30,101.25',
  'D,USD,EUR,SP00,A,2026-10-30,1.16',
].join('\n');

const run = async () => {
  const parsed = parseEcbRatesCsv(csv);
  assert.equal(parsed.date, '2026-10-30');
  assert.equal(parsed.rates.EUR, 1);
  assert.equal(parsed.rates.INR, 101.25);
  assert.equal(parsed.rates.USD, 1.16);

  let calls = 0;
  let now = 1000;
  const service = createExchangeRatesService({
    fetchImpl: async () => { calls += 1; return { ok: true, text: async () => csv }; },
    now: () => now,
    ttlMs: 12 * 60 * 60 * 1000,
  });
  assert.deepEqual(await service.getRates(), parsed);
  now += 11 * 60 * 60 * 1000;
  assert.deepEqual(await service.getRates(), parsed);
  assert.equal(calls, 1, 'a cached response is used within 12 hours');
  now += 2 * 60 * 60 * 1000;
  await service.getRates();
  assert.equal(calls, 2, 'a fresh response is fetched after cache expiry');
  await assert.rejects(async () => parseEcbRatesCsv('unexpected,csv\n1,2'), /unexpected CSV format/);
  console.log('ECB exchange-rate parser and 12-hour mocked cache checks passed.');
};

if (require.main === module) run().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { run };
