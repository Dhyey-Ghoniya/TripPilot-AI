const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mapProvider = require('../services/mapProviders/MapProvider');

const root = path.resolve(__dirname, '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

(async () => {
  const walking = await mapProvider.calculateRoute({ lat: 28.6139, lng: 77.209 }, { lat: 28.62, lng: 77.215 }, 'Walking');
  const taxi = await mapProvider.calculateRoute({ lat: 28.6139, lng: 77.209 }, { lat: 28.62, lng: 77.215 }, 'Taxi');
  assert.equal(walking.transportMode, 'Walking');
  assert.equal(taxi.transportMode, 'Taxi');
  assert.notEqual(walking.durationMinutes, taxi.durationMinutes);

  const routes = read('client/src/routes/AppRoutes.jsx');
  const sharedPage = read('client/src/pages/public/SharedTrip.jsx');
  const tripService = read('client/src/services/tripService.js');
  assert.match(routes, /\/share\/trip\/:shareCode/);
  assert.match(sharedPage, /getSharedTrip\(shareCode\)/);
  assert.match(tripService, /\/trips\/share\/\$\{shareCode\}/);

  const planner = read('client/src/pages/public/AiPlanner.jsx');
  const login = read('client/src/pages/public/Login.jsx');
  const register = read('client/src/pages/public/Register.jsx');
  assert.match(planner, /savePendingTripSession/);
  assert.match(login, /getPendingTripSession/);
  assert.match(login, /navigate\('\/plan-trip'/);
  assert.match(register, /getPendingTripSession/);
  assert.match(register, /navigate\('\/plan-trip'/);

  const mapClient = read('client/src/components/workspace/MapView.jsx');
  const mapServer = read('server/services/map.service.js');
  assert.match(mapClient, /getTripMapWorkspace\(trip\._id, selectedDay, activeMode\)/);
  assert.match(mapServer, /requestedMode/);

  const chat = read('client/src/components/chat/TripPilotChat.jsx');
  assert.match(chat, /Price unavailable/);
  assert.doesNotMatch(chat, /\|\| 14500/);
  assert.doesNotMatch(chat, /\|\| 4500/);
  assert.match(chat, /Start with one thing/);
  for (const action of ['Plan a trip', 'Flights', 'Hotels', 'Getting in', 'Local SIM', 'Travel insurance', 'Talk to an expert']) {
    assert.match(chat, new RegExp(action));
  }

  console.log('PHASE3_REGRESSIONS=passed');
})().catch((error) => {
  console.error(`PHASE3_REGRESSIONS=failed: ${error.message}`);
  process.exitCode = 1;
});
