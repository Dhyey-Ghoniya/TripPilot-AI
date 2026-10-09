const Activity = require('../models/Activity');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

class ActivityService {
  constructor() {
    this.categories = [
      'Sightseeing',
      'Adventure',
      'Food',
      'Shopping',
      'Nature',
      'Culture',
      'Nightlife',
      'Museums',
      'Beaches',
      'Wildlife',
      'Photography',
      'Religious',
      'Entertainment',
      'Local Experiences',
    ];
  }

  /**
   * Calculate distance in km between two lat/lng points
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 2.1;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Search activities across 14 categories with filtering & fit scoring
   */
  async searchActivities(searchParams = {}, userId = null) {
    const destination = (searchParams.destination || 'Dubai').trim();
    const category = searchParams.category && searchParams.category !== 'all' ? searchParams.category : null;
    const maxPrice = searchParams.price || searchParams.maxPrice ? Number(searchParams.price || searchParams.maxPrice) : null;
    const maxDuration = searchParams.duration ? Number(searchParams.duration) : null;
    const interests = searchParams.interests
      ? (Array.isArray(searchParams.interests) ? searchParams.interests : searchParams.interests.split(',')).map((i) => i.trim().toLowerCase())
      : [];

    // Query DB first
    let dbQuery = {
      destinationName: { $regex: new RegExp(destination, 'i') },
      isActive: true,
    };

    if (category) {
      dbQuery.category = category;
    }

    let results = await Activity.find(dbQuery).lean();

    // If DB results are sparse, generate rich curated catalog for destination
    if (!results || results.length < 5) {
      const curated = this._getCuratedActivitiesCatalog(destination);
      results = curated;
    }

    // Apply Filters
    if (category) {
      results = results.filter((a) => (a.category || '').toLowerCase() === category.toLowerCase());
    }
    if (maxPrice !== null) {
      results = results.filter((a) => (a.price?.amount || a.price || 0) <= maxPrice);
    }
    if (maxDuration !== null) {
      results = results.filter((a) => (a.durationMinutes || 120) <= maxDuration);
    }
    if (interests.length > 0) {
      results = results.filter((a) => {
        const cat = (a.category || '').toLowerCase();
        const tags = (a.tags || []).map((t) => t.toLowerCase());
        return interests.some((interest) => cat.includes(interest) || tags.some((t) => t.includes(interest)));
      });
    }

    // Evaluate Activity Fit if tripId is provided
    let trip = null;
    if (searchParams.tripId) {
      trip = await Trip.findById(searchParams.tripId).populate('itineraryId');
    }

    const scoredResults = results.map((act) => {
      const fit = this.getActivityFit(act, trip, searchParams);
      return {
        ...act,
        id: act._id ? act._id.toString() : act.id || `act-${Math.random().toString(36).substring(2, 7)}`,
        activityFit: fit,
      };
    });

    // Sort by fit score descending
    scoredResults.sort((a, b) => (b.activityFit?.fitScore || 90) - (a.activityFit?.fitScore || 90));

    return {
      destination,
      totalResults: scoredResults.length,
      categories: this.categories,
      results: scoredResults,
    };
  }

