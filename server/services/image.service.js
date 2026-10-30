/**
 * Multi-Provider Hybrid Image Service for TripPilot AI
 * Fetches authentic, high-resolution location and attraction photos.
 * 
 * Provider Cascade:
 * 1. Google Places Photos API (if GOOGLE_MAPS_API_KEY is present)
 * 2. Unsplash API (if UNSPLASH_ACCESS_KEY is present)
 * 3. Wikimedia Commons / Wikipedia API (Free, zero API key required fallback)
 * 4. Destination-Specific Curated Unsplash Pool
 */

// Comprehensive destination photo repository to prevent duplicates
const CURATED_LOCATION_POOLS = {
  genoa: [
    'https://files.manuscdn.com/search-media/310519664045938778/uOMAKrlelMWSdUA3v6LANy/n7rkvMPaFT9YWe5hdHDJeC.jpg',
    'https://files.manuscdn.com/search-media/310519664045938778/uOMAKrlelMWSdUA3v6LANy/KKrcnM6d9gwqS5b4KUQDG7.jpg',
  ],
  genoaItaly: [
    'https://files.manuscdn.com/search-media/310519664045938778/uOMAKrlelMWSdUA3v6LANy/n7rkvMPaFT9YWe5hdHDJeC.jpg',
  ],
  reykjavik: [
    'https://files.manuscdn.com/search-media/310519664045938778/uOMAKrlelMWSdUA3v6LANy/Zax5FiWBjZjBcSMSiRtmXn.jpg',
    'https://files.manuscdn.com/search-media/310519664045938778/uOMAKrlelMWSdUA3v6LANy/Umjteqz7aWz8mhqi7NHXiU.jpg',
  ],
  london: [
    'https://files.manuscdn.com/search-media/310519664045938778/uOMAKrlelMWSdUA3v6LANy/96nNHG3ZNuxPHkYkSJYEU.jpeg',
    'https://files.manuscdn.com/search-media/310519664045938778/uOMAKrlelMWSdUA3v6LANy/vPfBgYFpShkvUpfrYPi4HW.webp',
  ],
  bangalore: [
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80', // Bangalore Palace Heritage
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80', // Lalbagh Botanical Gardens
    'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80', // Authentic Dosa & Filter Coffee
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80', // Cubbon Park Canopy
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80', // Commercial Street Market
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', // Indiranagar Lounge
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // Ulsoor Lake
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // Nandi Hills Viewpoint
  ],
  bengaluru: [
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
  ],
  dubai: [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', // Burj Khalifa
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80', // Marina Waterfront
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80', // Desert Safari
    'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=800&q=80', // Palm Jumeirah
  ],
  tokyo: [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', // Shibuya Crossing
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', // Sensoji Temple
    'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=800&q=80', // Shinjuku Skyline
  ],
  delhi: [
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', // India Gate
    'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=800&q=80', // Red Fort
  ],
  goa: [
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80', // Palolem Beach
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', // Basilica of Bom Jesus
  ],
  paris: [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', // Eiffel Tower
    'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=80', // Louvre Museum
  ],
};

class ImageService {
  constructor() {
    this.activityPhotoCache = new Map();
    this.tripPhotoUsage = new Map();
  }

  async fetchActivityPhoto({ activity, location = '', destination = '', tripKey = '', excludeUrls = [] }) {
    const activityText = `${activity} ${location}`.toLowerCase();
    let referenceSubject = '';
    if (/lunch|dinner|breakfast|food|restaurant|bistro|culinary|meal|cuisine/.test(activityText)) {
      const cuisine = destination.toLowerCase().includes('goa') ? 'Goan cuisine' : 'regional cuisine';
      referenceSubject = `${destination} ${cuisine} food`;
    } else if (/beach|promenade|walk|leisure|waterfront|coast|swim|sunset/.test(activityText)) {
      referenceSubject = `${destination} beach coast`;
    } else if (/historic|heritage|fort|church|museum|monument|palace/.test(activityText)) {
      referenceSubject = `${destination} fort church heritage`;
    } else if (/market|bazaar|shopping/.test(activityText)) {
      referenceSubject = `${destination} market bazaar`;
    } else if (/airport|station|departure|arrival|journey|flight|train|transfer/.test(activityText)) {
      referenceSubject = `${destination} airport station`;
    } else if (/hotel|check.?in|resort|stay|accommodation/.test(activityText)) {
      referenceSubject = `${destination} hotel resort`;
    } else if (destination) {
      referenceSubject = `${destination} landmark`;
    }

    const queries = [
      [activity, location, destination].filter(Boolean).join(' '),
      referenceSubject,
      [activity, destination].filter(Boolean).join(' '),
    ].filter((query, index, list) => query && list.indexOf(query) === index);
    const excluded = new Set(excludeUrls);
    let tripUsed = new Set();
    if (tripKey) {
      tripUsed = this.tripPhotoUsage.get(tripKey) || new Set();
      this.tripPhotoUsage.set(tripKey, tripUsed);
    }

    for (const query of queries) {
      const cacheKey = query.toLowerCase();
      let photos = this.activityPhotoCache.get(cacheKey);
      if (!photos) {
        photos = await this.searchWikimediaCommons(query, destination);
        this.activityPhotoCache.set(cacheKey, photos);
      }
      const photo = photos.find((candidate) => !excluded.has(candidate.url) && !tripUsed.has(candidate.url));
      if (photo) {
        if (tripKey) {
          tripUsed.add(photo.url);
          if (this.tripPhotoUsage.size > 500) {
            this.tripPhotoUsage.delete(this.tripPhotoUsage.keys().next().value);
          }
        }
        return {
          ...photo,
          matchType: query === referenceSubject ? 'reference' : 'activity',
        };
      }
    }

    return null;
  }

