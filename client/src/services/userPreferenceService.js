import api from './api';

export const userPreferenceService = {
  /**
   * Fetch current user's default travel preferences.
   */
  async getUserTravelPreferences() {
    return await api.get('/auth/preferences');
  },

  /**
   * Update user's travel preferences.
   * @param {object} preferencesData
   */
  async updateTravelPreferences(preferencesData) {
    return await api.put('/auth/preferences', preferencesData);
  },
};

export default userPreferenceService;
