const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const { assertTripEditAccess } = require('../utils/tripAccess');

module.exports = async function requireTripEditor(req, res, next) {
  try {
    const tripId = req.params.tripId || req.params.id || req.body.tripId || req.body.id;
    if (!tripId) return res.status(400).json({ success: false, message: 'Trip id is required.' });
    let trip = await Trip.findById(tripId);
    if (!trip) {
      const itinerary = await Itinerary.findById(tripId).select('tripId');
      if (itinerary?.tripId) trip = await Trip.findById(itinerary.tripId);
    }
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    assertTripEditAccess(trip, req.user?._id);
    req.trip = trip;
    next();
  } catch (error) {
    next(error);
  }
};
