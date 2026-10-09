import api from './api';

export const weatherService = {
  /**
   * Get weather forecast for location
   */
  getForecast: async (location, tripId = null) => {
    return await api.get('/weather/forecast', { params: { location, tripId } });
  },

  /**
   * Get weather intelligence and rain/heat warnings for trip
   */
  getItineraryWeatherIntelligence: async (tripId) => {
    return await api.get(`/weather/trip-intelligence/${tripId}`);
  },

  /**
   * Optimize trip itinerary for weather
   */
  optimizeWeatherItinerary: async (tripId, option = 'optimize_full') => {
    return await api.post('/weather/optimize', { tripId, option });
  },

  /**
   * Execute AI weather optimization command
   */
  executeAiWeatherCommand: async (prompt, tripId) => {
    return await api.post('/weather/ai-command', { prompt, tripId });
  },
};

export default weatherService;
