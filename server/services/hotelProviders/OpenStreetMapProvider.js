const imageService = require('../image.service');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// These are public community instances. Try the primary first and fail over
// only when it is unavailable, so a single overloaded host does not break stays.
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const HOTEL_TYPES = new Set(['hotel', 'motel', 'guest_house', 'hostel', 'apartment', 'chalet']);
const SEARCH_LIMIT = 100;
const DIRECTORY_CACHE_MS = 30 * 60 * 1000;
const geocodeCache = new Map();
const directoryCache = new Map();
const lastPhotoCache = new Map();
let lastGeocodeAt = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class OpenStreetMapProvider {
  constructor() {
    this.name = 'OpenStreetMap';
    this.code = 'OPENSTREETMAP';
    this.logoUrl = '';
  }

  async resolveDestination(destination) {
    const cacheKey = destination.trim().toLowerCase();
    const cached = geocodeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const remainingDelay = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
    if (remainingDelay) await wait(remainingDelay);
    lastGeocodeAt = Date.now();

    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('q', destination);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TripPilot/1.0 (user-requested hotel directory search)',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Destination lookup returned ${response.status}.`);

    const [place] = await response.json();
    if (!place) throw new Error(`Could not find "${destination}" on OpenStreetMap.`);

    const value = {
      lat: Number(place.lat),
      lng: Number(place.lon),
      address: place.address || {},
      displayName: place.display_name || destination,
      osmId: place.osm_id,
      osmType: place.osm_type,
    };
    geocodeCache.set(cacheKey, { value, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
    return value;
  }

  async fetchDirectory(destination, center) {
    const cacheKey = destination.trim().toLowerCase();
    const cached = directoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    // Filter to named properties before applying the output limit. Limiting all
    // lodging objects first can return only unnamed records in a dense city.
    const query = `[out:json][timeout:25];(nwr["tourism"~"^(hotel|motel|guest_house|hostel|apartment|chalet)$"]["name"](around:25000,${center.lat},${center.lng}););out tags center ${SEARCH_LIMIT};`;
    const failures = [];
    let data = null;
    for (const endpoint of OVERPASS_URLS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'User-Agent': 'TripPilot/1.0 (user-requested hotel directory search)',
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        if (payload.remark && !Array.isArray(payload.elements)) throw new Error(payload.remark);
        data = payload;
        break;
      } catch (error) {
        failures.push(`${new URL(endpoint).hostname}: ${error.message}`);
      }
    }
    if (!data) {
      throw new Error(`All OpenStreetMap search servers are unavailable. ${failures.join('; ')}`);
    }

    const locality = center.address.city || center.address.town || center.address.village || destination;
    const sourceUpdatedAt = data.osm3s?.timestamp_osm_base || null;
    const seen = new Set();
    const hotels = (data.elements || []).flatMap((element) => {
      const tags = element.tags || {};
      const name = (tags.name || tags['name:en'] || '').trim();
      const accommodationType = tags.tourism;
      const coordinates = element.center || element;
      if (!name || !HOTEL_TYPES.has(accommodationType) || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lon)) return [];

      const neighborhood = tags['addr:suburb'] || tags['addr:district'] || tags['addr:neighbourhood'] || '';
      const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
      const address = [street, neighborhood, tags['addr:city'] || locality, tags['addr:country']].filter(Boolean).join(', ');
      const identity = `${name.toLowerCase()}|${address.toLowerCase()}`;
      if (seen.has(identity)) return [];
      seen.add(identity);
      const providerSearch = encodeURIComponent(`${name} ${address || destination}`);

      return [{
        hotelId: `osm-${element.type}-${element.id}`,
        name,
        address: address || locality,
        neighborhood: neighborhood || null,
        coordinates: { lat: coordinates.lat, lng: coordinates.lon },
        accommodationType,
        amenities: [],
        pricePerNight: null,
        totalEstimate: null,
        images: [],
        coverImage: null,
        photo: null,
        providerName: 'OpenStreetMap',
        providerCode: this.code,
        providerLogo: '',
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${providerSearch}`,
        mapUrl: `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}#map=17/${coordinates.lat}/${coordinates.lon}`,
        inventoryVerified: false,
        dataQuality: 'openstreetmap_directory',
        sourceAttribution: '© OpenStreetMap contributors',
        sourceUpdatedAt,
      }];
    });

    const value = hotels.slice(0, SEARCH_LIMIT);
    directoryCache.set(cacheKey, { value, expiresAt: Date.now() + DIRECTORY_CACHE_MS });
    return value;
  }

  async attachVerifiedPhotos(hotels, destination) {
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < hotels.length) {
        const hotel = hotels[nextIndex++];
        const photoCacheKey = hotel.hotelId.toLowerCase();
        const cachedPhoto = lastPhotoCache.get(photoCacheKey);
        if (cachedPhoto && cachedPhoto.expiresAt > Date.now()) {
          hotel.photo = cachedPhoto.value;
          hotel.coverImage = cachedPhoto.value?.url || null;
          hotel.images = cachedPhoto.value ? [cachedPhoto.value.url] : [];
          continue;
        }

        const photo = await imageService.fetchVerifiedHotelPhoto(hotel.name, destination);
        lastPhotoCache.set(photoCacheKey, { value: photo, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
        hotel.photo = photo;
        hotel.coverImage = photo?.url || null;
        hotel.images = photo ? [photo.url] : [];
      }
    };

    await Promise.all(Array.from({ length: Math.min(3, hotels.length) }, worker));
    return hotels;
  }

  async searchHotels(searchParams = {}) {
    const destination = (searchParams.destination || '').trim();
    if (!destination) return [];

    const center = await this.resolveDestination(destination);
    const results = await this.fetchDirectory(destination, center);
    const matchingType = searchParams.accommodationType || searchParams.propertyType;
    const filtered = matchingType && matchingType !== 'all'
      ? results.filter((hotel) => hotel.accommodationType === matchingType.toLowerCase().replace(/\s+/g, '_'))
      : results;

    return this.attachVerifiedPhotos(filtered.slice(0, 12), destination);
  }
}

module.exports = new OpenStreetMapProvider();
