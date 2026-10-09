const attractionService = require('../services/attraction.service');
const ApiResponse = require('../utils/apiResponse');

class AttractionController {
  async getAttractions(req, res, next) {
    try {
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const data = await attractionService.getAttractions(req.query, isAdmin);
      return ApiResponse.success(res, data, 'Attractions fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAttractionBySlug(req, res, next) {
    try {
      const attraction = await attractionService.getAttractionBySlug(req.params.slug);
      return ApiResponse.success(res, { attraction }, 'Attraction details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAttractionById(req, res, next) {
    try {
      const attraction = await attractionService.getAttractionById(req.params.id);
      return ApiResponse.success(res, { attraction }, 'Attraction details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAttractionsByDestination(req, res, next) {
    try {
      const data = await attractionService.getAttractionsByDestination(req.params.destinationId, req.query);
      return ApiResponse.success(res, data, 'Destination attractions fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async getNearbyAttractions(req, res, next) {
    try {
      const { latitude, longitude, radius } = req.query;
      const attractions = await attractionService.getNearbyAttractions(latitude, longitude, radius);
      return ApiResponse.success(res, { attractions }, 'Nearby attractions retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createAttraction(req, res, next) {
    try {
      const attraction = await attractionService.createAttraction(req.body, req.user._id);
      return ApiResponse.success(res, { attraction }, 'Attraction created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAttraction(req, res, next) {
    try {
      const attraction = await attractionService.updateAttraction(req.params.id, req.body);
      return ApiResponse.success(res, { attraction }, 'Attraction updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteAttraction(req, res, next) {
    try {
      const result = await attractionService.deleteAttraction(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const attraction = await attractionService.toggleStatus(req.params.id);
      return ApiResponse.success(res, { attraction }, 'Attraction status updated');
    } catch (error) {
      next(error);
    }
  }

  async toggleFeatured(req, res, next) {
    try {
      const attraction = await attractionService.toggleFeatured(req.params.id);
      return ApiResponse.success(res, { attraction }, 'Attraction featured status updated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttractionController();
