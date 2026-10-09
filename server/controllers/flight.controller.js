const flightService = require('../services/flight.service');
const ApiResponse = require('../utils/apiResponse');

class FlightController {
  async searchFlights(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const data = await flightService.searchFlights(req.body, userId);
      return ApiResponse.success(res, data, 'Flights searched across provider adapters');
    } catch (error) {
      next(error);
    }
  }

  async attachFlightToTrip(req, res, next) {
    try {
      const { tripId, flight } = req.body;
      const userId = req.user._id;

      if (!tripId || !flight) {
        return ApiResponse.error(res, 'tripId and flight data are required', 400);
      }

      const result = await flightService.attachFlightToTrip(tripId, flight, userId);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async executeAiFlightCommand(req, res, next) {
    try {
      const { prompt, tripId } = req.body;
      const userId = req.user ? req.user._id : null;
      const result = await flightService.executeAiFlightCommand(prompt, tripId, userId);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FlightController();
