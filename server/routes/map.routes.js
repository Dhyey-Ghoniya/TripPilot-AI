const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');

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

router.get('/geocode', optionalAuthenticate, mapController.geocode);
router.get('/reverse-geocode', optionalAuthenticate, mapController.reverseGeocode);
router.post('/route', optionalAuthenticate, mapController.calculateRoute);
router.get('/workspace/:tripId', optionalAuthenticate, mapController.getTripMapWorkspace);
router.post('/optimize-route', optionalAuthenticate, mapController.optimizeTripRoute);

module.exports = router;
