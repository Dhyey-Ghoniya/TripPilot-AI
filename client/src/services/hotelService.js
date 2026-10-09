import api from './api';

export const hotelService = {
  /**
   * Search hotels across provider matrix with Hotel Fit evaluation
   */
  searchHotels: async (searchParams) => {
    return await api.post('/hotels/search', searchParams);
  },

  /**
   * Attach selected hotel to trip & update budget/map
   */
  attachHotelToTrip: async (tripId, hotel) => {
    return await api.post('/hotels/attach', { tripId, hotel });
  },

  /**
   * Execute AI stay copilot command
   */
  executeAiHotelCommand: async (prompt, tripId = null) => {
    return await api.post('/hotels/ai-command', { prompt, tripId });
  },
};

export default hotelService;
