const openStreetMapProvider = require('./OpenStreetMapProvider');
const { applyAffiliateTracking } = require('../affiliateLinks.service');

// TODO: Confirm Agoda's `cid` URL parameter in its affiliate dashboard before attaching Agoda tracking IDs.

class HotelProviderManager {
  constructor() {
    this.providers = [openStreetMapProvider];
  }

  /**
   * Search real lodging directory records without presenting mock hotels as live inventory.
   * Standardizes results and generates deep booking links.
   * @param {object} searchParams
   * @returns {Promise<Array<object>>} Combined hotel matrix
   */
  async searchAllProviders(searchParams) {
    const providerErrors = [];
    const resultsPromises = this.providers.map(async (provider) => {
      try {
        const hotels = await provider.searchHotels(searchParams);
        return hotels.map((hotel) => ({
          ...hotel,
          providerName: provider.name,
          providerCode: provider.code,
          providerLogo: provider.logoUrl,
          bookingUrl: applyAffiliateTracking(hotel.bookingUrl || null, 'booking'),
          isIndicativeSuggestion: false,
          inventoryVerified: false,
          dataQuality: hotel.dataQuality || 'directory_listing',
        }));
      } catch (err) {
        console.warn(`[HotelProviderManager] ${provider.name} search warning:`, err.message);
        providerErrors.push(err);
        return [];
      }
    });

    const nestedResults = await Promise.all(resultsPromises);
    const aggregated = nestedResults.flat();

    if (aggregated.length === 0 && providerErrors.length === this.providers.length) {
      throw new Error(`Hotel directory search failed: ${providerErrors[0].message}`);
    }

    return aggregated;
  }
}

module.exports = new HotelProviderManager();