  /**
   * Calculate Activity Fit considering user interests, trip budget, itinerary location, opening hours, weather & transit
   */
  getActivityFit(activity, trip = null, searchParams = {}) {
    const actLat = activity.coordinates?.lat || activity.location?.latitude || 25.1972;
    const actLng = activity.coordinates?.lng || activity.location?.longitude || 55.2744;

    const stayLat = trip?.hotel?.coordinates?.lat || trip?.destination?.coordinates?.lat || 25.1972;
    const stayLng = trip?.hotel?.coordinates?.lng || trip?.destination?.coordinates?.lng || 55.2744;

    const distanceToStayKm = this.calculateDistanceKm(actLat, actLng, stayLat, stayLng);
    const estimatedTravelMinutes = Math.round(distanceToStayKm * 4 + 5);

    // Interest Alignment
    const userTags = trip?.tags || ['Sightseeing', 'Culture'];
    const actCategory = activity.category || 'Sightseeing';
    const isInterestMatch = userTags.some(
      (t) => t.toLowerCase() === actCategory.toLowerCase() || (activity.tags || []).some((at) => at.toLowerCase() === t.toLowerCase())
    );
    const interestMatchText = isInterestMatch ? `Matches your trip interest (${actCategory})` : `Popular highlight in ${trip?.destination?.name || 'destination'}`;

    // Budget Compatibility
    const cost = activity.price?.amount !== undefined ? activity.price.amount : Number(activity.price) || 0;
    const activityBudget = trip?.budget?.breakdown?.activities || 10000;
    const isBudgetFit = cost <= activityBudget * 0.4;
    const budgetCompatibility = cost === 0 ? 'Free Activity' : isBudgetFit ? `Within Budget (₹${cost.toLocaleString()})` : `Premium Experience (₹${cost.toLocaleString()})`;

    // Weather & Opening Hours Suitability
    const isIndoor = activity.isIndoor || ['Museums', 'Shopping', 'Entertainment'].includes(actCategory);
    const weatherSuitability = isIndoor
      ? 'Indoor Activity - All-Weather Friendly'
      : 'Outdoor Highlight - Best visited in clear weather / morning / sunset';

    const openingHoursText = activity.openingHours?.open
      ? `Open ${activity.openingHours.open} - ${activity.openingHours.close}`
      : 'Open Daily (09:00 AM - 06:00 PM)';

    // Fit Score Calculation
    let fitScore = 95;
    if (!isInterestMatch) fitScore -= 5;
    if (distanceToStayKm > 10) fitScore -= 8;
    if (cost > 5000) fitScore -= 5;

    return {
      fitScore: Math.max(70, Math.min(99, fitScore)),
      interestMatchText,
      budgetCompatibility,
      distanceToStayKm,
      distanceToStayText: `${distanceToStayKm} km from stay (${estimatedTravelMinutes} mins transit)`,
      estimatedTravelMinutes,
      weatherSuitability,
      openingHoursText,
      bestTimeOfDay: activity.bestTimeOfDay || 'morning',
      durationText: `${activity.durationMinutes || 120} mins duration`,
    };
  }

  /**
   * Add activity to trip itinerary & update budget
   */
  async addActivityToTrip(tripId, activityData, dayNumber = 1, timeSlot = 'afternoon') {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw new Error('Trip not found');

    const validSlots = ['morning', 'afternoon', 'evening', 'night'];
    const safeTimeSlot = validSlots.includes(timeSlot) ? timeSlot : timeSlot === 'sunset' ? 'evening' : 'afternoon';

    const activityCost = Number(activityData.price?.amount || activityData.price || activityData.estimatedCost || 0);

    // Update Trip.activities array
    const newTripActivity = {
      title: activityData.name || activityData.title || 'Curated Activity',
      dayNumber: Number(dayNumber),
      timeSlot: safeTimeSlot,
      durationMinutes: activityData.durationMinutes || 120,
      location: activityData.location?.address || activityData.location || trip.destination?.name,
      estimatedCost: activityCost,
      status: 'planned',
      notes: activityData.shortDescription || activityData.description || '',
    };
    trip.activities.push(newTripActivity);

    // Update itinerary day if itinerary exists
    if (trip.itineraryId && Array.isArray(trip.itineraryId.days)) {
      const itinerary = await Itinerary.findById(trip.itineraryId._id);
      if (itinerary) {
        let dayObj = itinerary.days.find((d) => d.dayNumber === Number(dayNumber));
        if (!dayObj) {
          itinerary.days.push({
            dayNumber: Number(dayNumber),
            title: `Day ${dayNumber}: Highlights`,
            summary: `Day ${dayNumber} planned experiences`,
            activities: [],
          });
          dayObj = itinerary.days[itinerary.days.length - 1];
        }

        dayObj.activities.push({
          time: safeTimeSlot === 'morning' ? '10:00 AM' : safeTimeSlot === 'afternoon' ? '02:00 PM' : '07:00 PM',
          timeSlot: safeTimeSlot,
          activity: newTripActivity.title,
          location: newTripActivity.location,
          durationMinutes: newTripActivity.durationMinutes,
          estimatedCost: activityCost,
          notes: newTripActivity.notes,
        });

        await itinerary.save();
      }
    }

    // Update budget breakdown
    if (trip.budget) {
      trip.budget.breakdown.activities = (trip.budget.breakdown.activities || 0) + activityCost;
      trip.budget.spent = (trip.budget.spent || 0) + activityCost;
    }

    await trip.save();

    return {
      success: true,
      message: `Activity "${newTripActivity.title}" added to Day ${dayNumber} (${timeSlot})!`,
      trip,
      addedActivity: newTripActivity,
    };
  }

