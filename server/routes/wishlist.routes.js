const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All wishlist routes require user authentication
router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.get('/status/:destinationId', wishlistController.checkWishlistStatus);
router.post('/:destinationId', wishlistController.addToWishlist);
router.delete('/:destinationId', wishlistController.removeFromWishlist);

module.exports = router;
