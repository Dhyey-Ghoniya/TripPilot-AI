const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destination.controller');
const attractionController = require('../controllers/attraction.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Optional auth middleware so req.user is attached if user is logged in (for admin detection in public route)
const optionalAuth = (req, res, next) => {
  if (req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))) {
    return authenticate(req, res, next);
  }
  next();
};

// Public read routes
router.get('/', optionalAuth, destinationController.getDestinations);
router.get('/slug/:slug', destinationController.getDestinationBySlug);
router.get('/:id', destinationController.getDestinationById);
router.get('/:destinationId/attractions', attractionController.getAttractionsByDestination);

// Protected Admin-only write routes
router.post('/', authenticate, authorizeRoles('ADMIN'), destinationController.createDestination);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), destinationController.updateDestination);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), destinationController.deleteDestination);
router.patch('/:id/status', authenticate, authorizeRoles('ADMIN'), destinationController.toggleStatus);
router.patch('/:id/featured', authenticate, authorizeRoles('ADMIN'), destinationController.toggleFeatured);

module.exports = router;
