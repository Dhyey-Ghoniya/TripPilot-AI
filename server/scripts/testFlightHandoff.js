const assert = require('node:assert/strict');
const { buildFlightHandoff } = require('../services/flightHandoff.service');

const dateFromNow = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const run = () => {
  const depart = dateFromNow(30);
  const returns = dateFromNow(35);
  const cases = [
    {
      name: 'one-way city route with spaces',
      input: { origin: 'New Delhi', destination: 'Goa City', departureDate: depart },
      expectedQuery: `Flights from New Delhi to Goa City on ${depart} one way`,
      prefilled: true,
    },
    {
      name: 'round trip, two passengers, business cabin, and IATA codes',
      input: { originAirport: 'AMD', destinationAirport: 'BOM', departureDate: depart, returnDate: returns, travelersCount: 2, cabinClass: 'business' },
      expectedQuery: `Flights from AMD to BOM on ${depart} returning ${returns} 2 passengers business class`,
      prefilled: true,
    },
    {
      name: 'premium economy route',
      input: { origin: 'Rajkot', destination: 'New York', departureDate: depart, cabinClass: 'premium_economy' },
      expectedQuery: `Flights from Rajkot to New York on ${depart} one way premium economy`,
      prefilled: true,
    },
    { name: 'missing departure date falls back to plain link', input: { origin: 'Delhi', destination: 'Paris' }, prefilled: false },
    { name: 'past departure date falls back to plain link', input: { origin: 'Delhi', destination: 'Paris', departureDate: dateFromNow(-1) }, prefilled: false },
  ];

  for (const testCase of cases) {
    const links = buildFlightHandoff(testCase.input).handoffLinks;
    assert.equal(links.length, 6, `${testCase.name}: six providers remain available`);
    const google = links.find((link) => link.providerName === 'Google Flights');
    assert.equal(google.prefilled, testCase.prefilled, testCase.name);
    if (testCase.expectedQuery) {
      const url = new URL(google.url);
      assert.equal(url.origin + url.pathname, 'https://www.google.com/travel/flights');
      assert.equal(url.searchParams.get('q'), testCase.expectedQuery, testCase.name);
      assert.equal(url.searchParams.get('hl'), 'en');
      assert.equal(url.searchParams.get('gl'), 'in');
      assert.equal(url.searchParams.get('curr'), 'INR');
    } else {
      assert.equal(google.url, 'https://www.google.com/travel/flights', testCase.name);
    }
    for (const link of links.filter((item) => item.providerName !== 'Google Flights')) {
      assert.equal(link.prefilled, false, `${testCase.name}: ${link.providerName} stays a plain link`);
      assert.equal(new URL(link.url).search, '', `${testCase.name}: ${link.providerName} has no guessed query parameters`);
    }
  }
  console.log(`Flight handoff checks passed for ${cases.length} cases.`);
};

if (require.main === module) run();
module.exports = { run };
