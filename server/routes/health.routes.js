const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TripPilot AI API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    module: 'Module 1 - Foundation & UI System',
  });
});

module.exports = router;
