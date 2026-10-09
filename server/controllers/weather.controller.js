const weatherService = require('../services/weather.service');
const ApiResponse = require('../utils/apiResponse');

class WeatherController {
  async getForecast(req, res, next) {
    try {
      const { location, tripId } = req.query;
      const data = await weatherService.getWeatherForecast(location || 'Dubai', new Date(), tripId);
      return ApiResponse.success(res, data, 'Weather forecast retrieved from WeatherProvider');
    } catch (error) {
      next(error);
    }
  }

  async getItineraryWeatherIntelligence(req, res, next) {
    try {
      const { tripId } = req.params;
      const data = await weatherService.getItineraryWeatherIntelligence(tripId);
      return ApiResponse.success(res, data, 'Itinerary weather intelligence & warnings evaluated');
    } catch (error) {
      next(error);
    }
  }

  async optimizeWeatherItinerary(req, res, next) {
    try {
      const { tripId, option } = req.body;
      if (!tripId) return ApiResponse.error(res, 'tripId is required', 400);
      const data = await weatherService.executeWeatherOptimization(tripId, option);
      return ApiResponse.success(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }

  async executeAiWeatherCommand(req, res, next) {
    try {
      const { prompt, tripId } = req.body;
      if (!tripId || !prompt) return ApiResponse.error(res, 'tripId and prompt are required', 400);
      const data = await weatherService.executeAiWeatherCommand(prompt, tripId);
      return ApiResponse.success(res, data, data.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WeatherController();
