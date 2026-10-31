const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itinerary.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const requireTripEditor = require('../middleware/requireTripEditor');
const requireTripViewer = require('../middleware/requireTripViewer');

// Public trips may be viewed anonymously; private trips require an authorized viewer.
router.get('/:tripId', optionalAuth, requireTripViewer, itineraryController.getItineraryByTrip);

// Protected editing routes
router.post('/:id/activities', authenticate, requireTripEditor, itineraryController.addActivity);
router.delete('/:id/days/:dayNumber/activities/:activityId', authenticate, requireTripEditor, itineraryController.deleteActivity);
router.put('/:id/days/:dayNumber/reorder', authenticate, requireTripEditor, itineraryController.reorderActivities);
router.post('/:id/days/:dayNumber/regenerate', authenticate, requireTripEditor, itineraryController.regenerateDay);

module.exports = router;

