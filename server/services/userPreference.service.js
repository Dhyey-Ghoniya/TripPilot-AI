const User = require('../models/User');

class UserPreferenceService {
  /**
   * Get user travel preferences with optional trip-specific overrides.
   * @param {string} userId
   * @param {object} [tripOverrides] - Optional trip-specific preference overrides
   * @returns {Promise<object>} Resolved preference object for AI agent consumption
   */
  async getUserTravelPreferences(userId, tripOverrides = null) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const defaultPrefs = user.travelPreferences ? user.travelPreferences.toObject() : {};

    if (!tripOverrides || Object.keys(tripOverrides).length === 0) {
      return defaultPrefs;
    }

    return this.applyTripOverrides(defaultPrefs, tripOverrides);
  }

  /**
   * Update user's travel preferences in database.
   * @param {string} userId
   * @param {object} preferencesData
   * @returns {Promise<object>} Updated preferences object
   */
  async updateTravelPreferences(userId, preferencesData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const currentPrefs = user.travelPreferences ? user.travelPreferences.toObject() : {};

    const updatedPrefs = {
      ...currentPrefs,
      ...preferencesData,
    };

    user.travelPreferences = updatedPrefs;
    await user.save();

    return user.travelPreferences.toObject();
  }

  /**
   * Merges trip-specific preferences over default user preferences.
   * Trip-specific settings override user defaults for AI context creation.
   * @param {object} userPrefs
   * @param {object} tripOverrides
   * @returns {object} Merged preference object
   */
  applyTripOverrides(userPrefs = {}, tripOverrides = {}) {
    return {
      budgetRange: tripOverrides.budgetRange || userPrefs.budgetRange || 'Moderate',
      travelStyle: tripOverrides.travelStyle || userPrefs.travelStyle || 'Moderate',
      preferredTransport:
        tripOverrides.preferredTransport && tripOverrides.preferredTransport.length > 0
          ? tripOverrides.preferredTransport
          : userPrefs.preferredTransport || [],
      accommodationPreference:
        tripOverrides.accommodationPreference ||
        tripOverrides.accommodationType ||
        userPrefs.accommodationPreference ||
        userPrefs.accommodationType ||
        ['Hotel'],
      interests:
        tripOverrides.interests && tripOverrides.interests.length > 0
          ? tripOverrides.interests
          : userPrefs.interests || [],
      foodPreferences:
        tripOverrides.foodPreferences && tripOverrides.foodPreferences.length > 0
          ? tripOverrides.foodPreferences
          : userPrefs.foodPreferences || [],
      preferredActivities:
        tripOverrides.preferredActivities && tripOverrides.preferredActivities.length > 0
          ? tripOverrides.preferredActivities
          : userPrefs.preferredActivities || [],
      preferredTripDuration:
        tripOverrides.preferredTripDuration || userPrefs.preferredTripDuration || '3-5 Days',
    };
  }
}

module.exports = new UserPreferenceService();
