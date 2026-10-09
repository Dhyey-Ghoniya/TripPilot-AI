const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flight.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public / Guest optional search route
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

router.post('/search', optionalAuthenticate, flightController.searchFlights);
router.post('/attach', authenticate, flightController.attachFlightToTrip);
router.post('/ai-command', optionalAuthenticate, flightController.executeAiFlightCommand);

module.exports = router;
