const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const destinationsRoutes = require('./destinations.routes');
const attractionsRoutes = require('./attractions.routes');
const wishlistRoutes = require('./wishlist.routes');
const tripsRoutes = require('./trips.routes');
const itinerariesRoutes = require('./itineraries.routes');
const recommendationsRoutes = require('./recommendations.routes');
const exploreRoutes = require('./explore.routes');
const budgetRoutes = require('./budget.routes');
const weatherRoutes = require('./weather.routes');
const adminRoutes = require('./admin.routes');
const aiRoutes = require('./ai.routes');
const travelRoutes = require('./travel.routes');
const flightsRoutes = require('./flights.routes');
const hotelsRoutes = require('./hotels.routes');
const activitiesRoutes = require('./activities.routes');
const mapRoutes = require('./map.routes');
const journalRoutes = require('./journal.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users/wishlist', wishlistRoutes);
router.use('/users', usersRoutes);
router.use('/destinations', destinationsRoutes);
router.use('/attractions', attractionsRoutes);
router.use('/trips', tripsRoutes);
router.use('/itineraries', itinerariesRoutes);
router.use('/recommendations', exploreRoutes);
router.use('/explore', exploreRoutes);
router.use('/budget', budgetRoutes);
router.use('/weather', weatherRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);
router.use('/travel', travelRoutes);
router.use('/flights', flightsRoutes);
router.use('/hotels', hotelsRoutes);
router.use('/activities', activitiesRoutes);
router.use('/map', mapRoutes);
router.use('/journals', journalRoutes);
router.use('/journal', journalRoutes);

module.exports = router;


