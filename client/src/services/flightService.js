import api from './api';

export const flightService = {
  /**
   * Get outbound provider search links for a route
   */
  searchFlights: async (searchParams) => {
    return await api.post('/flights/search', searchParams);
  },

  /**
   * Attach selected flight to trip
   */
  attachFlightToTrip: async (tripId, flight) => {
    return await api.post('/flights/attach', { tripId, flight });
  },

  /**
   * Execute AI flight command
   */
  executeAiFlightCommand: async (prompt, tripId = null) => {
    return await api.post('/flights/ai-command', { prompt, tripId });
  },
};

export default flightService;
