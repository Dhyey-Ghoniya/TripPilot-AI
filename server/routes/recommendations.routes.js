const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/apiResponse');

router.post('/generate', (req, res) => {
  return ApiResponse.success(res, null, 'AI Recommendation generation placeholder for future module.');
});

module.exports = router;
