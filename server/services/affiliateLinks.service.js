const TRACKABLE_PARTNERS = {
  booking: {
    host: 'www.booking.com',
    envName: 'AFFILIATE_BOOKING_AID',
    parameter: 'aid',
  },
};

const applyAffiliateTracking = (url, partnerName, env = process.env) => {
  if (typeof url !== 'string' || !url) return url || null;
  const partner = String(partnerName || '').toLowerCase();
  const config = TRACKABLE_PARTNERS[partner];
  const affiliateId = config ? String(env[config.envName] || '').trim() : '';
  if (!config || !affiliateId) return url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== config.host) return url;
    parsed.searchParams.set(config.parameter, affiliateId);
    return parsed.toString();
  } catch {
    return url;
  }
};

const hasActiveAffiliateLinks = (env = process.env) =>
  Boolean(String(env.AFFILIATE_BOOKING_AID || '').trim());

const buildHotelSearchLink = (destination, env = process.env) => {
  const place = String(destination || '').trim();
  const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place)}`;
  return applyAffiliateTracking(url, 'booking', env);
};

const buildTourLinks = (destination, env = process.env) => {
  const place = String(destination || '').trim();
  const encoded = encodeURIComponent(place);
  const links = [
    { providerName: 'GetYourGuide', url: `https://www.getyourguide.com/s/?q=${encoded}` },
    { providerName: 'Klook', url: `https://www.klook.com/search/result/?query=${encoded}` },
  ];

  return {
    links: links.map((link) => ({
      ...link,
      // TODO: Confirm which query parameter carries AFFILIATE_GYG_PARTNER_ID in the GYG dashboard.
      // TODO: Confirm whether AFFILIATE_KLOOK_AID uses an `aid` query parameter; do not assume it does.
      url: applyAffiliateTracking(link.url, link.providerName, env),
    })),
    affiliateDisclosure: false,
  };
};

module.exports = { applyAffiliateTracking, buildHotelSearchLink, buildTourLinks, hasActiveAffiliateLinks };
