const authService = require('../services/auth.service');
const userPreferenceService = require('../services/userPreference.service');
const ApiResponse = require('../utils/apiResponse');
const { sendTokenCookie, clearTokenCookie } = require('../utils/jwt');

class AuthController {
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);
      sendTokenCookie(res, token);
      return ApiResponse.success(
        res,
        { user, token },
        'Account created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body);
      sendTokenCookie(res, token);
      return ApiResponse.success(res, { user, token }, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    clearTokenCookie(res);
    return ApiResponse.success(res, null, 'Logged out successfully');
  }

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user._id);
      return ApiResponse.success(res, { user }, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user._id, req.body);
      return ApiResponse.success(res, { user }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const result = await authService.changePassword(
        req.user._id,
        currentPassword,
        newPassword,
        confirmPassword
      );
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getTravelPreferences(req, res, next) {
    try {
      const preferences = await userPreferenceService.getUserTravelPreferences(
        req.user._id,
        req.query
      );
      return ApiResponse.success(res, { preferences }, 'Travel preferences retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateTravelPreferences(req, res, next) {
    try {
      const preferences = await userPreferenceService.updateTravelPreferences(
        req.user._id,
        req.body
      );
      return ApiResponse.success(res, { preferences }, 'Travel preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

