const exploreService = require('../services/explore.service');
const ApiResponse = require('../utils/apiResponse');

class ExploreController {
  /**
   * GET /api/v1/explore
   * Retrieve all 5 sections for the Explore Discovery Layer:
   * 1. Recommended for You
   * 2. AI Discoveries
   * 3. Travel Collections
   * 4. Popular Experiences
   * 5. Weekend Ideas
   */
  async getExploreData(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const result = await exploreService.getExploreData(userId);
      return ApiResponse.success(res, result.data, 'Explore discovery layer loaded.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/explore/ai-discovery
   * Process natural language AI discovery prompt:
   * Examples:
   *   - "Find destinations like my previous trip."
   *   - "Suggest a 4-day adventure trip."
   *   - "Where can I travel under ₹30,000?"
   */
  async handleAiDiscovery(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return ApiResponse.error(res, 'Discovery prompt is required.', 400);
      }

      const result = await exploreService.handleAiDiscovery(userId, prompt.trim());
      return ApiResponse.success(res, result, result.message || 'AI discovery processed.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExploreController();
