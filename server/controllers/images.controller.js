const imageService = require('../services/image.service');
const ApiResponse = require('../utils/apiResponse');

class ImagesController {
  async findActivityPhoto(req, res, next) {
    try {
      const { activity, location = '', destination = '', tripId = '' } = req.query;
      if (typeof activity !== 'string' || activity.trim().length < 2 || activity.length > 200) {
        return ApiResponse.error(res, 'An activity name is required.', 400);
      }

      const photo = await imageService.fetchActivityPhoto({
        activity: activity.trim(),
        location: typeof location === 'string' ? location.trim() : '',
        destination: typeof destination === 'string' ? destination.trim() : '',
        tripKey: typeof tripId === 'string' && tripId.length <= 64 ? tripId : '',
      });
      return ApiResponse.success(res, { photo }, photo ? 'Verified activity photo found.' : 'No matching photo found.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImagesController();
