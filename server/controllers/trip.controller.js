const tripService = require('../services/trip.service');
const ApiResponse = require('../utils/apiResponse');

class TripController {
  async getMyTrips(req, res, next) {
    try {
      const { tab, status, limit, page } = req.query;
      const data = await tripService.getUserTrips(req.user._id, { tab, status, limit, page });
      return ApiResponse.success(res, data, 'Trips retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTripById(req, res, next) {
    try {
      const trip = await tripService.getTripById(req.params.id, req.user._id);
      return ApiResponse.success(res, trip, 'Trip details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createTrip(req, res, next) {
    try {
      const trip = await tripService.createTrip(req.user._id, req.body);
      return ApiResponse.success(res, trip, 'Trip blueprint created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTrip(req, res, next) {
    try {
      const trip = await tripService.updateTrip(req.params.id, req.user._id, req.body);
      return ApiResponse.success(res, trip, 'Trip updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async duplicateTrip(req, res, next) {
    try {
      const clonedTrip = await tripService.duplicateTrip(req.params.id, req.user._id);
      return ApiResponse.success(res, clonedTrip, 'Trip duplicated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async archiveTrip(req, res, next) {
    try {
      const result = await tripService.archiveTrip(req.params.id, req.user._id);
      return ApiResponse.success(res, result, result.message || 'Trip status updated');
    } catch (error) {
      next(error);
    }
  }

  async markCompleted(req, res, next) {
    try {
      const result = await tripService.markCompleted(req.params.id, req.user._id);
      return ApiResponse.success(res, result, result.message || 'Trip marked as completed');
    } catch (error) {
      next(error);
    }
  }

  async deleteTrip(req, res, next) {
    try {
      const result = await tripService.deleteTrip(req.params.id, req.user._id);
      return ApiResponse.success(res, result, 'Trip deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSharedTrip(req, res, next) {
    try {
      const trip = await tripService.getSharedTrip(req.params.shareCode);
      return ApiResponse.success(res, trip, 'Shared trip retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async exportTrip(req, res, next) {
    try {
      const exportData = await tripService.exportTrip(req.params.id, req.user._id);
      return ApiResponse.success(res, exportData, 'Trip export generated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCompletedTripsAnalytics(req, res, next) {
    try {
      const analytics = await tripService.getCompletedTripsAnalytics(req.user._id);
      return ApiResponse.success(res, analytics, 'Completed trips analytics loaded');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TripController();
