const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check HttpOnly Cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback to Bearer token header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return ApiResponse.error(res, 'Invalid or expired authentication token', 401);
    }

    // Fetch user from DB
    const user = await User.findById(decoded.userId);
    if (!user) {
      return ApiResponse.error(res, 'User account no longer exists', 401);
    }

    // Verify account active status
    if (!user.isActive) {
      return ApiResponse.error(res, 'Your account has been deactivated. Please contact support.', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return ApiResponse.error(res, 'Authentication required', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // Ignore error for optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };
