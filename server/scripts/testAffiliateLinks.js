const assert = require('node:assert/strict');
const { applyAffiliateTracking, buildHotelSearchLink, buildTourLinks, hasActiveAffiliateLinks } = require('../services/affiliateLinks.service');

const run = () => {
  const bookingUrl = 'https://www.booking.com/searchresults.html?ss=Paris';
  const empty = {
    AFFILIATE_BOOKING_AID: '', AFFILIATE_AGODA_CID: '', AFFILIATE_GYG_PARTNER_ID: '', AFFILIATE_KLOOK_AID: '',
  };
  assert.equal(applyAffiliateTracking(bookingUrl, 'booking', empty), bookingUrl);
  assert.equal(hasActiveAffiliateLinks(empty), false);
  const hotelSearch = buildHotelSearchLink('New Delhi', empty);
  assert.equal(hotelSearch, 'https://www.booking.com/searchresults.html?ss=New%20Delhi');
  const tracked = applyAffiliateTracking(bookingUrl, 'booking', { ...empty, AFFILIATE_BOOKING_AID: 'test-aid-123' });
  assert.equal(new URL(tracked).searchParams.get('aid'), 'test-aid-123');
  assert.equal(new URL(buildHotelSearchLink('Paris', { AFFILIATE_BOOKING_AID: 'test-aid-123' })).searchParams.get('aid'), 'test-aid-123');
  assert.equal(hasActiveAffiliateLinks({ ...empty, AFFILIATE_BOOKING_AID: 'test-aid-123' }), true);
  const tours = buildTourLinks('New Delhi', { ...empty, AFFILIATE_KLOOK_AID: 'test-klook-id' });
  assert.ok(tours.links.every((link) => new URL(link.url).searchParams.size === 1));
  assert.equal(tours.affiliateDisclosure, false);
  console.log('Affiliate link checks passed: empty IDs preserve links; Booking aid is applied; unconfirmed tour formats stay untouched.');
};

if (require.main === module) run();
module.exports = { run };
