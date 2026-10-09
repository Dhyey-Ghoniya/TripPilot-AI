import api from './api';

export const activityService = {
  /**
   * Search activities across 14 categories with filters & fit intelligence
   */
  searchActivities: async (params) => {
    return await api.get('/activities/search', { params });
  },

  /**
   * Add activity to trip itinerary
   */
  addActivityToTrip: async (tripId, activity, dayNumber = 1, timeSlot = 'afternoon') => {
    return await api.post('/activities/add', { tripId, activity, dayNumber, timeSlot });
  },

  /**
   * Remove activity from trip itinerary
   */
  removeActivityFromTrip: async (tripId, dayNumber, activityId) => {
    return await api.post('/activities/remove', { tripId, dayNumber, activityId });
  },

  /**
   * Replace activity in trip itinerary
   */
  replaceActivityInTrip: async (tripId, dayNumber, oldActivityTitle, newActivity) => {
    return await api.post('/activities/replace', { tripId, dayNumber, oldActivityTitle, newActivity });
  },

  /**
   * Move activity between days/slots
   */
  moveActivityInTrip: async (tripId, fromDay, toDay, activityTitle, newTimeSlot = 'afternoon') => {
    return await api.post('/activities/move', { tripId, fromDay, toDay, activityTitle, newTimeSlot });
  },

  /**
   * Optimize trip activities geographically & by opening hours
   */
  optimizeTripActivities: async (tripId) => {
    return await api.post('/activities/optimize', { tripId });
  },
};

export default activityService;
