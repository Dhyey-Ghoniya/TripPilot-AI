import api from './api';

const exploreService = {
  /**
   * Fetch all 5 sections for Explore Discovery Layer
   */
  getExploreData: async () => {
    return await api.get('/explore');
  },

  /**
   * Process Natural Language AI Discovery
   */
  aiDiscovery: async (prompt) => {
    return await api.post('/explore/ai-discovery', { prompt });
  },
};

export default exploreService;
