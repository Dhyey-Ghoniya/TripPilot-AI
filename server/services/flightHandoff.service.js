const PROVIDERS = [
  // TODO: Confirm a documented Google Flights search URL before adding parameters.
  { providerName: 'Google Flights', url: 'https://www.google.com/travel/flights' },
  // TODO: Skyscanner's public help describes its form, but not a stable URL parameter format.
  { providerName: 'Skyscanner', url: 'https://www.skyscanner.co.in/flights' },
  // TODO: Confirm a documented MakeMyTrip deep-link format before adding parameters.
  { providerName: 'MakeMyTrip', url: 'https://www.makemytrip.com/flights/' },
  // TODO: Cleartrip's public page confirms the search form, but not a stable deep-link format.
  { providerName: 'Cleartrip', url: 'https://www.cleartrip.com/flights' },
  // TODO: Confirm a documented ixigo search URL format before adding parameters.
  { providerName: 'Ixigo', url: 'https://www.ixigo.com/flights' },
  // TODO: Confirm a documented Trip.com search URL format before adding parameters.
  { providerName: 'Trip.com', url: 'https://www.trip.com/flights/' },
];

const normalizeLocation = (value) => {
  return String(value || '').trim().slice(0, 120);
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const date = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
};

const normalizeTravelers = (searchParams) => {
  const rawCount = searchParams.travelersCount ?? searchParams.passengers?.adults ?? searchParams.travelers?.count ?? 1;
  const count = Number.parseInt(rawCount, 10);
  return Number.isFinite(count) ? Math.max(1, Math.min(9, count)) : 1;
};

const buildFlightHandoff = (searchParams = {}) => {
  const origin = normalizeLocation(searchParams.originAirport || searchParams.origin || searchParams.from);
  const destination = normalizeLocation(searchParams.destinationAirport || searchParams.destination || searchParams.to);
  const departureDate = normalizeDate(searchParams.departureDate || searchParams.departDate);
  const returnDate = normalizeDate(searchParams.returnDate);
  const travelersCount = normalizeTravelers(searchParams);
  const supportedCabins = new Set(['economy', 'premium_economy', 'business', 'first']);
  const requestedCabin = String(searchParams.cabinClass || 'economy').toLowerCase();
  const cabinClass = supportedCabins.has(requestedCabin) ? requestedCabin : 'economy';

  return {
    searchParams: {
      origin,
      destination,
      departureDate,
      returnDate,
      travelersCount,
      cabinClass,
    },
    handoffLinks: PROVIDERS.map(({ providerName, url }) => ({ providerName, url, prefilled: false })),
  };
};

module.exports = { buildFlightHandoff };
