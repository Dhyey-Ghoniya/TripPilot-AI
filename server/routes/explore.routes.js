const express = require('express');
const router = express.Router();
const exploreController = require('../controllers/explore.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// GET /api/v1/explore - Explore page data (all 5 discovery sections)
router.get('/', optionalAuth, (req, res, next) => exploreController.getExploreData(req, res, next));

// POST /api/v1/explore/ai-discovery - Natural language AI discovery
router.post('/ai-discovery', optionalAuth, (req, res, next) => exploreController.handleAiDiscovery(req, res, next));

module.exports = router;
