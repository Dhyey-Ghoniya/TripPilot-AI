const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Optional auth for public browsing
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

// GET /api/activities/search & POST /api/activities/search
router.get('/search', optionalAuthenticate, activityController.searchActivities);
router.post('/search', optionalAuthenticate, activityController.searchActivities);

// Trip integration endpoints
router.post('/add', authenticate, activityController.addActivityToTrip);
router.post('/remove', authenticate, activityController.removeActivityFromTrip);
router.post('/replace', authenticate, activityController.replaceActivityInTrip);
router.post('/move', authenticate, activityController.moveActivityInTrip);
router.post('/optimize', authenticate, activityController.optimizeTripActivities);

module.exports = router;
