const Destination = require('../models/Destination');
const Attraction = require('../models/Attraction');
const Activity = require('../models/Activity');
const Trip = require('../models/Trip');
const Wishlist = require('../models/Wishlist');
const userPreferenceService = require('./userPreference.service');

class ExploreService {
  /**
   * Get all 5 sections for the Explore Discovery Layer:
   * 1. Recommended for You (Personalized based on profile, previous trips, wishlist, budget patterns)
   * 2. AI Discoveries (Dynamic AI prompt cards & suggestions)
   * 3. Travel Collections (Themed editorial collections)
   * 4. Popular Experiences (Top activities & attractions)
   * 5. Weekend Ideas (2-3 day getaways)
   */
  async getExploreData(userId = null) {
    // 1. Fetch User Profile Preferences, Previous Trips, and Wishlist
    let userPrefs = null;
    let previousTrips = [];
    let wishlistItems = [];

    if (userId) {
      try {
        userPrefs = await userPreferenceService.getUserTravelPreferences(userId);
        previousTrips = await Trip.find({ userId }).sort({ createdAt: -1 }).limit(5);
        wishlistItems = await Wishlist.find({ userId }).populate('destinationId');
      } catch (err) {
        console.warn('[ExploreService] User context fetch warning:', err.message);
      }
    }

    // 2. Fetch all active destinations from DB
    let destinations = await Destination.find({ isActive: true }).lean();

    if (!destinations || destinations.length === 0) {
      destinations = [
        {
          _id: 'dest_fallback_1',
          name: 'Dubai',
          slug: 'dubai',
          country: 'United Arab Emirates',
          state: 'Dubai',
          city: 'Dubai',
          description: 'Ultramodern city with iconic skyscrapers, luxury shopping, and desert dunes.',
          shortDescription: 'Modern skyscrapers, desert safaris, and world-class luxury.',
          coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
          categories: ['Luxury', 'Shopping', 'Adventure', 'Cultural'],
          tags: ['Skyscrapers', 'Desert', 'Luxury', 'Shopping'],
          estimatedBudget: { minPerDay: 4000, maxPerDay: 8500 },
          popularityScore: 95,
          rating: 4.8,
          averageDuration: { minDays: 3, maxDays: 6 },
          isFeatured: true,
        },
        {
          _id: 'dest_fallback_2',
          name: 'Manali',
          slug: 'manali',
          country: 'India',
          state: 'Himachal Pradesh',
          city: 'Manali',
          description: 'High-altitude Himalayan resort town known for adventure sports, snow peaks, and river valleys.',
          shortDescription: 'Himalayan snow peaks, adventure sports, and scenic valleys.',
          coverImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
          categories: ['Mountains', 'Adventure', 'Nature'],
          tags: ['Mountains', 'Adventure', 'Trekking', 'Snow'],
          estimatedBudget: { minPerDay: 2200, maxPerDay: 4500 },
          popularityScore: 90,
          rating: 4.7,
          averageDuration: { minDays: 2, maxDays: 4 },
          isFeatured: true,
        },
        {
          _id: 'dest_fallback_3',
          name: 'Goa',
          slug: 'goa',
          country: 'India',
          state: 'Goa',
          city: 'Goa',
          description: 'Tropical coastal haven with golden beaches, Portuguese heritage, and relaxed coastal vibes.',
          shortDescription: 'Golden beaches, water sports, and relaxed coastal vibes.',
          coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80',
          categories: ['Beach', 'Relaxation', 'Food', 'Nightlife'],
          tags: ['Beach', 'Water Sports', 'Nightlife'],
          estimatedBudget: { minPerDay: 2500, maxPerDay: 5000 },
          popularityScore: 92,
          rating: 4.6,
          averageDuration: { minDays: 2, maxDays: 5 },
          isFeatured: true,
        },
        {
          _id: 'dest_fallback_4',
          name: 'Tokyo',
          slug: 'tokyo',
          country: 'Japan',
          state: 'Kanto',
          city: 'Tokyo',
          description: 'Electrifying metropolis blending ultra-modern skyscrapers with ancient shinto shrines.',
          shortDescription: 'Neon skyscrapers, ancient shrines, and world-renowned gastronomy.',
          coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&q=80',
          categories: ['Cultural', 'Food', 'Shopping', 'Historical'],
          tags: ['Culture', 'Anime', 'Food', 'Metropolis'],
          estimatedBudget: { minPerDay: 6000, maxPerDay: 12000 },
          popularityScore: 94,
          rating: 4.9,
          averageDuration: { minDays: 4, maxDays: 7 },
          isFeatured: true,
        },
        {
          _id: 'dest_fallback_5',
          name: 'Jaipur',
          slug: 'jaipur',
          country: 'India',
          state: 'Rajasthan',
          city: 'Jaipur',
          description: 'The Pink City featuring majestic hill forts, royal palaces, and vibrant bazaars.',
          shortDescription: 'Royal palaces, hill forts, and rich heritage bazaars.',
          coverImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=80',
          categories: ['Historical', 'Cultural', 'Architectural'],
          tags: ['Palaces', 'Forts', 'Heritage', 'Culture'],
          estimatedBudget: { minPerDay: 2000, maxPerDay: 4000 },
          popularityScore: 88,
          rating: 4.7,
          averageDuration: { minDays: 2, maxDays: 3 },
          isFeatured: true,
        },
      ];
    }

    // Extract categories & tags from user's previous trips & wishlist
    const prevCategories = new Set();
    const prevTags = new Set();
    previousTrips.forEach((t) => {
      (t.tags || []).forEach((tag) => prevTags.add(tag.toLowerCase()));
      if (t.destination?.name) prevTags.add(t.destination.name.toLowerCase());
    });
    wishlistItems.forEach((w) => {
      if (w.destinationId?.categories) {
        w.destinationId.categories.forEach((c) => prevCategories.add(c));
      }
    });

    // Baseline preferences from user profile
    const prefCategories = new Set([
      ...(userPrefs?.interests || ['Sightseeing', 'Culture']),
      ...Array.from(prevCategories),
    ]);
    const preferredBudgetRange = userPrefs?.budgetRange || 'Moderate';

    // ─────────────────────────────────────────────────────────────────
    // SECTION 1: RECOMMENDED FOR YOU (Personalized, Privacy-Compliant)
    // ─────────────────────────────────────────────────────────────────
    const scoredDestinations = destinations.map((dest) => {
      let score = dest.popularityScore || 75;
      const reasons = [];

      // Category matching
      const destCats = (dest.categories || []).map((c) => c.toLowerCase());
      const catMatches = Array.from(prefCategories).filter((c) => destCats.includes(c.toLowerCase()));
      if (catMatches.length > 0) {
        score += catMatches.length * 8;
        reasons.push(`Matches your interest in ${catMatches.slice(0, 2).join(' & ')}`);
      }

      // Previous trip similarity
      const tagMatches = (dest.tags || []).filter((t) => prevTags.has(t.toLowerCase()));
      if (tagMatches.length > 0) {
        score += 12;
        reasons.push(`Similar vibes to your past trips (${tagMatches[0]})`);
      }

      // Budget compatibility
      const dailyBudget = dest.estimatedBudget?.maxPerDay || 4000;
      if (preferredBudgetRange === 'Budget' && dailyBudget <= 3500) {
        score += 10;
        reasons.push('Fits your budget-conscious preference');
      } else if (preferredBudgetRange === 'Luxury' && dailyBudget >= 7000) {
        score += 10;
        reasons.push('Matches your luxury travel style');
      }

      // Featured boost
      if (dest.isFeatured) score += 5;

      const finalScore = Math.min(99, Math.max(70, Math.round(score)));

      return {
        ...dest,
        matchScore: finalScore,
        recommendationReason: reasons.length > 0 ? reasons[0] : `${finalScore}% Match based on top traveler ratings`,
      };
    });

    scoredDestinations.sort((a, b) => b.matchScore - a.matchScore);
    const recommendedForYou = scoredDestinations.slice(0, 6);

    // ─────────────────────────────────────────────────────────────────
    // SECTION 2: AI DISCOVERIES (Dynamic Prompts & Suggestions)
    // ─────────────────────────────────────────────────────────────────
    const aiDiscoveries = [
      {
        id: 'disc_prev_trip',
        prompt: 'Find destinations like my previous trip.',
        title: 'Similar to Past Adventures',
        description: previousTrips.length > 0
          ? `Discover places with similar scenery & culture to ${previousTrips[0]?.destination?.name || 'your last trip'}.`
          : 'Discover places with similar scenery & culture to your favorite past journeys.',
        category: 'similarity',
        badge: 'AI Tailored',
        color: 'from-purple-500/20 to-indigo-500/20',
      },
      {
        id: 'disc_4day_adventure',
        prompt: 'Suggest a 4-day adventure trip.',
        title: '4-Day Thrill & Trek Blueprint',
        description: 'Trekking, water sports, and mountain exploration scaled perfectly for a 4-day getaway.',
        category: 'adventure',
        badge: 'Popular AI Prompt',
        color: 'from-amber-500/20 to-orange-500/20',
      },
      {
        id: 'disc_budget_30k',
        prompt: 'Where can I travel under ₹30,000?',
        title: 'Complete Trips Under ₹30,000',
        description: 'All-inclusive estimates covering roundtrip transit, stay, food, and activities.',
        category: 'budget',
        badge: 'Budget Optimizer',
        color: 'from-emerald-500/20 to-teal-500/20',
      },
    ];

    // ─────────────────────────────────────────────────────────────────
    // SECTION 3: TRAVEL COLLECTIONS (Themed Editorial Collections)
    // ─────────────────────────────────────────────────────────────────
    const travelCollections = [
      {
        id: 'coll_coastal',
        title: 'Coastal Escapes & Island Vibes',
        subtitle: 'Sun-kissed beaches, palm groves, and turquoise seas',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        destinationCount: destinations.filter((d) => (d.categories || []).includes('Beach')).length || 4,
        categories: ['Beach', 'Relaxation', 'Romantic'],
        tag: 'Tropical Sun',
      },
      {
        id: 'coll_mountains',
        title: 'High Altitude Mountain Treks',
        subtitle: 'Snow-capped peaks, pine forests, and alpine meadows',
        coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
        destinationCount: destinations.filter((d) => (d.categories || []).includes('Mountains')).length || 5,
        categories: ['Mountains', 'Adventure', 'Nature'],
        tag: 'Alpine Highs',
      },
      {
        id: 'coll_heritage',
        title: 'Cultural Empires & Ancient Heritage',
        subtitle: 'Century-old fortresses, royal palaces, and sacred temples',
        coverImage: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
        destinationCount: destinations.filter((d) => (d.categories || []).includes('Historical') || (d.categories || []).includes('Cultural')).length || 6,
        categories: ['Historical', 'Cultural', 'Architectural'],
        tag: 'Royal Heritage',
      },
      {
        id: 'coll_food',
        title: 'Gastronomy & Street Food Trails',
        subtitle: 'Authentic local flavors, night markets, and spice havens',
        coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
        destinationCount: destinations.filter((d) => (d.categories || []).includes('Food')).length || 4,
        categories: ['Food', 'Culture', 'Local Experiences'],
        tag: 'Culinary Journey',
      },
    ];

    // ─────────────────────────────────────────────────────────────────
    // SECTION 4: POPULAR EXPERIENCES (Attractions & Activities)
    // ─────────────────────────────────────────────────────────────────
    let popularExperiences = [];
    try {
      const attractions = await Attraction.find({ isActive: true }).limit(6).lean();
      if (attractions.length > 0) {
        popularExperiences = attractions.map((attr) => ({
          id: attr._id,
          title: attr.name,
          category: attr.category || 'Sightseeing',
          destinationName: attr.destinationName || 'Popular Destination',
          location: attr.location?.city || attr.destinationName,
          rating: attr.rating || 4.7,
          reviewCount: attr.reviewCount || 120,
          durationMinutes: attr.recommendedDurationMinutes || 120,
          estimatedCost: attr.entryFee?.amount || 500,
          currency: attr.entryFee?.currency || 'INR',
          coverImage: attr.coverImage || attr.images?.[0] || 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
        }));
      }
    } catch (err) {
      console.warn('[ExploreService] Attractions fetch warning:', err.message);
    }

    if (popularExperiences.length === 0) {
      popularExperiences = [
        {
          id: 'exp_1',
          title: 'Burj Khalifa At The Top Observation Deck',
          category: 'Sightseeing',
          destinationName: 'Dubai',
          location: 'Downtown Dubai',
          rating: 4.8,
          reviewCount: 3400,
          durationMinutes: 90,
          estimatedCost: 3800,
          currency: 'INR',
          coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
        },
        {
          id: 'exp_2',
          title: 'Red Dunes Desert Safari & Sunset BBQ',
          category: 'Adventure',
          destinationName: 'Dubai',
          location: 'Lahbab Desert',
          rating: 4.9,
          reviewCount: 2100,
          durationMinutes: 300,
          estimatedCost: 2500,
          currency: 'INR',
          coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
        },
        {
          id: 'exp_3',
          title: 'Scuba Diving & Coral Reef Expedition',
          category: 'Water Sports',
          destinationName: 'Goa',
          location: 'Grand Island, Goa',
          rating: 4.7,
          reviewCount: 980,
          durationMinutes: 240,
          estimatedCost: 3200,
          currency: 'INR',
          coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        },
        {
          id: 'exp_4',
          title: 'Shibuya Crossing & Sky Observation Experience',
          category: 'Culture',
          destinationName: 'Tokyo',
          location: 'Shibuya, Tokyo',
          rating: 4.9,
          reviewCount: 4100,
          durationMinutes: 120,
          estimatedCost: 1800,
          currency: 'INR',
          coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80',
        },
      ];
    }

    // ─────────────────────────────────────────────────────────────────
    // SECTION 5: WEEKEND IDEAS (2-3 Day Quick Getaways)
    // ─────────────────────────────────────────────────────────────────
    const weekendIdeas = destinations
      .filter((d) => (d.averageDuration?.minDays || 2) <= 3)
      .slice(0, 6)
      .map((dest) => {
        const estDaily = dest.estimatedBudget?.minPerDay || 2500;
        const totalWeekendBudget = estDaily * 3 + 3000; // 3 days + transit
        return {
          ...dest,
          idealDays: 3,
          estimatedTotalBudget: totalWeekendBudget,
          quickTag: totalWeekendBudget <= 12000 ? 'Budget Friendly' : 'Quick Escape',
        };
      });

    return {
      success: true,
      data: {
        recommendedForYou,
        aiDiscoveries,
        travelCollections,
        popularExperiences,
        weekendIdeas,
        totalDestinationsCount: destinations.length,
      },
    };
  }

