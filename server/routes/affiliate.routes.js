const express = require('express');
const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');
const { buildHotelSearchLink, buildTourLinks } = require('../services/affiliateLinks.service');

const router = express.Router();
const affiliateLinkLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });

router.get('/tours', affiliateLinkLimiter, (req, res) => {
  const destination = String(req.query.destination || '').trim().slice(0, 120);
  if (!destination) return ApiResponse.error(res, 'A destination is required.', 400);
  return ApiResponse.success(res, buildTourLinks(destination));
});

router.get('/tours/redirect', affiliateLinkLimiter, (req, res) => {
  const destination = String(req.query.destination || '').trim().slice(0, 240);
  const providerName = String(req.query.provider || '').toLowerCase();
  if (!destination || !['klook', 'getyourguide'].includes(providerName)) {
    return ApiResponse.error(res, 'A supported provider and search term are required.', 400);
  }
  const result = buildTourLinks(destination);
  const provider = providerName === 'klook' ? 'Klook' : 'GetYourGuide';
  return res.redirect(302, result.links.find((link) => link.providerName === provider).url);
});

router.get('/hotels/redirect', affiliateLinkLimiter, (req, res) => {
  const destination = String(req.query.destination || '').trim().slice(0, 120);
  if (!destination) return ApiResponse.error(res, 'A destination is required.', 400);
  return res.redirect(302, buildHotelSearchLink(destination));
});

module.exports = router;
