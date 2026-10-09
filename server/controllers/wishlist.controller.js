const wishlistService = require('../services/wishlist.service');
const ApiResponse = require('../utils/apiResponse');

class WishlistController {
  async getWishlist(req, res, next) {
    try {
      const destinations = await wishlistService.getWishlist(req.user._id);
      return ApiResponse.success(res, { destinations }, 'Wishlist retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async addToWishlist(req, res, next) {
    try {
      const { destinationId } = req.params;
      const item = await wishlistService.addToWishlist(req.user._id, destinationId);
      return ApiResponse.success(res, { item }, 'Destination saved to wishlist', 201);
    } catch (error) {
      next(error);
    }
  }

  async removeFromWishlist(req, res, next) {
    try {
      const { destinationId } = req.params;
      const result = await wishlistService.removeFromWishlist(req.user._id, destinationId);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async checkWishlistStatus(req, res, next) {
    try {
      const { destinationId } = req.params;
      const status = await wishlistService.checkWishlistStatus(req.user._id, destinationId);
      return ApiResponse.success(res, status, 'Wishlist status checked');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WishlistController();
