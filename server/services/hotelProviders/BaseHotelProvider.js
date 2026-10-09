/**
 * Base abstract class for Hotel Providers
 */
class BaseHotelProvider {
  constructor(name, code, logoUrl) {
    this.name = name;
    this.code = code;
    this.logoUrl = logoUrl || '';
  }

  /**
   * Search hotels for given destination and search parameters
   * @param {object} searchParams
   * @returns {Promise<Array<object>>} Standardized hotel search results
   */
  async searchHotels(searchParams) {
    throw new Error('searchHotels method must be implemented by provider adapter');
  }

  /**
   * Get detailed info for a specific hotel by ID
   * @param {string} hotelId
   * @returns {Promise<object>} Hotel detailed object
   */
  async getHotelDetails(hotelId) {
    throw new Error('getHotelDetails method must be implemented by provider adapter');
  }

  /**
   * Generate official deep-link redirection URL for booking on provider site
   * @param {object} hotel
   * @param {object} searchParams
   * @returns {string} Official deep-link URL
   */
  generateBookingLink(hotel, searchParams) {
    throw new Error('generateBookingLink method must be implemented by provider adapter');
  }

  /**
   * Helper format date to YYYY-MM-DD
   */
  formatDate(dateInput) {
    if (!dateInput) return new Date().toISOString().split('T')[0];
    const d = new Date(dateInput);
    return d.toISOString().split('T')[0];
  }
}

module.exports = BaseHotelProvider;
