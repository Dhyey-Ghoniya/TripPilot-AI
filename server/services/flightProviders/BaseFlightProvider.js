/**
 * Base abstract class for Flight Providers
 */
class BaseFlightProvider {
  constructor(name, code, logoUrl) {
    this.name = name;
    this.code = code;
    this.logoUrl = logoUrl || '';
  }

  /**
   * Search flights for given search parameters
   * @param {object} searchParams
   * @returns {Promise<Array<object>>} Standardized flight results
   */
  async searchFlights(searchParams) {
    throw new Error('searchFlights method must be implemented by provider adapter');
  }

  /**
   * Get flight details by ID
   * @param {string} flightId
   * @returns {Promise<object>} Flight details
   */
  async getFlightDetails(flightId) {
    throw new Error('getFlightDetails method must be implemented by provider adapter');
  }

  /**
   * Generate official deep-link redirection URL for booking on provider checkout
   * @param {object} flight
   * @param {object} searchParams
   * @returns {string} Deep-link URL
   */
  generateBookingLink(flight, searchParams) {
    throw new Error('generateBookingLink method must be implemented by provider adapter');
  }

  /**
   * Format departure date to YYYY-MM-DD
   */
  formatDate(dateInput) {
    if (!dateInput) return new Date().toISOString().split('T')[0];
    const d = new Date(dateInput);
    return d.toISOString().split('T')[0];
  }
}

module.exports = BaseFlightProvider;
