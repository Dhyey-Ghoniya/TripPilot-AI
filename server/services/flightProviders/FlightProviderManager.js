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
            score: Math.round(rawScore),
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

    // Sort by AI score descending by default
    return aggregated.sort((a, b) => b.score - a.score);
  }
}

module.exports = new FlightProviderManager();
