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
