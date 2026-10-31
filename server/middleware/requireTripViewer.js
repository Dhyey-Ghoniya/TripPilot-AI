const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const ApiResponse = require('../utils/apiResponse');
const { canViewTrip } = require('../utils/tripAccess');

module.exports = async function requireTripViewer(req, res, next) {
  const tripId = req.params.tripId;
  if (!mongoose.isValidObjectId(tripId)) {
    return ApiResponse.error(res, 'Trip not found.', 404);
  }

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) return ApiResponse.error(res, 'Trip not found.', 404);

    if (!canViewTrip(trip, req.user?._id)) {
      const statusCode = req.user ? 403 : 401;
      const message = req.user
        ? 'Access denied. You do not have permission to view this trip.'
        : 'Authentication required to view this private trip.';
      return ApiResponse.error(res, message, statusCode);
    }

    req.trip = trip;
    return next();
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return ApiResponse.error(res, 'Trip not found.', 404);
    }
    return next(error);
  }
};
