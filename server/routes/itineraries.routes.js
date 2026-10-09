const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itinerary.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public shared itinerary lookup or protected
router.get('/:tripId', itineraryController.getItineraryByTrip);

// Protected editing routes
router.post('/:id/activities', authenticate, itineraryController.addActivity);
router.delete('/:id/days/:dayNumber/activities/:activityId', authenticate, itineraryController.deleteActivity);
router.put('/:id/days/:dayNumber/reorder', authenticate, itineraryController.reorderActivities);
router.post('/:id/days/:dayNumber/regenerate', authenticate, itineraryController.regenerateDay);

module.exports = router;

