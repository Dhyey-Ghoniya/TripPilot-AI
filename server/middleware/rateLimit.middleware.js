const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication requests from this IP, please try again after 15 minutes',
      429
    );
  },
});

module.exports = { authLimiter };
