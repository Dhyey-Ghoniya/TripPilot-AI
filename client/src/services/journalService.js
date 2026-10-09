import api from './api';

const journalService = {
  /**
   * Get all journal entries
   */
  getJournals: async (params = {}) => {
    return await api.get('/journals', { params });
  },

  /**
   * Get single journal by ID
   */
  getJournalById: async (id) => {
    return await api.get(`/journals/${id}`);
  },

  /**
   * Create new travel journal entry
   */
  createJournal: async (journalData) => {
    return await api.post('/journals', journalData);
  },

  /**
   * Update journal entry
   */
  updateJournal: async (id, journalData) => {
    return await api.put(`/journals/${id}`, journalData);
  },

  /**
   * Delete journal entry
   */
  deleteJournal: async (id) => {
    return await api.delete(`/journals/${id}`);
  },

  /**
   * Get trip analytics (Total spending, categories, activities completed, destinations visited, travel patterns)
   */
  getTripAnalytics: async () => {
    return await api.get('/journals/analytics/overview');
  },

  /**
   * Get future AI personalization profile based on completed trip data
   */
  getPersonalizationProfile: async () => {
    return await api.get('/journals/personalization/profile');
  },
};

export default journalService;
