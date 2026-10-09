const journalService = require('../services/journal.service');
const personalizationService = require('../services/personalization.service');
const ApiResponse = require('../utils/apiResponse');

class JournalController {
  /**
   * POST /api/journals
   * Create a new travel journal entry
   */
  async createJournal(req, res, next) {
    try {
      const journal = await journalService.createJournal(req.user._id, req.body);
      return ApiResponse.success(res, journal, 'Travel journal entry saved successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/journals
   * Fetch all user journal entries with optional search & filtering
   */
  async getUserJournals(req, res, next) {
    try {
      const { search, tripId, page, limit } = req.query;
      const data = await journalService.getUserJournals(req.user._id, { search, tripId, page, limit });
      return ApiResponse.success(res, data, 'Journal entries retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/journals/:id
   * Fetch single journal entry
   */
  async getJournalById(req, res, next) {
    try {
      const journal = await journalService.getJournalById(req.params.id, req.user._id);
      return ApiResponse.success(res, journal, 'Journal entry details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/journals/:id
   * Update journal entry
   */
  async updateJournal(req, res, next) {
    try {
      const journal = await journalService.updateJournal(req.params.id, req.user._id, req.body);
      return ApiResponse.success(res, journal, 'Journal entry updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/journals/:id
   * Delete journal entry
   */
  async deleteJournal(req, res, next) {
    try {
      const result = await journalService.deleteJournal(req.params.id, req.user._id);
      return ApiResponse.success(res, result, 'Journal entry removed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/journals/analytics/overview
   * Fetch trip analytics (Spending, Categories, Activities, Destinations, Travel Patterns)
   */
  async getTripAnalytics(req, res, next) {
    try {
      const analytics = await personalizationService.getTripAnalytics(req.user._id);
      return ApiResponse.success(res, analytics, 'Trip analytics loaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/journals/personalization/profile
   * Fetch and update AI Personalization parameters derived from completed trip data
   */
  async getPersonalizationProfile(req, res, next) {
    try {
      const profile = await personalizationService.getOrUpdateFuturePersonalization(req.user._id);
      return ApiResponse.success(res, profile, 'AI personalization profile updated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JournalController();
