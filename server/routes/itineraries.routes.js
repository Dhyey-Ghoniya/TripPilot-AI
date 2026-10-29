const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itinerary.controller');
const { authenticate } = require('../middleware/auth.middleware');
const requireTripEditor = require('../middleware/requireTripEditor');

// Public shared itinerary lookup or protected
router.get('/:tripId', itineraryController.getItineraryByTrip);

// Protected editing routes
router.post('/:id/activities', authenticate, requireTripEditor, itineraryController.addActivity);
router.delete('/:id/days/:dayNumber/activities/:activityId', authenticate, requireTripEditor, itineraryController.deleteActivity);
router.put('/:id/days/:dayNumber/reorder', authenticate, requireTripEditor, itineraryController.reorderActivities);
router.post('/:id/days/:dayNumber/regenerate', authenticate, requireTripEditor, itineraryController.regenerateDay);

module.exports = router;