  async searchWikimediaCommons(query, destination = '') {
    try {
      const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: query,
        gsrnamespace: '6',
        gsrlimit: '10',
        prop: 'imageinfo|categories',
        cllimit: '50',
        iiprop: 'mime|url|extmetadata',
        iiurlwidth: '800',
        iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|ObjectName',
        format: 'json',
        origin: '*',
      });
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TripPilot/1.0 (travel itinerary photo search)',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return [];

      const data = await response.json();
      return Object.values(data?.query?.pages || {}).flatMap((page) => {
        const info = page.imageinfo?.[0];
        const metadata = info?.extmetadata || {};
        const url = info?.thumburl || info?.url;
        const categoryNames = (page.categories || []).map((category) => category.title.toLowerCase());
        const fileName = page.title.toLowerCase();
        const searchableMetadata = `${fileName} ${categoryNames.join(' ')}`;
        const destinationTerms = destination.toLowerCase()
          .replace(/[^a-z0-9 ]/g, ' ')
          .split(/\s+/)
          .filter((term) => term.length > 2 && !['central', 'north', 'south', 'east', 'west', 'city', 'region'].includes(term));
        const isLikelyIllustration = /ai[- ]generated|generated with ai|illustration|digital art|rendering|diagram|map\./i.test(fileName);
        const isTaggedAsAi = categoryNames.some((category) => /ai[- ]generated|generated by artificial intelligence/.test(category));
        const matchesDestination = destinationTerms.length === 0 || destinationTerms.some((term) => searchableMetadata.includes(term));
        if (!url || !info?.descriptionurl || !/^image\/(jpeg|png|webp)$/i.test(info.mime || '') || isLikelyIllustration || isTaggedAsAi || !matchesDestination) return [];

        const stripHtml = (value = '') => value
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .trim();
        const artist = stripHtml(metadata.Artist?.value || metadata.Credit?.value || '');
        const licenseName = stripHtml(metadata.LicenseShortName?.value || '');
        const licenseUrl = metadata.LicenseUrl?.value || '';
        if (!licenseName) return [];

        return [{
          url,
          sourceUrl: info.descriptionurl,
          title: stripHtml(metadata.ObjectName?.value || page.title.replace(/^File:/, '')),
          fileTitle: page.title.replace(/^File:/, ''),
          attribution: artist,
          licenseName,
          licenseUrl,
        }];
      });
    } catch (error) {
      console.warn('[ImageService] Wikimedia Commons activity photo search failed:', error.message);
      return [];
    }
  }

  async fetchVerifiedHotelPhoto(hotelName, destination = '') {
    const query = `${hotelName} ${destination} hotel`;
    const photos = await this.searchWikimediaCommons(query, destination);
    const genericTerms = new Set(['hotel', 'resort', 'guesthouse', 'guest', 'house', 'hostel', 'apartments', 'apartment', 'the', 'and', 'of', 'in', 'at']);
    const hotelTerms = hotelName
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2 && !genericTerms.has(term));

    if (hotelTerms.length === 0) return null;

    return photos.find((photo) => {
      const searchable = `${photo.title} ${photo.fileTitle}`.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
      const matchedTerms = hotelTerms.filter((term) => searchable.includes(term));
      const coverage = matchedTerms.length / hotelTerms.length;
      const hasDistinctiveTerm = matchedTerms.some((term) => term.length >= 5);
      return coverage >= 0.75 && hasDistinctiveTerm;
    }) || null;
  }

  /**
   * Main entry point to fetch authentic photo URL for a destination/attraction
   */
  async fetchPhoto(query, destination = '', offset = 0) {
    if (!query) return this.getFallbackPhoto(destination, offset);

    const cleanQ = query.trim();
    
    try {
      // 1. Try Unsplash API first (Instant high-res photo search)
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
      if (unsplashKey && !unsplashKey.includes('mock')) {
        const unsplashPhoto = await this.fetchFromUnsplash(cleanQ, unsplashKey);
        if (unsplashPhoto) return unsplashPhoto;
      }

      // 2. Try Google Places API if key available
      const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
      if (googleKey && !googleKey.includes('mock')) {
        const googlePhoto = await this.fetchFromGooglePlaces(cleanQ, googleKey);
        if (googlePhoto) return googlePhoto;
      }

      // 3. Try Wikipedia Commons API (Free, 0 API Keys required)
      const wikiPhoto = await this.fetchFromWikipedia(cleanQ);
      if (wikiPhoto) return wikiPhoto;
    } catch (err) {
      console.warn('[ImageService] Provider error, using curated pool fallback:', err.message);
    }

    // 4. Guaranteed Fallback to Curated Pool (never returns undefined)
    return this.getFallbackPhoto(destination || cleanQ, offset);
  }

  /**
   * Google Places Photos API lookup (Supports both Places API New & Legacy)
   */
  async fetchFromGooglePlaces(query, apiKey) {
    try {
      // 1. Try Places API (New)
      const newApiUrl = 'https://places.googleapis.com/v1/places:searchText';
      const newRes = await fetch(newApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.photos,places.id,places.displayName',
        },
        body: JSON.stringify({ textQuery: query }),
        signal: AbortSignal.timeout(3000),
      });

      if (newRes.ok) {
        const newData = await newRes.json();
        const photoName = newData?.places?.[0]?.photos?.[0]?.name;
        if (photoName) {
          return `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=800`;
        }
      }

      // 2. Try Legacy Places TextSearch API
      const legacyUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      const legacyRes = await fetch(legacyUrl, { signal: AbortSignal.timeout(3000) });
      const legacyData = await legacyRes.json();

      if (legacyData?.results?.[0]?.photos?.[0]?.photo_reference) {
        const photoRef = legacyData.results[0].photos[0].photo_reference;
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
      }
    } catch (err) {
      console.warn('[ImageService] Google Places API lookup warning:', err.message);
    }
    return null;
  }

  /**
   * Unsplash API lookup
   */
  async fetchFromUnsplash(query, apiKey) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
      const response = await fetch(url, {
        headers: { Authorization: `Client-ID ${apiKey}` },
        signal: AbortSignal.timeout(3000),
      });
      const data = await response.json();

      if (data?.results?.[0]?.urls?.regular) {
        return data.results[0].urls.regular;
      }
    } catch (err) {
      console.warn('[ImageService] Unsplash API lookup failed:', err.message);
    }
    return null;
  }

  /**
   * Wikipedia Commons API (Zero API key required)
   */
  async fetchFromWikipedia(query) {
    try {
      const formattedTitle = query
        .replace(/visit|explore|tour|enjoy|lunch|dinner|breakfast|stroll|evening/gi, '')
        .trim();

      if (!formattedTitle) return null;

      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(formattedTitle)}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const data = await response.json();

      const pages = data?.query?.pages;
      if (pages) {
        const firstPageId = Object.keys(pages)[0];
        if (firstPageId && firstPageId !== '-1' && pages[firstPageId]?.thumbnail?.source) {
          return pages[firstPageId].thumbnail.source;
        }
      }
    } catch (err) {
      console.warn('[ImageService] Wikipedia API lookup failed:', err.message);
    }
    return null;
  }

  /**
   * Fallback curated authentic photos pool by destination
   */
  getFallbackPhoto(destStr = '', offset = 0) {
    const destClean = destStr.toLowerCase().replace(/[^a-z]/g, '');
    let pool = null;

    for (const key of Object.keys(CURATED_LOCATION_POOLS)) {
      if (destClean.includes(key)) {
        pool = CURATED_LOCATION_POOLS[key];
        break;
      }
    }

    if (!pool || pool.length === 0) {
      pool = CURATED_LOCATION_POOLS.bangalore;
    }

    const idx = Math.abs(offset) % pool.length;
    return pool[idx];
  }
}

module.exports = new ImageService();
