const activityService = require('../services/activity.service');
const ApiResponse = require('../utils/apiResponse');

class ActivityController {
  async searchActivities(req, res, next) {
    try {
      const searchParams = {
        ...req.query,
        ...req.body,
      };
      const userId = req.user ? req.user._id : null;
      const data = await activityService.searchActivities(searchParams, userId);
      return ApiResponse.success(res, data, 'Activities & experiences retrieved with fit intelligence');
    } catch (error) {
      next(error);
    }
  }

  async addActivityToTrip(req, res, next) {
    try {
      const { tripId, activity, dayNumber, timeSlot } = req.body;
      if (!tripId || !activity) {
        return ApiResponse.error(res, 'tripId and activity data are required', 400);
      }
      const result = await activityService.addActivityToTrip(tripId, activity, dayNumber, timeSlot);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async removeActivityFromTrip(req, res, next) {
    try {
      const { tripId, dayNumber, activityId } = req.body;
      if (!tripId || !activityId) {
        return ApiResponse.error(res, 'tripId and activityId are required', 400);
      }
      const result = await activityService.removeActivityFromTrip(tripId, dayNumber, activityId);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async replaceActivityInTrip(req, res, next) {
    try {
      const { tripId, dayNumber, oldActivityTitle, newActivity } = req.body;
      if (!tripId || !oldActivityTitle || !newActivity) {
        return ApiResponse.error(res, 'tripId, oldActivityTitle, and newActivity are required', 400);
      }
      const result = await activityService.replaceActivityInTrip(tripId, dayNumber, oldActivityTitle, newActivity);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async moveActivityInTrip(req, res, next) {
    try {
      const { tripId, fromDay, toDay, activityTitle, newTimeSlot } = req.body;
      if (!tripId || !fromDay || !toDay || !activityTitle) {
        return ApiResponse.error(res, 'tripId, fromDay, toDay, and activityTitle are required', 400);
      }
      const result = await activityService.moveActivityInTrip(tripId, fromDay, toDay, activityTitle, newTimeSlot);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async optimizeTripActivities(req, res, next) {
    try {
      const { tripId } = req.body;
      if (!tripId) {
        return ApiResponse.error(res, 'tripId is required', 400);
      }
      const result = await activityService.optimizeTripActivities(tripId);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActivityController();
