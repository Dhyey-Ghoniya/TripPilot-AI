const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');

// Optional authentication middleware
const optionalAuthenticate = (req, res, next) => {
  let token = null;
  if (req.cookies && req.cookies.token) token = req.cookies.token;
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    const { verifyToken } = require('../utils/jwt');
    const User = require('../models/User');
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        User.findById(decoded.userId).then((user) => {
          if (user && user.isActive) req.user = user;
          next();
        }).catch(() => next());
        return;
      }
    } catch (e) {}
  }
  next();
};

router.get('/forecast', optionalAuthenticate, weatherController.getForecast);
router.get('/trip-intelligence/:tripId', optionalAuthenticate, weatherController.getItineraryWeatherIntelligence);
router.post('/optimize', optionalAuthenticate, weatherController.optimizeWeatherItinerary);
router.post('/ai-command', optionalAuthenticate, weatherController.executeAiWeatherCommand);

// Legacy route compatibility
router.get('/:location', optionalAuthenticate, weatherController.getForecast);

module.exports = router;
