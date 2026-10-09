const destinationService = require('../services/destination.service');
const ApiResponse = require('../utils/apiResponse');

class DestinationController {
  async getDestinations(req, res, next) {
    try {
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const data = await destinationService.getDestinations(req.query, isAdmin);
      return ApiResponse.success(res, data, 'Destinations fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDestinationBySlug(req, res, next) {
    try {
      const destination = await destinationService.getDestinationBySlug(req.params.slug);
      return ApiResponse.success(res, { destination }, 'Destination details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getDestinationById(req, res, next) {
    try {
      const destination = await destinationService.getDestinationById(req.params.id);
      return ApiResponse.success(res, { destination }, 'Destination details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createDestination(req, res, next) {
    try {
      const destination = await destinationService.createDestination(req.body, req.user._id);
      return ApiResponse.success(res, { destination }, 'Destination created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateDestination(req, res, next) {
    try {
      const destination = await destinationService.updateDestination(req.params.id, req.body);
      return ApiResponse.success(res, { destination }, 'Destination updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteDestination(req, res, next) {
    try {
      const result = await destinationService.deleteDestination(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const destination = await destinationService.toggleDestinationStatus(
        req.params.id,
        Boolean(isActive)
      );
      return ApiResponse.success(res, { destination }, 'Destination status updated');
    } catch (error) {
      next(error);
    }
  }

  async toggleFeatured(req, res, next) {
    try {
      const { isFeatured } = req.body;
      const destination = await destinationService.toggleDestinationFeatured(
        req.params.id,
        Boolean(isFeatured)
      );
      return ApiResponse.success(res, { destination }, 'Destination featured status updated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DestinationController();
