const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const imagesController = require('../controllers/images.controller');

const activityPhotoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/activity-photo', activityPhotoLimiter, (req, res, next) => imagesController.findActivityPhoto(req, res, next));

module.exports = router;
