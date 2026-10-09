const hotelService = require('../services/hotel.service');
const ApiResponse = require('../utils/apiResponse');

class HotelController {
  async searchHotels(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const data = await hotelService.searchHotels(req.body, userId);
      return ApiResponse.success(res, data, 'Hotels searched across provider adapters with Hotel Fit scoring');
    } catch (error) {
      next(error);
    }
  }

  async attachHotelToTrip(req, res, next) {
    try {
      const { tripId, hotel } = req.body;
      const userId = req.user._id;

      if (!tripId || !hotel) {
        return ApiResponse.error(res, 'tripId and hotel data are required', 400);
      }

      const result = await hotelService.attachHotelToTrip(tripId, hotel, userId);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async executeAiHotelCommand(req, res, next) {
    try {
      const { prompt, tripId } = req.body;
      const userId = req.user ? req.user._id : null;
      const result = await hotelService.executeAiHotelCommand(prompt, tripId, userId);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HotelController();
