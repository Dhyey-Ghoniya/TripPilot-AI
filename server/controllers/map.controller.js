const mapService = require('../services/map.service');
const ApiResponse = require('../utils/apiResponse');

class MapController {
  async geocode(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) return ApiResponse.error(res, 'Query parameter "q" is required', 400);
      const data = await mapService.geocode(q);
      return ApiResponse.success(res, data, 'Geocoded place successfully');
    } catch (error) {
      next(error);
    }
  }

  async reverseGeocode(req, res, next) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return ApiResponse.error(res, 'lat and lng parameters are required', 400);
      const data = await mapService.reverseGeocode(Number(lat), Number(lng));
      return ApiResponse.success(res, data, 'Reverse geocoded location');
    } catch (error) {
      next(error);
    }
  }

  async calculateRoute(req, res, next) {
    try {
      const { origin, destination, mode } = req.body;
      if (!origin || !destination) {
        return ApiResponse.error(res, 'origin and destination are required', 400);
      }
      const data = await mapService.calculateRoute(origin, destination, mode);
      return ApiResponse.success(res, data, 'Route calculated');
    } catch (error) {
      next(error);
    }
  }

  async getTripMapWorkspace(req, res, next) {
    try {
      const { tripId } = req.params;
      const { dayNumber } = req.query;
      const data = await mapService.getTripMapWorkspace(tripId, dayNumber || 1);
      return ApiResponse.success(res, data, 'Trip map workspace & route intelligence retrieved');
    } catch (error) {
      next(error);
    }
  }

  async optimizeTripRoute(req, res, next) {
    try {
      const { waypoints } = req.body;
      if (!Array.isArray(waypoints)) {
        return ApiResponse.error(res, 'waypoints array is required', 400);
      }
      const data = mapService.optimizeItineraryRoute(waypoints);
      return ApiResponse.success(res, data, 'Trip itinerary route optimized');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MapController();
