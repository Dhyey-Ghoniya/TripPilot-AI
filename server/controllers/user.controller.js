const userService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const data = await userService.getAllUsers(req.query);
      return ApiResponse.success(res, data, 'Users list retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return ApiResponse.success(res, { user }, 'User details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const user = await userService.updateUserStatus(req.params.id, isActive);
      return ApiResponse.success(res, { user }, 'User account status updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
