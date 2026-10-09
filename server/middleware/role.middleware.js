const ApiResponse = require('../utils/apiResponse');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        'You do not have permission to access this resource',
        403
      );
    }

    next();
  };
};

module.exports = { authorizeRoles };
