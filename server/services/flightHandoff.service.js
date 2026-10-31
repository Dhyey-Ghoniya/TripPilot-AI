const PROVIDERS = [
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

const isValidDate = (value) => {
  if (!value) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const buildGoogleFlightsLink = ({ origin, destination, departureDate, returnDate, travelersCount, cabinClass }) => {
  const plainUrl = 'https://www.google.com/travel/flights';
  const today = new Date().toISOString().slice(0, 10);
  if (!origin || !destination || !isValidDate(departureDate) || departureDate < today) {
    return { providerName: 'Google Flights', url: plainUrl, prefilled: false };
  }

  const originCode = String(origin).trim().toUpperCase();
  const destinationCode = String(destination).trim().toUpperCase();
  const routeOrigin = /^[A-Z]{3}$/.test(originCode) ? originCode : origin;
  const routeDestination = /^[A-Z]{3}$/.test(destinationCode) ? destinationCode : destination;
  let query = `Flights from ${routeOrigin} to ${routeDestination} on ${departureDate}`;
  if (isValidDate(returnDate) && returnDate >= departureDate) query += ` returning ${returnDate}`;
  else query += ' one way';
  if (travelersCount > 1) query += ` ${travelersCount} passengers`;
  const cabinSuffix = {
    business: ' business class',
    first: ' first class',
    premium_economy: ' premium economy',
  }[cabinClass];
  if (cabinSuffix) query += cabinSuffix;

  // This unofficial Google Flights query format is widely used but may stop working; the plain link is the fallback.
  return {
    providerName: 'Google Flights',
    url: `${plainUrl}?q=${encodeURIComponent(query)}&hl=en&gl=in&curr=INR`,
    prefilled: true,
  };
};

const buildFlightHandoff = (searchParams = {}) => {
  const locationValue = (airport, city, fallback) => {
    if (airport && typeof airport === 'object') {
      return normalizeLocation(airport.iataCode || airport.code || airport.city || airport.name || city || fallback);
    }
    return normalizeLocation(airport || city || fallback);
  };
  const origin = locationValue(searchParams.originAirport, searchParams.origin || searchParams.from, '');
  const destination = locationValue(searchParams.destinationAirport, searchParams.destination || searchParams.to, '');
  const departureDate = normalizeDate(searchParams.departureDate || searchParams.departDate);
  const returnDate = normalizeDate(searchParams.returnDate);
  const travelersCount = normalizeTravelers(searchParams);
  const supportedCabins = new Set(['economy', 'premium_economy', 'business', 'first']);
  const requestedCabin = String(searchParams.cabinClass || 'economy').toLowerCase();
  const cabinClass = supportedCabins.has(requestedCabin) ? requestedCabin : 'economy';

  const normalizedSearch = { origin, destination, departureDate, returnDate, travelersCount, cabinClass };

  return {
    searchParams: normalizedSearch,
    handoffLinks: PROVIDERS.map(({ providerName, url }) => providerName === 'Google Flights'
      ? buildGoogleFlightsLink(normalizedSearch)
      : ({ providerName, url, prefilled: false })),
  };
};

module.exports = { buildFlightHandoff, buildGoogleFlightsLink };
