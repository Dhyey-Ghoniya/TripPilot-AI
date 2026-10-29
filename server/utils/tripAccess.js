const idEquals = (left, right) => Boolean(left && right && String(left) === String(right));

const isTripOwner = (trip, userId) => idEquals(trip?.userId?._id || trip?.userId, userId);

const getCollaborator = (trip, userId) => (trip?.collaborators || []).find((member) =>
  idEquals(member.userId?._id || member.userId, userId)
);

const canViewTrip = (trip, userId) => Boolean(
  isTripOwner(trip, userId) || getCollaborator(trip, userId) || trip?.shareSettings?.isPublic
);

const canEditTrip = (trip, userId) => Boolean(
  isTripOwner(trip, userId) || getCollaborator(trip, userId)?.role === 'editor'
);

const assertTripEditAccess = (trip, userId) => {
  if (!canEditTrip(trip, userId)) {
    const error = new Error('You need trip owner or editor access to make changes.');
    error.statusCode = 403;
    throw error;
  }
};

module.exports = { isTripOwner, getCollaborator, canViewTrip, canEditTrip, assertTripEditAccess };
