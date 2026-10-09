const express = require('express');
const router = express.Router();
const attractionController = require('../controllers/attraction.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Optional auth helper to check admin role in public routes
const optionalAuth = (req, res, next) => {
  if (req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))) {
    return authenticate(req, res, next);
  }
  next();
};

// Public read routes
router.get('/', optionalAuth, attractionController.getAttractions);
router.get('/nearby', attractionController.getNearbyAttractions);
router.get('/slug/:slug', attractionController.getAttractionBySlug);
router.get('/:id', attractionController.getAttractionById);

// Protected Admin-only write routes
router.post('/', authenticate, authorizeRoles('ADMIN'), attractionController.createAttraction);
router.put('/:id', authenticate, authorizeRoles('ADMIN'), attractionController.updateAttraction);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), attractionController.deleteAttraction);
router.patch('/:id/status', authenticate, authorizeRoles('ADMIN'), attractionController.toggleStatus);
router.patch('/:id/featured', authenticate, authorizeRoles('ADMIN'), attractionController.toggleFeatured);

module.exports = router;