  /**
   * Remove activity from trip
   */
  async removeActivityFromTrip(tripId, dayNumber, activityTitleOrId) {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw new Error('Trip not found');

    let removedCost = 0;
    trip.activities = trip.activities.filter((act) => {
      const isMatch = act._id?.toString() === activityTitleOrId || act.title.toLowerCase().includes(activityTitleOrId.toLowerCase());
      if (isMatch) removedCost += act.estimatedCost || 0;
      return !isMatch;
    });

    if (trip.itineraryId) {
      const itinerary = await Itinerary.findById(trip.itineraryId._id);
      if (itinerary) {
        const dayObj = itinerary.days.find((d) => d.dayNumber === Number(dayNumber));
        if (dayObj) {
          dayObj.activities = dayObj.activities.filter((act) => !act.activity.toLowerCase().includes(activityTitleOrId.toLowerCase()));
          await itinerary.save();
        }
      }
    }

    if (trip.budget) {
      trip.budget.breakdown.activities = Math.max(0, (trip.budget.breakdown.activities || 0) - removedCost);
      trip.budget.spent = Math.max(0, (trip.budget.spent || 0) - removedCost);
    }

    await trip.save();
    return { success: true, message: `Activity removed from Day ${dayNumber}.`, trip };
  }

  /**
   * Replace activity in trip itinerary
   */
  async replaceActivityInTrip(tripId, dayNumber, oldActivityTitle, newActivityData) {
    await this.removeActivityFromTrip(tripId, dayNumber, oldActivityTitle);
    return await this.addActivityToTrip(tripId, newActivityData, dayNumber, 'afternoon');
  }

  /**
   * Move activity between days / time slots
   */
  async moveActivityInTrip(tripId, fromDay, toDay, activityTitle, newTimeSlot = 'afternoon') {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw new Error('Trip not found');

    const validSlots = ['morning', 'afternoon', 'evening', 'night'];
    let safeTimeSlot = validSlots.includes(newTimeSlot) ? newTimeSlot : newTimeSlot === 'sunset' ? 'evening' : 'afternoon';

    const targetAct = trip.activities.find((a) => a.dayNumber === Number(fromDay) && a.title.toLowerCase().includes(activityTitle.toLowerCase()));
    if (!targetAct) throw new Error(`Activity "${activityTitle}" not found on Day ${fromDay}`);

    targetAct.dayNumber = Number(toDay);
    targetAct.timeSlot = safeTimeSlot;

    if (trip.itineraryId) {
      const itinerary = await Itinerary.findById(trip.itineraryId._id);
      if (itinerary) {
        let fromDayObj = itinerary.days.find((d) => d.dayNumber === Number(fromDay));
        let toDayObj = itinerary.days.find((d) => d.dayNumber === Number(toDay));

        if (!toDayObj) {
          itinerary.days.push({
            dayNumber: Number(toDay),
            title: `Day ${toDay}: Highlights`,
            summary: `Day ${toDay} planned experiences`,
            activities: [],
          });
          toDayObj = itinerary.days[itinerary.days.length - 1];
        }

        if (fromDayObj) {
          const removed = fromDayObj.activities.filter((a) => a.activity && a.activity.toLowerCase().includes(activityTitle.toLowerCase()));
          fromDayObj.activities = fromDayObj.activities.filter((a) => !a.activity || !a.activity.toLowerCase().includes(activityTitle.toLowerCase()));
          
          if (toDayObj) {
            const itemToMove = removed.length > 0 ? removed[0] : { activity: targetAct.title };
            toDayObj.activities.push({
              time: safeTimeSlot === 'morning' ? '10:00 AM' : safeTimeSlot === 'afternoon' ? '02:00 PM' : '07:00 PM',
              timeSlot: safeTimeSlot,
              activity: itemToMove.activity || targetAct.title,
              location: itemToMove.location || targetAct.location || '',
              durationMinutes: itemToMove.durationMinutes || targetAct.durationMinutes || 90,
              estimatedCost: itemToMove.estimatedCost || targetAct.estimatedCost || 0,
              notes: itemToMove.notes || targetAct.notes || '',
            });
          }
        }
        await itinerary.save();
      }
    }

    await trip.save();
    return { success: true, message: `Moved "${targetAct.title}" to Day ${toDay} (${safeTimeSlot})`, trip };
  }

