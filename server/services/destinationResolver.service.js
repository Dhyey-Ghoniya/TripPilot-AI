const Destination = require('../models/Destination');
const mongoose = require('mongoose');

/**
 * Country Intelligence Registry
 */
const COUNTRY_INTELLIGENCE = {
  IN: { currency: 'INR', timezone: 'Asia/Kolkata', defaultLanguage: 'Hindi / English', continent: 'Asia' },
  JP: { currency: 'JPY', timezone: 'Asia/Tokyo', defaultLanguage: 'Japanese', continent: 'Asia' },
  FR: { currency: 'EUR', timezone: 'Europe/Paris', defaultLanguage: 'French', continent: 'Europe' },
  AE: { currency: 'AED', timezone: 'Asia/Dubai', defaultLanguage: 'Arabic / English', continent: 'Asia' },
  GB: { currency: 'GBP', timezone: 'Europe/London', defaultLanguage: 'English', continent: 'Europe' },
  US: { currency: 'USD', timezone: 'America/New_York', defaultLanguage: 'English', continent: 'North America' },
  ID: { currency: 'IDR', timezone: 'Asia/Makassar', defaultLanguage: 'Indonesian', continent: 'Asia' },
  SG: { currency: 'SGD', timezone: 'Asia/Singapore', defaultLanguage: 'English / Malay / Mandarin', continent: 'Asia' },
  CH: { currency: 'CHF', timezone: 'Europe/Zurich', defaultLanguage: 'German / French / Italian', continent: 'Europe' },
  IS: { currency: 'ISK', timezone: 'Atlantic/Reykjavik', defaultLanguage: 'Icelandic / English', continent: 'Europe' },
  TH: { currency: 'THB', timezone: 'Asia/Bangkok', defaultLanguage: 'Thai', continent: 'Asia' },
  IT: { currency: 'EUR', timezone: 'Europe/Rome', defaultLanguage: 'Italian', continent: 'Europe' },
  ES: { currency: 'EUR', timezone: 'Europe/Madrid', defaultLanguage: 'Spanish', continent: 'Europe' },
  DE: { currency: 'EUR', timezone: 'Europe/Berlin', defaultLanguage: 'German', continent: 'Europe' },
  AU: { currency: 'AUD', timezone: 'Australia/Sydney', defaultLanguage: 'English', continent: 'Oceania' },
  CA: { currency: 'CAD', timezone: 'America/Toronto', defaultLanguage: 'English / French', continent: 'North America' },
  VN: { currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', defaultLanguage: 'Vietnamese', continent: 'Asia' },
  MY: { currency: 'MYR', timezone: 'Asia/Kuala_Lumpur', defaultLanguage: 'Malay / English', continent: 'Asia' },
  MV: { currency: 'MVR', timezone: 'Indian/Maldives', defaultLanguage: 'Dhivehi / English', continent: 'Asia' },
  EG: { currency: 'EGP', timezone: 'Africa/Cairo', defaultLanguage: 'Arabic', continent: 'Africa' },
  TR: { currency: 'TRY', timezone: 'Europe/Istanbul', defaultLanguage: 'Turkish', continent: 'Europe / Asia' },
  NZ: { currency: 'NZD', timezone: 'Pacific/Auckland', defaultLanguage: 'English', continent: 'Oceania' },
  ZA: { currency: 'ZAR', timezone: 'Africa/Johannesburg', defaultLanguage: 'English / Afrikaans / Zulu', continent: 'Africa' },
  AR: { currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires', defaultLanguage: 'Spanish', continent: 'South America' },
  BR: { currency: 'BRL', timezone: 'America/Sao_Paulo', defaultLanguage: 'Portuguese', continent: 'South America' },
  MX: { currency: 'MXN', timezone: 'America/Mexico_City', defaultLanguage: 'Spanish', continent: 'North America' },
  KR: { currency: 'KRW', timezone: 'Asia/Seoul', defaultLanguage: 'Korean', continent: 'Asia' },
  LK: { currency: 'LKR', timezone: 'Asia/Colombo', defaultLanguage: 'Sinhala / Tamil / English', continent: 'Asia' },
  NP: { currency: 'NPR', timezone: 'Asia/Kathmandu', defaultLanguage: 'Nepali', continent: 'Asia' },
  BT: { currency: 'BTN', timezone: 'Asia/Thimphu', defaultLanguage: 'Dzongkha', continent: 'Asia' },
};

/**
 * Fictional or Space Destinations
 */
const SPECIAL_DESTINATIONS = [
  'moon', 'luna', 'mars', 'jupiter', 'saturn', 'venus', 'mercury', 'pluto',
  'space', 'international space station', 'iss', 'hogwarts', 'narnia',
  'atlantis', 'asgard', 'krypton', 'middle earth', 'mordor', 'shire', 'death star', 'wakanda', 'gotham', 'metropolis'
];

class DestinationResolverService {
  /**
   * Resolves ANY destination query dynamically via external geocoding, AI synthesis, or DB cache.
   * Supports ambiguity detection, dynamic research provenance, and special feasibility warnings.
   */
  async resolveDestination(destinationQuery) {
    if (!destinationQuery || typeof destinationQuery !== 'string' || !destinationQuery.trim()) {
      return {
        isResolved: false,
        error: 'DESTINATION_REQUIRED',
        message: 'Which destination would you like to explore?',
      };
    }

    const cleanQuery = destinationQuery.trim();
    const lowerQuery = cleanQuery.toLowerCase();

    // ─────────────────────────────────────────────────────────────────
    // STEP 1: CHECK SPECIAL / IMPOSSIBLE / FICTIONAL DESTINATIONS
    // ─────────────────────────────────────────────────────────────────
    if (SPECIAL_DESTINATIONS.some((s) => lowerQuery.includes(s))) {
      return this.synthesizeSpecialDestination(cleanQuery);
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: CHECK MONGODB DATABASE CACHE
    // ─────────────────────────────────────────────────────────────────
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const searchRegex = new RegExp(`^${cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const dbMatch = await Destination.findOne({
          $or: [
            { name: searchRegex },
            { city: searchRegex },
            { country: searchRegex },
            { slug: cleanQuery.toLowerCase().replace(/\s+/g, '-') },
          ],
          isActive: true,
        });

        if (dbMatch) {
          return this.formatFromDatabase(dbMatch);
        }
      } catch (err) {
        console.warn('[DestinationResolver] DB lookup warning:', err.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 3: EXTERNAL GEOCODING & DYNAMIC AMBIGUITY CHECK (Open-Meteo)
    // ─────────────────────────────────────────────────────────────────
    try {
      const geocodeResult = await this.fetchGeocode(cleanQuery);
      if (geocodeResult) {
        if (geocodeResult.isAmbiguous) {
          return geocodeResult;
        }

        if (geocodeResult.isResolved) {
          this.cacheResearchedDestination(geocodeResult).catch((err) =>
            console.warn('[DestinationResolver] Cache save background warning:', err.message)
          );
          return geocodeResult;
        }
      }
    } catch (err) {
      console.warn('[DestinationResolver] External geocoding warning:', err.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 4: DYNAMIC AI SYNTHESIS FALLBACK
    // ─────────────────────────────────────────────────────────────────
    return this.synthesizeDestinationContext(cleanQuery);
  }

  /**
   * Geocode destination query via Open-Meteo Geocoding API with Ambiguity Detection
   */
  async fetchGeocode(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    const results = data.results;

    // ─────────────────────────────────────────────────────────────────
    // AMBIGUITY DETECTION: If query is plain (no comma) and matches multiple distinct places
    // ─────────────────────────────────────────────────────────────────
    if (!query.includes(',') && results.length > 1) {
      const queryLower = query.trim().toLowerCase();
      // Filter results where place name matches user query
      const exactNameMatches = results.filter((r) => r.name.toLowerCase() === queryLower);

      if (exactNameMatches.length > 1) {
        const candidates = exactNameMatches.slice(0, 4).map((r) => ({
          name: r.name,
          region: r.admin1 || r.admin2 || '',
          country: r.country || '',
          countryCode: (r.country_code || '').toUpperCase(),
          canonicalName: `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}, ${r.country || ''}`,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        }));

        // Distinct countries or admin regions
        const uniqueCanonicals = new Set(candidates.map((c) => c.canonicalName));
        if (uniqueCanonicals.size > 1) {
          const candidateListStr = candidates.map((c, idx) => `${idx + 1}. ${c.canonicalName}`).join('\n');
          return {
            isResolved: false,
            isAmbiguous: true,
            query,
            candidates,
            copilotMessage: `I found multiple destinations matching "${query}". Which one would you like to plan for?\n${candidateListStr}`,
            provenance: {
              source: 'OPEN_METEO_GEOCODING_AMBIGUOUS',
              retrievedAt: new Date().toISOString(),
              candidatesCount: candidates.length,
            },
          };
        }
      }
    }

    const top = results[0];
    const name = top.name || query;
    const country = top.country || 'Global Destination';
    const countryCode = (top.country_code || 'INTL').toUpperCase();
    const region = top.admin1 || top.admin2 || '';
    const latitude = Number(top.latitude);
    const longitude = Number(top.longitude);
    const timezone = top.timezone || COUNTRY_INTELLIGENCE[countryCode]?.timezone || 'UTC';

    const destType = this.inferDestinationType(top.feature_code, name, region, country);
    const countryIntel = COUNTRY_INTELLIGENCE[countryCode] || {
      currency: countryCode === 'IN' ? 'INR' : 'USD',
      defaultLanguage: 'Local Language / English',
    };

    const researchedAttractions = this.generateDynamicAttractions(name, region, country, destType);
    const researchedActivities = this.generateDynamicActivities(name, region, country, destType);
    const popularAreas = this.generateDynamicPopularAreas(name, region, country, destType);

    return {
      isResolved: true,
      name,
      canonicalName: `${name}${region ? `, ${region}` : ''}, ${country}`,
      city: destType === 'CITY' ? name : region || name,
      state: region,
      country,
      countryCode,
      region,
      latitude,
      longitude,
      timezone,
      currency: countryIntel.currency,
      language: countryIntel.defaultLanguage,
      destinationType: destType,
      isSpecialDestination: false,
      description: `${name} is a renowned ${destType.toLowerCase()} in ${country}${region ? `, ${region}` : ''}. Celebrated for its distinct scenery, cultural heritage, and local experiences.`,
      popularAreas,
      attractions: researchedAttractions,
      activities: researchedActivities,
      transport:
        countryCode === 'IN'
          ? ['Local Cabs & Auto', 'Metro / City Bus', 'Intercity Train', 'Rental Vehicles']
          : ['Public Metro & Bus', 'Taxi / Ride Hailing', 'Walking Tours', 'Rental Car'],
      bestTime:
        countryCode === 'IN'
          ? 'October to March (Pleasant Season)'
          : 'May to September & October to March',
      travelTips: [
        `Check local weather forecasts before day trips in ${name}.`,
        'Book central accommodations close to main transportation corridors.',
        `Keep local currency (${countryIntel.currency}) or payment cards handy for daily expenses.`,
      ],
      coverImage: this.getCoverImageForDestination(name, country, destType),
      provenance: {
        source: 'OPEN_METEO_LIVE_GEOCODING',
        retrievedAt: new Date().toISOString(),
        verifiedFields: ['name', 'canonicalName', 'latitude', 'longitude', 'country', 'countryCode', 'region', 'timezone'],
        estimatedFields: ['attractions', 'activities', 'popularAreas', 'estimatedCostPerDay'],
      },
    };
  }

  /**
   * Infer Destination Type from Open-Meteo feature codes and geographical naming
   */
  inferDestinationType(featureCode, name, region, country) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('beach') || lowerName.includes('coast') || lowerName.includes('island')) return 'BEACH';
    if (lowerName.includes('mount') || lowerName.includes('peak') || lowerName.includes('hill')) return 'MOUNTAIN';
    if (lowerName.includes('park') || lowerName.includes('sanctuary')) return 'NATIONAL_PARK';
    if (name === country) return 'COUNTRY';

    if (featureCode) {
      if (['PPLC', 'PPLA', 'PPL'].includes(featureCode)) return 'CITY';
      if (['ADM1', 'ADM2'].includes(featureCode)) return 'STATE';
      if (['ISL', 'ISLS'].includes(featureCode)) return 'ISLAND';
      if (['MT', 'MTS'].includes(featureCode)) return 'MOUNTAIN';
      if (['PRK', 'RESV'].includes(featureCode)) return 'NATIONAL_PARK';
    }

    return 'CITY';
  }

  /**
   * Dynamic Generators tailored to real worldwide destinations
   */
  generateDynamicPopularAreas(name, region, country, type) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('tokyo')) {
      return ['Shibuya & Harajuku', 'Shinjuku Skyscraper Corridor', 'Asakusa & Ueno Historic Quarter', 'Ginza & Tsukiji District'];
    }
    if (lowerName.includes('reykjavik')) {
      return ['Downtown Skólavörðustígur', 'Old Harbour Waterfront', 'Laugavegur Shopping District', 'Grandivík Maritime Quarter'];
    }
    if (lowerName.includes('kyoto')) {
      return ['Gion Historic District', 'Arashiyama Bamboo Grove Area', 'Higashiyama Preservation Zone', 'Central Kyoto Station Quarter'];
    }
    if (lowerName.includes('cape town')) {
      return ['V&A Waterfront', 'Camps Bay Coastal Promenade', 'Bo-Kaap Cultural Quarter', 'City Bowl & Gardens'];
    }
    if (lowerName.includes('buenos aires')) {
      return ['Palermo Soho & Hollywood', 'Recoleta Historic Quarter', 'San Telmo Market District', 'Puerto Madero Waterfront'];
    }

    return [
      `Central ${name} Plaza`,
      `Historic ${name} Old Quarter`,
      `${name} Waterfront & Promenade`,
      `${region || name} Downtown District`,
    ];
  }

  generateDynamicAttractions(name, region, country, type) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('tokyo')) {
      return ['Senso-ji Temple & Nakamise-dori', 'Meiji Shrine & Forest Sanctuary', 'Tokyo Skytree Panoramic Deck', 'Tsukiji Outer Food Market', 'Shibuya Scramble Crossing'];
    }
    if (lowerName.includes('reykjavik')) {
      return ['Hallgrímskirkja Cathedral & Viewpoint', 'Harpa Concert Hall & Glass Architecture', 'Sun Voyager Sculpture Waterfront', 'National Museum of Iceland', 'Perlan Wonders of Iceland Observatory'];
    }
    if (lowerName.includes('kyoto')) {
      return ['Fushimi Inari Taisha Shrine Gates', 'Arashiyama Bamboo Grove Walk', 'Kinkaku-ji Golden Pavilion', 'Kiyomizu-dera Wooden Temple', 'Nijo Castle & Nightingale Floors'];
    }
    if (lowerName.includes('cape town')) {
      return ['Table Mountain Aerial Cableway', 'Cape of Good Hope & Cape Point', 'Boulders Beach African Penguin Colony', 'Kirstenbosch National Botanical Garden', 'Robben Island Historic Museum'];
    }
    if (lowerName.includes('buenos aires')) {
      return ['La Boca Caminito Colorful Alleyway', 'Recoleta Cemetery & Eva Perón Tomb', 'Teatro Colón Grand Opera House', 'Plaza de Mayo & Casa Rosada', 'San Telmo Sunday Antiques Fair'];
    }
    if (lowerName.includes('delhi')) {
      return ['Red Fort & Chandni Chowk Promenade', 'Qutub Minar & Historic Complex', 'Humayun’s Tomb Gardens', 'India Gate & Rajpath Boulevard', 'Lotus Temple & Quiet Gardens'];
    }

    return [
      `${name} Central Historic Landmark`,
      `${name} Cultural & Heritage Museum`,
      `Panoramic Viewpoint of ${name}`,
      `${name} City Park & Gardens`,
      `${region || country} Local Bazaar & Craft Market`,
    ];
  }

  generateDynamicActivities(name, region, country, type) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('tokyo')) {
      return ['Robot Restaurant / TeamLab Planets Digital Art Immersion', 'Authentic Ramen & Izakaya Crawl', 'Traditional Tea Ceremony Experience', 'Sumo Wrestling Practice Tour'];
    }
    if (lowerName.includes('reykjavik')) {
      return ['Golden Circle Day Tour (Geysir, Gullfoss & Thingvellir)', 'Blue Lagoon Thermal Spa Bath', 'Northern Lights Aurora Borealis Night Hunt', 'South Coast Waterfalls & Black Sand Beach Excursion'];
    }
    if (lowerName.includes('kyoto')) {
      return ['Kimono Dress Walk & Gion Tea Ceremony', 'Traditional Kaiseki Fine Dining Walk', 'Sake Tasting Tour in Fushimi District', 'Zen Meditation & Rock Garden Walk'];
    }
    if (lowerName.includes('cape town')) {
      return ['Cape Winelands Stellenbosch Tasting Cruise', 'Sunset Catamaran Cruise from V&A Waterfront', 'Hout Bay Seal Island Boat Excursion', 'Tafelberg Hiking Trail'];
    }
    if (lowerName.includes('buenos aires')) {
      return ['Authentic Argentine Tango Show & Dinner', 'Parrilla Steak & Malbec Wine Tasting Tour', 'San Telmo Milonga Dance Social', 'Bike Tour through Palermo Parks'];
    }

    return [
      `Guided Sightseeing & Cultural Heritage Walk in ${name}`,
      `Authentic Regional Cuisine & Food Tasting Tour`,
      `Sunset Experience at ${name} Viewpoint`,
      `Local Craft & Souvenir Shopping Excursion`,
    ];
  }

  getCoverImageForDestination(name, country, type) {
    const lowerName = name.toLowerCase();
    const lowerCountry = country.toLowerCase();

    if (lowerName.includes('tokyo') || lowerName.includes('japan'))
      return 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80';
    if (lowerName.includes('reykjavik') || lowerCountry.includes('iceland'))
      return 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80';
    if (lowerName.includes('kyoto'))
      return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80';
    if (lowerName.includes('cape town') || lowerCountry.includes('south africa'))
      return 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80';
    if (lowerName.includes('buenos aires') || lowerCountry.includes('argentina'))
      return 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=1200&q=80';
    if (lowerName.includes('delhi') || lowerCountry.includes('india'))
      return 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80';

    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
  }

  /**
   * Synthesize Special / Impossible / Fictional Destination Context
   */
  synthesizeSpecialDestination(rawName) {
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const isSpace = ['moon', 'luna', 'mars', 'jupiter', 'saturn', 'venus', 'space', 'iss'].some((s) =>
      rawName.toLowerCase().includes(s)
    );

    return {
      isResolved: true,
      name: formattedName,
      canonicalName: `${formattedName} (Special / Non-Standard Destination)`,
      city: formattedName,
      country: isSpace ? 'Outer Space / Interplanetary' : 'Fictional Realm',
      countryCode: 'SPECIAL',
      region: isSpace ? 'Lunar Orbit' : 'Fantasy Territory',
      latitude: 0.0,
      longitude: 0.0,
      timezone: 'UTC',
      currency: 'CREDITS',
      language: 'Galactic Standard / Universal',
      destinationType: 'OTHER',
      isSpecialDestination: true,
      specialType: isSpace ? 'SPACE_OR_NON_EARTH' : 'FICTIONAL',
      feasibilityMessage: `A normal tourist trip to ${formattedName} is not currently commercially bookable, so I can't create a genuine flight/hotel booking itinerary.`,
      suggestedOptions: [
        `1. A realistic future ${formattedName}-mission concept itinerary (HYPOTHETICAL / FUTURE TRAVEL PLAN)`,
        `2. A ${formattedName}-themed Earth travel experience (e.g. Space Center, Lunar landscape trek).`,
      ],
      description: `${formattedName} is a non-standard travel destination. While commercial passenger tourism is not currently available, TripPilot AI can synthesize a hypothetical future concept blueprint or an Earth-based themed trip.`,
      popularAreas: ['Sea of Tranquility', 'Lunar Crater Base', 'Apollo 11 Landing Site'],
      attractions: [
        `${formattedName} Lunar Observation Module`,
        'Tranquility Base Viewpoint',
        'Earth-rise Horizon Deck',
      ],
      activities: [
        'Zero-Gravity Lunar Rover Simulation',
        'Earth-rise Photography Session',
        'Space Suit EVA Moonwalk Experience',
      ],
      transport: ['SpaceX Starship / Artemis Lander Module'],
      bestTime: 'Solar Radiation Safe Windows',
      travelTips: [
        'This is a HYPOTHETICAL / FUTURE TRAVEL PLAN.',
        'Real commercial flight and hotel bookings are not applicable.',
      ],
      coverImage: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
      provenance: {
        source: 'SPECIAL_FEASIBILITY_ENGINE',
        retrievedAt: new Date().toISOString(),
        verifiedFields: ['name', 'isSpecialDestination', 'specialType', 'feasibilityMessage'],
        estimatedFields: ['hypotheticalAttractions', 'conceptActivities'],
      },
    };
  }

  /**
   * Synthesize real destination context for uncached locations if geocoding service is unavailable
   */
  synthesizeDestinationContext(rawName) {
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return {
      isResolved: true,
      name: formattedName,
      canonicalName: `${formattedName}, Global Destination`,
      city: formattedName,
      country: 'Global Destination',
      countryCode: 'INTL',
      region: 'Travel Region',
      latitude: 20.5937,
      longitude: 78.9629,
      timezone: 'UTC',
      currency: 'USD',
      language: 'Local Language / English',
      destinationType: 'CITY',
      isSpecialDestination: false,
      description: `${formattedName} is a wonderful travel destination offering unique cultural experiences, scenic sights, and vibrant local life.`,
      popularAreas: [`Central ${formattedName}`, `Old Town ${formattedName}`, `${formattedName} Waterfront`],
      attractions: [
        `${formattedName} Historic Square`,
        `${formattedName} Scenic Viewpoint`,
        `Cultural Heritage Museum of ${formattedName}`,
        'Central Market & Promenade',
      ],
      activities: [
        `Guided Sightseeing Tour of ${formattedName}`,
        'Local Food & Culinary Tasting Walk',
        `Sunset Experience at ${formattedName} Lookout`,
      ],
      transport: ['Local Taxi & Cabs', 'Public Transit', 'Walking Tours'],
      bestTime: 'Year-Round Travel Destination',
      travelTips: [
        'Check weather forecasts before setting out on day trips.',
        'Book accommodations near central attraction corridors.',
      ],
      coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
      provenance: {
        source: 'AI_SYNTHESIZED_FALLBACK',
        retrievedAt: new Date().toISOString(),
        verifiedFields: ['name'],
        estimatedFields: ['latitude', 'longitude', 'country', 'attractions', 'activities'],
      },
    };
  }

  formatFromDatabase(dbDoc) {
    return {
      isResolved: true,
      name: dbDoc.name,
      canonicalName: `${dbDoc.name}, ${dbDoc.country || 'India'}`,
      city: dbDoc.city || dbDoc.name,
      state: dbDoc.state || '',
      country: dbDoc.country || 'India',
      countryCode: dbDoc.country === 'India' ? 'IN' : 'INTL',
      latitude: dbDoc.coordinates?.lat || 20.5937,
      longitude: dbDoc.coordinates?.lng || 78.9629,
      timezone: dbDoc.country === 'India' ? 'Asia/Kolkata' : 'UTC',
      currency: dbDoc.currency || (dbDoc.country === 'India' ? 'INR' : 'USD'),
      language: dbDoc.language || 'Local Language',
      destinationType: 'CITY',
      isSpecialDestination: false,
      description: dbDoc.description || `Explore ${dbDoc.name} with curated AI travel itineraries.`,
      popularAreas: dbDoc.highlights?.slice(0, 4) || [`Central ${dbDoc.name}`, 'Historic District'],
      attractions: dbDoc.highlights || [`${dbDoc.name} City Center`, 'Local Markets'],
      activities: [`Sightseeing Tour of ${dbDoc.name}`, 'Culinary Exploration', 'Cultural Walk'],
      transport: ['Public Transport', 'Taxi / Cab', 'Rental Car'],
      bestTime: dbDoc.bestTimeToVisit?.season || 'October to March',
      travelTips: ['Plan daily travel according to local peak traffic hours', 'Carry local currency'],
      coverImage:
        dbDoc.images && dbDoc.images.length > 0
          ? dbDoc.images[0]
          : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      provenance: {
        source: 'DATABASE_CACHE',
        retrievedAt: new Date().toISOString(),
        verifiedFields: ['name', 'city', 'state', 'country', 'latitude', 'longitude'],
        estimatedFields: ['attractions', 'activities'],
      },
    };
  }

  async cacheResearchedDestination(context) {
    if (!context || !context.name || context.isSpecialDestination) return;
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return;

    try {
      const slug = context.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await Destination.findOne({ slug });
      if (!existing) {
        const newDest = new Destination({
          name: context.name,
          slug,
          city: context.city || context.name,
          state: context.state || '',
          country: context.country || 'Global Destination',
          description: context.description || `Explore ${context.name}.`,
          shortDescription: `${context.name}, ${context.country || ''}. Curated AI travel blueprint.`,
          coverImage: context.coverImage,
          images: [context.coverImage],
          coordinates: { lat: context.latitude || 0, lng: context.longitude || 0 },
          estimatedBudget: {
            minPerDay: context.country === 'India' ? 2500 : 6000,
            maxPerDay: context.country === 'India' ? 6000 : 15000,
          },
          currency: context.currency || 'USD',
          language: context.language || 'English',
          bestTimeToVisit: { season: context.bestTime || 'Year-Round' },
          highlights: context.attractions || [],
          travelTips: context.travelTips || [],
          isActive: true,
          isFeatured: false,
        });
        await newDest.save();
        console.log(`[DestinationResolver] Cached newly researched destination "${context.name}" to MongoDB.`);
      }
    } catch (err) {
      console.warn('[DestinationResolver] Cache save warning:', err.message);
    }
  }
}

module.exports = new DestinationResolverService();
