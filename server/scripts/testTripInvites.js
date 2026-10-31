const assert = require('node:assert/strict');
const Trip = require('../models/Trip');
const tripService = require('../services/trip.service');
const requireTripViewer = require('../middleware/requireTripViewer');

const tripId = '66a000000000000000000001';
const ownerId = '66a000000000000000000002';
const memberId = '66a000000000000000000003';

async function run() {
  const originalFindById = Trip.findById;
  const originalFindOne = Trip.findOne;
  const trips = new Map();
  Trip.findById = async (id) => trips.get(String(id)) || null;
  Trip.findOne = async ({ 'shareSettings.inviteCode': inviteCode }) =>
    [...trips.values()].find((trip) => trip.shareSettings.inviteCode === inviteCode) || null;

  try {
    const savedTrip = {
      _id: tripId,
      userId: ownerId,
      title: 'Test trip',
      shareSettings: { isPublic: false, inviteCode: null },
      collaborators: [],
      save: async () => {},
    };
    trips.set(tripId, savedTrip);

    const invite = await tripService.getTripInvite(tripId, ownerId);
    assert.equal(invite.inviteCode.length, 24);
    await assert.rejects(tripService.getTripInvite(tripId, memberId), /Only the trip owner/);
    const firstJoin = await tripService.joinTripByInvite(invite.inviteCode, memberId);
    assert.equal(firstJoin.role, 'editor');
    assert.equal(savedTrip.collaborators.length, 1);
    const repeatJoin = await tripService.joinTripByInvite(invite.inviteCode, memberId);
    assert.equal(repeatJoin.role, 'editor');
    assert.equal(savedTrip.collaborators.length, 1);

    const rotated = await tripService.getTripInvite(tripId, ownerId, true);
    assert.notEqual(rotated.inviteCode, invite.inviteCode);
    await assert.rejects(tripService.joinTripByInvite(invite.inviteCode, memberId), /invalid or has expired/);

    const checkViewer = async ({ userId, isPublic = false, expectedStatus = 200 }) => {
      const req = { params: { tripId }, user: userId ? { _id: userId } : undefined };
      let statusCode;
      let body;
      let continued = false;
      const res = { status(code) { statusCode = code; return this; }, json(value) { body = value; return this; } };
      const next = () => { continued = true; };
      savedTrip.shareSettings.isPublic = isPublic;
      await requireTripViewer(req, res, next);
      assert.equal(continued ? 200 : statusCode, expectedStatus);
      if (continued) assert.equal(req.trip, savedTrip);
      else assert.equal(body.success, false);
    };

    await checkViewer({ userId: ownerId });
    await checkViewer({ userId: memberId });
    await checkViewer({ isPublic: true });
    await checkViewer({ expectedStatus: 401 });
    await checkViewer({ userId: '66a000000000000000000004', expectedStatus: 403 });
    const invalidRes = { status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    await requireTripViewer({ params: { tripId: 'bad-id' } }, invalidRes, () => assert.fail('Invalid trip IDs must not pass'));
    assert.equal(invalidRes.statusCode, 404);

    console.log('Trip invite join, idempotence, rotation, and viewer access checks passed.');
  } finally {
    Trip.findById = originalFindById;
    Trip.findOne = originalFindOne;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
