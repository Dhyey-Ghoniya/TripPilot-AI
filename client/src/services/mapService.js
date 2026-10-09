import api from './api';

export const mapService = {
  /**
   * Geocode place name or address
   */
  geocode: async (query) => {
    return await api.get('/map/geocode', { params: { q: query } });
  },

  /**
   * Reverse geocode coordinates
   */
  reverseGeocode: async (lat, lng) => {
    return await api.get('/map/reverse-geocode', { params: { lat, lng } });
  },

  /**
   * Calculate route between two points
   */
  calculateRoute: async (origin, destination, mode = 'Taxi') => {
    return await api.post('/map/route', { origin, destination, mode });
  },

  /**
   * Get trip map workspace markers & routing telemetry
   */
  getTripMapWorkspace: async (tripId, dayNumber = 1) => {
    return await api.get(`/map/workspace/${tripId}`, { params: { dayNumber } });
  },

  /**
   * Optimize itinerary route (TSP nearest-neighbor)
   */
  optimizeTripRoute: async (waypoints) => {
    return await api.post('/map/optimize-route', { waypoints });
  },
};

export default mapService;
