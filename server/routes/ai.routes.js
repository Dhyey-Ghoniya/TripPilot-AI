const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Optional auth middleware attachment helper (attaches req.user if token present, but doesn't block guests)
const optionalAuthenticate = (req, res, next) => {
  let token = null;
  if (req.cookies && req.cookies.token) token = req.cookies.token;
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    const { verifyToken } = require('../utils/jwt');
    const User = require('../models/User');
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        User.findById(decoded.userId).then((user) => {
          if (user && user.isActive) req.user = user;
          next();
        }).catch(() => next());
        return;
      }
    } catch (e) {
      // Continue as guest
    }
  }
  next();
};

router.post('/session', optionalAuthenticate, aiController.createOrGetSession);
router.post('/session/:id/message', optionalAuthenticate, aiController.handleMessage);

module.exports = router;
