const itineraryService = require('../services/itinerary.service');
const TripPilotAgent = require('../services/TripPilotAgent');
const ApiResponse = require('../utils/apiResponse');

class ItineraryController {
  async getItineraryByTrip(req, res, next) {
    try {
      const itinerary = await itineraryService.getItineraryByTripId(req.params.tripId);
      return ApiResponse.success(res, itinerary, 'Itinerary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async addActivity(req, res, next) {
    try {
      const { id } = req.params; // itineraryId
      const { dayNumber, ...activityData } = req.body;
      const itinerary = await itineraryService.addActivity(id, dayNumber || 1, activityData);
      return ApiResponse.success(res, itinerary, 'Activity added to itinerary');
    } catch (error) {
      next(error);
    }
  }

  async deleteActivity(req, res, next) {
    try {
      const { id, dayNumber, activityId } = req.params;
      const itinerary = await itineraryService.deleteActivity(id, dayNumber, activityId);
      return ApiResponse.success(res, itinerary, 'Activity deleted from itinerary');
    } catch (error) {
      next(error);
    }
  }

  async reorderActivities(req, res, next) {
    try {
      const { id, dayNumber } = req.params;
      const { orderedActivityIds } = req.body;
      const itinerary = await itineraryService.reorderActivities(id, dayNumber, orderedActivityIds || []);
      return ApiResponse.success(res, itinerary, 'Activities reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  async regenerateDay(req, res, next) {
    try {
      const { id, dayNumber } = req.params;
      const itinerary = await itineraryService.regenerateDay(id, dayNumber);
      return ApiResponse.success(res, itinerary, `Day ${dayNumber} regenerated via AI`);
    } catch (error) {
      next(error);
    }
  }

  async executeAiTripCommand(req, res, next) {
    try {
      const { tripId } = req.params;
      const { prompt } = req.body;
      const result = await TripPilotAgent.processInteraction(tripId, prompt, req.user._id);
      return ApiResponse.success(res, result.orchestratorResult, result.orchestratorResult.copilotMessage);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItineraryController();
