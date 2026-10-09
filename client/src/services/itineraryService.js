import api from './api';

export const itineraryService = {
  /**
   * Get itinerary by trip ID
   */
  getItineraryByTripId: async (tripId) => {
    return await api.get(`/itineraries/${tripId}`);
  },

  /**
   * Add activity to itinerary day
   */
  addActivity: async (itineraryId, activityData) => {
    return await api.post(`/itineraries/${itineraryId}/activities`, activityData);
  },

  /**
   * Delete activity from day
   */
  deleteActivity: async (itineraryId, dayNumber, activityId) => {
    return await api.delete(`/itineraries/${itineraryId}/days/${dayNumber}/activities/${activityId}`);
  },

  /**
   * Reorder activities in day
   */
  reorderActivities: async (itineraryId, dayNumber, orderedActivityIds) => {
    return await api.put(`/itineraries/${itineraryId}/days/${dayNumber}/reorder`, {
      orderedActivityIds,
    });
  },

  /**
   * Regenerate single day via AI
   */
  regenerateDay: async (itineraryId, dayNumber) => {
    return await api.post(`/itineraries/${itineraryId}/days/${dayNumber}/regenerate`);
  },
};

export default itineraryService;
