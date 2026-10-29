const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const itineraryController = require('../controllers/itinerary.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public shared trip retrieval
router.get('/share/:shareCode', tripController.getSharedTrip);

// Protected routes (require user login)
router.use(authenticate);

router.get('/', tripController.getMyTrips);
router.post('/', tripController.createTrip);
router.get('/analytics/completed', tripController.getCompletedTripsAnalytics);

router.get('/:id', tripController.getTripById);
router.put('/:id/sharing', tripController.setSharing);
router.get('/:id/collaborators', tripController.getCollaborators);
router.post('/:id/collaborators', tripController.addCollaborator);
router.delete('/:id/collaborators/:userId', tripController.removeCollaborator);
router.get('/:id/conversation', tripController.getConversation);
router.post('/:id/conversation', tripController.postConversation);
router.put('/:id', tripController.updateTrip);
router.post('/:id/duplicate', tripController.duplicateTrip);
router.put('/:id/archive', tripController.archiveTrip);
router.put('/:id/complete', tripController.markCompleted);
router.get('/:id/export', tripController.exportTrip);
router.delete('/:id', tripController.deleteTrip);

// AI Trip Assistant command execution
router.post('/:tripId/ai-command', itineraryController.executeAiTripCommand);

module.exports = router;