  /**
   * Handle AI Natural Language Discovery Request
   * Examples:
   *   - "Find destinations like my previous trip."
   *   - "Suggest a 4-day adventure trip."
   *   - "Where can I travel under ₹30,000?"
   */
  async handleAiDiscovery(userId, promptText) {
    const prompt = (promptText || '').toLowerCase().trim();
    let destinations = await Destination.find({ isActive: true }).lean();

    if (!destinations || destinations.length === 0) {
      destinations = [
        {
          _id: 'dest_fallback_1',
          name: 'Dubai',
          slug: 'dubai',
          country: 'United Arab Emirates',
          state: 'Dubai',
          city: 'Dubai',
          shortDescription: 'Modern skyscrapers, desert safaris, and world-class luxury.',
          coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
          categories: ['Luxury', 'Shopping', 'Adventure', 'Cultural'],
          tags: ['Skyscrapers', 'Desert', 'Luxury', 'Shopping'],
          estimatedBudget: { minPerDay: 4000, maxPerDay: 8500 },
          popularityScore: 95,
          rating: 4.8,
          averageDuration: { minDays: 3, maxDays: 6 },
        },
        {
          _id: 'dest_fallback_2',
          name: 'Manali',
          slug: 'manali',
          country: 'India',
          state: 'Himachal Pradesh',
          city: 'Manali',
          shortDescription: 'Himalayan snow peaks, adventure sports, and scenic valleys.',
          coverImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
          categories: ['Mountains', 'Adventure', 'Nature'],
          tags: ['Mountains', 'Adventure', 'Trekking', 'Snow'],
          estimatedBudget: { minPerDay: 2200, maxPerDay: 4500 },
          popularityScore: 90,
          rating: 4.7,
          averageDuration: { minDays: 2, maxDays: 4 },
        },
        {
          _id: 'dest_fallback_3',
          name: 'Goa',
          slug: 'goa',
          country: 'India',
          state: 'Goa',
          city: 'Goa',
          shortDescription: 'Golden beaches, water sports, and relaxed coastal vibes.',
          coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80',
          categories: ['Beach', 'Relaxation', 'Food', 'Nightlife'],
          tags: ['Beach', 'Water Sports', 'Nightlife'],
          estimatedBudget: { minPerDay: 2500, maxPerDay: 5000 },
          popularityScore: 92,
          rating: 4.6,
          averageDuration: { minDays: 2, maxDays: 5 },
        },
        {
          _id: 'dest_fallback_4',
          name: 'Tokyo',
          slug: 'tokyo',
          country: 'Japan',
          state: 'Kanto',
          city: 'Tokyo',
          shortDescription: 'Neon skyscrapers, ancient shrines, and world-renowned gastronomy.',
          coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&q=80',
          categories: ['Cultural', 'Food', 'Shopping', 'Historical'],
          tags: ['Culture', 'Anime', 'Food', 'Metropolis'],
          estimatedBudget: { minPerDay: 6000, maxPerDay: 12000 },
          popularityScore: 94,
          rating: 4.9,
          averageDuration: { minDays: 4, maxDays: 7 },
        },
        {
          _id: 'dest_fallback_5',
          name: 'Jaipur',
          slug: 'jaipur',
          country: 'India',
          state: 'Rajasthan',
          city: 'Jaipur',
          shortDescription: 'Royal palaces, hill forts, and rich heritage bazaars.',
          coverImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1200&q=80',
          categories: ['Historical', 'Cultural', 'Architectural'],
          tags: ['Palaces', 'Forts', 'Heritage', 'Culture'],
          estimatedBudget: { minPerDay: 2000, maxPerDay: 4000 },
          popularityScore: 88,
          rating: 4.7,
          averageDuration: { minDays: 2, maxDays: 3 },
        },
      ];
    }

    // 1. "Find destinations like my previous trip."
    if (prompt.includes('previous trip') || prompt.includes('like my last') || prompt.includes('past trip')) {
      let previousTrips = [];
      if (userId) {
        previousTrips = await Trip.find({ userId }).sort({ createdAt: -1 }).limit(3);
      }

      const pastDestNames = previousTrips.map((t) => t.destination?.name).filter(Boolean);
      const pastTags = new Set();
      previousTrips.forEach((t) => (t.tags || []).forEach((tg) => pastTags.add(tg.toLowerCase())));

      let matchedDestinations = destinations.filter((d) =>
        (d.tags || []).some((tg) => pastTags.has(tg.toLowerCase())) ||
        (d.categories || []).some((c) => pastTags.has(c.toLowerCase()))
      );

      if (matchedDestinations.length === 0) {
        matchedDestinations = destinations.slice(0, 4);
      }

      return {
        success: true,
        prompt,
        intent: 'SIMILAR_TO_PREVIOUS_TRIP',
        message: pastDestNames.length > 0
          ? `Based on your previous trip to ${pastDestNames.join(', ')}, here are destinations with matching vibes, climate, and activities!`
          : 'Here are top recommendations matching scenic mountain, beach, and cultural vibes from your travel history!',
        results: matchedDestinations.slice(0, 4).map((d) => ({
          ...d,
          aiRecommendationNote: `Matches scenery & activities from ${pastDestNames[0] || 'your travel history'}`,
        })),
      };
    }

    // 2. "Suggest a 4-day adventure trip."
    if (prompt.includes('4-day') || prompt.includes('adventure') || prompt.includes('4 day')) {
      const adventureDestinations = destinations.filter((d) => (d.categories || []).includes('Adventure'));

      const curatedTrips = (adventureDestinations.length > 0 ? adventureDestinations : destinations).slice(0, 3).map((d) => ({
        destination: d,
        title: `4-Day ${d.name} Thrill & Exploration`,
        durationDays: 4,
        estimatedTotalCost: (d.estimatedBudget?.maxPerDay || 4000) * 4 + 5000,
        highlights: [
          `Day 1: Arrival & ${d.name} Scenic Orientation`,
          `Day 2: ${d.tags?.[0] || 'Outdoor Trek'} & High-Adrenaline Activities`,
          `Day 3: Cultural Landmarks & Local Food Trail`,
          `Day 4: Morning Souvenir Shopping & Departure`,
        ],
      }));

      return {
        success: true,
        prompt,
        intent: '4DAY_ADVENTURE_SUGGESTION',
        message: `Found ${curatedTrips.length} 4-day adventure trip blueprints tailored for active exploration!`,
        results: curatedTrips,
      };
    }

    // 3. "Where can I travel under ₹30,000?"
    if (prompt.match(/under\s*₹?\s*[\d,]+|below\s*₹?\s*[\d,]+|budget.*[\d,]+/)) {
      const amountMatch = prompt.match(/₹?\s*([\d,]+)/);
      const maxBudget = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 30000;

      const budgetFriendlyDestinations = destinations
        .map((d) => {
          const estPerDay = d.estimatedBudget?.minPerDay || 2500;
          const total4DayCost = estPerDay * 4 + 4000; // 4 days + estimated roundtrip flight/transit
          return {
            destination: d,
            estimatedTotal4DayCost: total4DayCost,
            dailyBudget: estPerDay,
            isWithinBudget: total4DayCost <= maxBudget,
          };
        })
        .filter((item) => item.isWithinBudget)
        .sort((a, b) => a.estimatedTotal4DayCost - b.estimatedTotal4DayCost);

      return {
        success: true,
        prompt,
        intent: 'BUDGET_DISCOVERY',
        maxBudget,
        message: `Found ${budgetFriendlyDestinations.length} destinations where a complete 4-day trip stays under ₹${maxBudget.toLocaleString()}!`,
        results: budgetFriendlyDestinations.slice(0, 5),
      };
    }

    // Fallback General Discovery
    return {
      success: true,
      prompt,
      intent: 'GENERAL_DISCOVERY',
      message: `Here are AI discovery suggestions based on your query "${promptText}".`,
      results: destinations.slice(0, 4),
    };
  }
}

module.exports = new ExploreService();
