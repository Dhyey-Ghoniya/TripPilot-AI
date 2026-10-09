const bookingProvider = require('./BookingProvider');
const agodaProvider = require('./AgodaProvider');
const makeMyTripProvider = require('./MakeMyTripProvider');
const tripComProvider = require('./TripComProvider');
const expediaProvider = require('./ExpediaProvider');
const hotelsComProvider = require('./HotelsComProvider');

class HotelProviderManager {
  constructor() {
    this.providers = [
      bookingProvider,
      agodaProvider,
      makeMyTripProvider,
      tripComProvider,
      expediaProvider,
      hotelsComProvider,
    ];
  }

  /**
   * Search hotels across all 6 provider adapters concurrently.
   * Standardizes results and generates deep booking links.
   * @param {object} searchParams
   * @returns {Promise<Array<object>>} Combined hotel matrix
   */
  async searchAllProviders(searchParams) {
    const resultsPromises = this.providers.map(async (provider) => {
      try {
        const hotels = await provider.searchHotels(searchParams);
        return hotels.map((hotel) => ({
          ...hotel,
          providerName: provider.name,
          providerCode: provider.code,
          providerLogo: provider.logoUrl,
          bookingUrl: provider.generateBookingLink(hotel, searchParams),
        }));
      } catch (err) {
        console.warn(`[HotelProviderManager] ${provider.name} search warning:`, err.message);
        return [];
      }
    });

    const nestedResults = await Promise.all(resultsPromises);
    const aggregated = nestedResults.flat();

    // Sort by vibeScore / userRating descending by default
    return aggregated.sort((a, b) => (b.vibeScore || b.userRating * 20) - (a.vibeScore || a.userRating * 20));
  }
}

module.exports = new HotelProviderManager();