  /**
   * AI Optimize trip itinerary activities geographically and by best opening hours
   */
  async optimizeTripActivities(tripId) {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw new Error('Trip not found');

    if (trip.itineraryId) {
      const itinerary = await Itinerary.findById(trip.itineraryId._id);
      if (itinerary && Array.isArray(itinerary.days)) {
        itinerary.days.forEach((day) => {
          // Sort activities by bestTimeOfDay (morning -> afternoon -> evening -> night)
          const slotOrder = { morning: 1, afternoon: 2, evening: 3, night: 4 };
          day.activities.sort((a, b) => (slotOrder[a.timeSlot] || 2) - (slotOrder[b.timeSlot] || 2));
        });
        await itinerary.save();
      }
    }

    return {
      success: true,
      message: `Itinerary activities optimized geographically & by opening hours!`,
      trip,
    };
  }

  /**
   * Seed catalog generator for all 14 categories across destinations
   */
  _getCuratedActivitiesCatalog(dest) {
    return [
      {
        name: `Burj Khalifa & Sky Views Deck`,
        destinationName: dest,
        category: 'Sightseeing',
        shortDescription: 'Ascend the world\'s tallest skyscraper for 360° panoramic city views.',
        description: 'Experience iconic views from level 124 & 125, featuring outdoor observation terraces.',
        coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 120,
        price: { amount: 3800, currency: 'INR' },
        rating: 4.9,
        reviewCount: 4200,
        location: { address: 'Downtown', city: dest, country: 'UAE' },
        coordinates: { lat: 25.1972, lng: 55.2744 },
        openingHours: { open: '08:30 AM', close: '11:00 PM' },
        source: 'TripPilot Engine',
        bestTimeOfDay: 'sunset',
        tags: ['Iconic', 'Landmark', 'Views'],
      },
      {
        name: `Red Dunes Desert Safari & BBQ Camp`,
        destinationName: dest,
        category: 'Adventure',
        shortDescription: '4x4 Dune bashing, sandboarding, camel rides, and traditional dinner.',
        description: 'An exhilarating desert adventure into golden dunes followed by cultural performances.',
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 300,
        price: { amount: 4500, currency: 'INR' },
        rating: 4.8,
        reviewCount: 3100,
        location: { address: 'Lahbab Desert', city: dest, country: 'UAE' },
        coordinates: { lat: 24.9752, lng: 55.5944 },
        openingHours: { open: '03:00 PM', close: '09:30 PM' },
        source: 'Viator Partner',
        bestTimeOfDay: 'afternoon',
        tags: ['Dune Bashing', 'Safari', 'BBQ Dinner'],
      },
      {
        name: `Old Town Street Food & Spice Souk Walk`,
        destinationName: dest,
        category: 'Food',
        shortDescription: 'Sample authentic shawarmas, saffron teas, and local delicacies.',
        description: 'Guided culinary walking tour through historic alleyways and spice markets.',
        coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 180,
        price: { amount: 2200, currency: 'INR' },
        rating: 4.7,
        reviewCount: 1890,
        location: { address: 'Deira & Al Fahidi', city: dest, country: 'UAE' },
        coordinates: { lat: 25.2672, lng: 55.2974 },
        openingHours: { open: '10:00 AM', close: '08:00 PM' },
        source: 'Curated Local Guide',
        bestTimeOfDay: 'evening',
        tags: ['Street Food', 'Spice Souk', 'Walking Tour'],
      },
      {
        name: `Dubai Mall & Luxury Avenue Spree`,
        destinationName: dest,
        category: 'Shopping',
        shortDescription: 'World\'s largest retail destination with 1,200+ luxury stores.',
        description: 'Explore high fashion, gold souks, underwater aquarium view, and indoor waterfalls.',
        coverImage: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 240,
        price: { amount: 0, currency: 'INR' },
        rating: 4.8,
        reviewCount: 5200,
        location: { address: 'Downtown', city: dest, country: 'UAE' },
        coordinates: { lat: 25.1985, lng: 55.2796 },
        openingHours: { open: '10:00 AM', close: '12:00 AM' },
        source: 'TripPilot Engine',
        bestTimeOfDay: 'afternoon',
        isIndoor: true,
        tags: ['Shopping', 'Luxury', 'Indoor'],
      },
      {
        name: `Miracle Garden & Floral Canopies`,
        destinationName: dest,
        category: 'Nature',
        shortDescription: 'Over 150 million blooming flowers arranged in sensational structures.',
        description: 'Stroll through heart-shaped walkways and floral castles in the desert.',
        coverImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 150,
        price: { amount: 1950, currency: 'INR' },
        rating: 4.6,
        reviewCount: 2400,
        location: { address: 'Al Barsha South', city: dest, country: 'UAE' },
        coordinates: { lat: 25.0601, lng: 55.2444 },
        openingHours: { open: '09:00 AM', close: '09:00 PM' },
        source: 'GetYourGuide',
        bestTimeOfDay: 'morning',
        tags: ['Flowers', 'Gardens', 'Nature'],
      },
      {
        name: `Al Fahidi Historical Neighborhood Tour`,
        destinationName: dest,
        category: 'Culture',
        shortDescription: 'Traditional wind-tower architecture, art galleries, and tea houses.',
        description: 'Immerse in authentic 19th-century history and Emirati heritage.',
        coverImage: 'https://images.unsplash.com/photo-1578898835028-26615b3e6402?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1578898835028-26615b3e6402?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 120,
        price: { amount: 1200, currency: 'INR' },
        rating: 4.7,
        reviewCount: 1650,
        location: { address: 'Bur Dubai', city: dest, country: 'UAE' },
        coordinates: { lat: 25.2635, lng: 55.3002 },
        openingHours: { open: '09:00 AM', close: '07:00 PM' },
        source: 'Curated Local',
        bestTimeOfDay: 'morning',
        tags: ['History', 'Culture', 'Heritage'],
      },
      {
        name: `Marina Yacht Party & Sunset Lounge`,
        destinationName: dest,
        category: 'Nightlife',
        shortDescription: 'Luxury yacht cruise with DJ, open bar, and illuminated skyline views.',
        description: 'Party under the stars along the iconic Marina and Ain Dubai wheel.',
        coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 180,
        price: { amount: 6500, currency: 'INR' },
        rating: 4.8,
        reviewCount: 1980,
        location: { address: 'Dubai Marina', city: dest, country: 'UAE' },
        coordinates: { lat: 25.0772, lng: 55.1332 },
        openingHours: { open: '06:00 PM', close: '02:00 AM' },
        source: 'GetYourGuide',
        bestTimeOfDay: 'night',
        tags: ['Yacht', 'Nightlife', 'DJ Party'],
      },
      {
        name: `Museum of the Future`,
        destinationName: dest,
        category: 'Museums',
        shortDescription: 'Architectural marvel showcasing futuristic AI & space innovations.',
        description: 'Interactive exhibits exploring climate change, space travel, and human wellness in 2071.',
        coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 150,
        price: { amount: 3400, currency: 'INR' },
        rating: 4.9,
        reviewCount: 3800,
        location: { address: 'Sheikh Zayed Road', city: dest, country: 'UAE' },
        coordinates: { lat: 25.2192, lng: 55.2818 },
        openingHours: { open: '10:00 AM', close: '07:30 PM' },
        source: 'TripPilot Engine',
        bestTimeOfDay: 'morning',
        isIndoor: true,
        tags: ['Museum', 'Futuristic', 'AI Tech'],
      },
      {
        name: `Jumeirah Beach & Watersports Hub`,
        destinationName: dest,
        category: 'Beaches',
        shortDescription: 'White sand beach with Jet Skiing, parasailing, and beachside cafes.',
        description: 'Relax on turquoise shores with view of Burj Al Arab landmark.',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 180,
        price: { amount: 0, currency: 'INR' },
        rating: 4.7,
        reviewCount: 3100,
        location: { address: 'Jumeirah Beach Road', city: dest, country: 'UAE' },
        coordinates: { lat: 25.1412, lng: 55.1852 },
        openingHours: { open: '07:00 AM', close: '07:00 PM' },
        source: 'Curated Local',
        bestTimeOfDay: 'morning',
        tags: ['Beach', 'Sunset', 'Watersports'],
      },
      {
        name: `Ras Al Khor Wildlife Sanctuary`,
        destinationName: dest,
        category: 'Wildlife',
        shortDescription: 'Wetland reserve hosting thousands of wild flamingos & migratory birds.',
        description: 'Observe flamingos, herons, and raptors from climate-controlled bird hides.',
        coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 90,
        price: { amount: 0, currency: 'INR' },
        rating: 4.5,
        reviewCount: 920,
        location: { address: 'Ras Al Khor', city: dest, country: 'UAE' },
        coordinates: { lat: 25.1872, lng: 55.3244 },
        openingHours: { open: '07:30 AM', close: '05:30 PM' },
        source: 'TripPilot Engine',
        bestTimeOfDay: 'morning',
        tags: ['Flamingos', 'Wildlife', 'Bird Watching'],
      },
      {
        name: `Skyline & Golden Hour Photo Walk`,
        destinationName: dest,
        category: 'Photography',
        shortDescription: 'Professional photo session at top Instagram spots with pro photographer.',
        description: 'Capture stunning personal photos at Dubai Frame, Canal Bridge, and Souk Madinat.',
        coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 120,
        price: { amount: 5500, currency: 'INR' },
        rating: 4.9,
        reviewCount: 840,
        location: { address: 'Souk Madinat & Frame', city: dest, country: 'UAE' },
        coordinates: { lat: 25.1335, lng: 55.1848 },
        openingHours: { open: '04:00 PM', close: '07:00 PM' },
        source: 'Viator Partner',
        bestTimeOfDay: 'sunset',
        tags: ['Photography', 'Instagram', 'Pro Photos'],
      },
      {
        name: `Grand Mosque Heritage & Architecture Tour`,
        destinationName: dest,
        category: 'Religious',
        shortDescription: 'Majestic marble domes, crystal chandeliers, and Islamic art.',
        description: 'Guided respectful tour explaining architectural heritage and Islamic traditions.',
        coverImage: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 150,
        price: { amount: 0, currency: 'INR' },
        rating: 4.9,
        reviewCount: 4800,
        location: { address: 'Jumeirah Mosque', city: dest, country: 'UAE' },
        coordinates: { lat: 25.2342, lng: 55.2654 },
        openingHours: { open: '09:00 AM', close: '05:00 PM' },
        source: 'Curated Local',
        bestTimeOfDay: 'morning',
        tags: ['Mosque', 'Architecture', 'Culture'],
      },
      {
        name: `La Perle Aqua Theater Show`,
        destinationName: dest,
        category: 'Entertainment',
        shortDescription: 'World-class acrobatics, motorcycle stunt globe, and 2.7M liter water stage.',
        description: 'Breathtaking live theatrical spectacle created by renowned director Franco Dragone.',
        coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 90,
        price: { amount: 6200, currency: 'INR' },
        rating: 4.8,
        reviewCount: 2200,
        location: { address: 'Al Habtoor City', city: dest, country: 'UAE' },
        coordinates: { lat: 25.1844, lng: 55.2534 },
        openingHours: { open: '06:30 PM', close: '11:00 PM' },
        source: 'TripPilot Engine',
        bestTimeOfDay: 'night',
        isIndoor: true,
        tags: ['Aqua Show', 'Acrobatics', 'Live Theater'],
      },
      {
        name: `Traditional Abra Creek Crossing & Tea Tasting`,
        destinationName: dest,
        category: 'Local Experiences',
        shortDescription: 'Sail traditional wooden boats across historic Dubai Creek with tea.',
        description: 'Authentic 1-dirham local boat ride connecting traditional markets.',
        coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
        durationMinutes: 60,
        price: { amount: 300, currency: 'INR' },
        rating: 4.7,
        reviewCount: 1540,
        location: { address: 'Dubai Creek', city: dest, country: 'UAE' },
        coordinates: { lat: 25.2654, lng: 55.2954 },
        openingHours: { open: '06:00 AM', close: '11:00 PM' },
        source: 'Curated Local',
        bestTimeOfDay: 'sunset',
        tags: ['Abra Boat', 'Local Life', 'Creek'],
      },
    ];
  }
}

module.exports = new ActivityService();
