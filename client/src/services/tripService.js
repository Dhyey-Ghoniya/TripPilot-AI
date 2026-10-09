import api from './api';

const tripService = {
  /**
   * Get authenticated user's trips with tab filtering (upcoming, drafts, saved, completed, archived)
   */
  getMyTrips: async (params = {}) => {
    return await api.get('/trips', { params });
  },

  /**
   * Get single trip by ID
   */
  getTripById: async (id) => {
    return await api.get(`/trips/${id}`);
  },

  /**
   * Create a new trip
   */
  createTrip: async (tripData) => {
    return await api.post('/trips', tripData);
  },

  /**
   * Update an existing trip
   */
  updateTrip: async (id, tripData) => {
    return await api.put(`/trips/${id}`, tripData);
  },

  /**
   * Action: Duplicate trip
   */
  duplicateTrip: async (id) => {
    return await api.post(`/trips/${id}/duplicate`);
  },

  /**
   * Action: Archive / Restore trip
   */
  archiveTrip: async (id) => {
    return await api.put(`/trips/${id}/archive`);
  },

  /**
   * Action: Mark trip completed
   */
  markCompleted: async (id) => {
    return await api.put(`/trips/${id}/complete`);
  },

  /**
   * Action: Export trip (PDF/Print/Journey data)
   */
  exportTrip: async (id) => {
    return await api.get(`/trips/${id}/export`);
  },

  /**
   * Get completed trips analytics (Travel history, Expense analysis, Personalization)
   */
  getCompletedAnalytics: async () => {
    return await api.get('/trips/analytics/completed');
  },

  /**
   * Delete a trip
   */
  deleteTrip: async (id) => {
    return await api.delete(`/trips/${id}`);
  },

  /**
   * Get shared trip by public token
   */
  getSharedTrip: async (shareCode) => {
    return await api.get(`/trips/share/${shareCode}`);
  },

  /**
   * Execute AI trip assistant command
   */
  executeAiCommand: async (tripId, prompt) => {
    return await api.post(`/trips/${tripId}/ai-command`, { prompt });
  },
};

export default tripService;
