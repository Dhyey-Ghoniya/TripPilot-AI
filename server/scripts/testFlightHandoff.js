const assert = require('node:assert/strict');
const { buildFlightHandoff } = require('../services/flightHandoff.service');

const cases = [
  {
    name: 'domestic one-way city route',
    input: { origin: 'Rajkot', destination: 'Goa', departureDate: '2026-11-01', travelersCount: 2, cabinClass: 'economy' },
    expected: { origin: 'Rajkot', destination: 'Goa', departureDate: '2026-11-01', returnDate: null, travelersCount: 2, cabinClass: 'economy' },
  },
  {
    name: 'domestic return airport route',
    input: { originAirport: 'AMD', destinationAirport: 'BOM', departureDate: '2026-12-10', returnDate: '2026-12-16', passengers: { adults: 3 }, cabinClass: 'business' },
    expected: { origin: 'AMD', destination: 'BOM', departureDate: '2026-12-10', returnDate: '2026-12-16', travelersCount: 3, cabinClass: 'business' },
  },
  {
    name: 'international one-way route',
    input: { from: 'LHR', to: 'Tokyo', departDate: '2027-01-04', travelers: { count: 1 }, cabinClass: 'premium_economy' },
    expected: { origin: 'LHR', destination: 'Tokyo', departureDate: '2027-01-04', returnDate: null, travelersCount: 1, cabinClass: 'premium_economy' },
  },
  {
    name: 'international return route',
    input: { origin: 'Delhi', destination: 'New York', departureDate: '2027-02-01', returnDate: '2027-02-12', travelersCount: 4, cabinClass: 'first' },
    expected: { origin: 'Delhi', destination: 'New York', departureDate: '2027-02-01', returnDate: '2027-02-12', travelersCount: 4, cabinClass: 'first' },
  },
];

const run = () => {
  for (const testCase of cases) {
    const result = buildFlightHandoff(testCase.input);
    assert.deepEqual(result.searchParams, testCase.expected, testCase.name);
    assert.equal(result.handoffLinks.length, 6, `${testCase.name}: provider count`);
    assert.ok(result.handoffLinks.every((link) => link.prefilled === false), `${testCase.name}: no URL format was confirmed`);
    assert.ok(result.handoffLinks.every((link) => !new URL(link.url).search), `${testCase.name}: links should be plain provider pages`);
  }
  console.log(`Flight handoff checks passed for ${cases.length} domestic and international route cases.`);
};

if (require.main === module) run();
module.exports = { run };
