// Legacy sample-only adapters. They synthesize flight details and are intentionally
// excluded from user-facing flight search until a verified live data provider exists.
const ixigoProvider = require('./IxigoProvider');
const makeMyTripProvider = require('./MakeMyTripProvider');
const cleartripProvider = require('./CleartripProvider');
const skyscannerProvider = require('./SkyscannerProvider');
const tripComProvider = require('./TripComProvider');
const expediaProvider = require('./ExpediaProvider');

class FlightProviderManager {
  constructor() {
    this.providers = [
      ixigoProvider,
      makeMyTripProvider,
      cleartripProvider,
      skyscannerProvider,
      tripComProvider,
      expediaProvider,
    ];
  }

  /**
   * Search flights across all provider adapters concurrently.
   * Calculates AI match scores and aggregates official booking links.
   * @param {object} searchParams
   * @returns {Promise<Array<object>>} Aggregated & scored flight matrix
   */
  async searchAllProviders(searchParams) {
    const cabinPriceMultipliers = {
      economy: 1,
      premium_economy: 1.35,
      business: 2.5,
      first: 4,
    };
    const cabinClass = String(searchParams.cabinClass || 'economy').toLowerCase();
    const cabinPriceMultiplier = cabinPriceMultipliers[cabinClass] || cabinPriceMultipliers.economy;

    const resultsPromises = this.providers.map(async (provider) => {
      try {
        const flights = await provider.searchFlights(searchParams);
        return flights.map((flight) => {
          // Calculate AI Match Score based on price, duration, and stops
          const durationHrs = (flight.durationMinutes || 180) / 60;
          const stopsPenalty = (flight.stopsCount || 0) * 15;
          const rawScore = Math.max(70, Math.min(99, 100 - durationHrs * 2 - stopsPenalty));

          return {
            ...flight,
            price: {
              ...flight.price,
              amount: Math.round(Number(flight.price?.amount || 0) * cabinPriceMultiplier),
            },
            cabinClass,
            score: Math.round(rawScore),
            // These adapters currently return curated estimates, not live inventory.
            isIndicativeEstimate: true,
            inventoryVerified: false,
            dataQuality: 'sample_estimate',
            providerName: provider.name,
            providerCode: provider.code,
            providerLogo: provider.logoUrl,
            bookingUrl: provider.generateBookingLink(flight, searchParams),
          };
        });
      } catch (err) {
        console.warn(`[FlightProviderManager] ${provider.name} search warning:`, err.message);
        return [];
      }
    });

    const nestedResults = await Promise.all(resultsPromises);
    const aggregated = nestedResults.flat();

    // Return all adapter results in arrival order. Do not rank or hide flights by score.
    return aggregated.sort((a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime));
  }
}

module.exports = new FlightProviderManager();
