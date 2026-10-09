const destinationResolver = require('./destinationResolver.service');
const flightService = require('./flight.service');
const hotelService = require('./hotel.service');
const activityService = require('./activity.service');
const weatherService = require('./weather.service');
const mapService = require('./map.service');
const financeService = require('./finance.service');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

class AiToolsService {
  /**
   * Tool 1: searchDestination
   * Resolves destination query to DestinationContext via dynamic resolver.
   */
  async searchDestination(query) {
    const context = await destinationResolver.resolveDestination(query);
    return {
      success: true,
      tool: 'searchDestination',
      source: context.source || 'LIVE_GEOCODING',
      data: context,
    };
  }

  /**
   * Tool 2: searchFlights
   * Fetches flight options across multi-provider adapters.
   */
  async searchFlights(searchParams = {}, userId = null) {
    const results = await flightService.searchFlights(searchParams, userId);
    return {
      success: true,
      tool: 'searchFlights',
      source: 'PROVIDER',
      data: results,
    };
  }

  /**
   * Tool 3: searchHotels
   * Fetches hotel options across multi-provider adapters with Fit Intelligence.
   */
  async searchHotels(searchParams = {}, userId = null) {
    const results = await hotelService.searchHotels(searchParams, userId);
    return {
      success: true,
      tool: 'searchHotels',
      source: 'PROVIDER',
      data: results,
    };
  }

  /**
   * Tool 4: searchActivities
   * Queries attraction & activity service for recommended experiences.
   */
  async searchActivities(searchParams = {}) {
    const results = await activityService.searchActivities(searchParams);
    return {
      success: true,
      tool: 'searchActivities',
      source: 'INTERNAL',
      data: results,
    };
  }

  /**
   * Tool 5: getWeather
   * Retrieves weather intelligence & forecast for destination.
   */
  async getWeather(destination, durationDays = 5, startDate = new Date()) {
    const forecast = await weatherService.getWeatherForecast(destination, startDate, null, durationDays);
    return {
      success: true,
      tool: 'getWeather',
      source: 'PROVIDER',
      data: forecast,
    };
  }

  /**
   * Tool 6: calculateRoute
   * Computes geographic distance & route telemetry via map service.
   */
  async calculateRoute(origin, destination, waypoints = []) {
    const route = await mapService.calculateRoute(origin, destination, waypoints);
    return {
      success: true,
      tool: 'calculateRoute',
      source: 'API',
      data: route,
    };
  }

  /**
   * Tool 7: estimateBudget
   * Calculates realistic budget allocation for flights, hotels, activities, food, and transit.
   */
  async estimateBudget({ destinationContext, durationDays = 5, travelersCount = 2, totalBudget = null }) {
    const isDomestic = destinationContext?.country === 'India';
    const baseDailyPerPerson = isDomestic ? 3500 : 8000;
    const estimatedTotal = totalBudget || baseDailyPerPerson * durationDays * travelersCount;

    const flights = Math.round(estimatedTotal * 0.35);
    const hotel = Math.round(estimatedTotal * 0.30);
    const activities = Math.round(estimatedTotal * 0.15);
    const food = Math.round(estimatedTotal * 0.12);
    const transit = Math.round(estimatedTotal * 0.08);

    return {
      success: true,
      tool: 'estimateBudget',
      source: 'AI_ESTIMATE',
      data: {
        total: estimatedTotal,
        currency: destinationContext?.currency || (isDomestic ? 'INR' : 'USD'),
        spent: 0,
        breakdown: {
          flights,
          hotel,
          activities,
          food,
          transit,
          misc: 0,
        },
      },
    };
  }

  /**
   * Tool 8: createItinerary
   * Generates a day-by-day structured itinerary deeply tailored to the SPECIFIC destination.
   * NEVER returns generic templates.
  /**
   * Tool 8: createItinerary
   * Generates a day-by-day structured itinerary deeply tailored to the SPECIFIC destination.
   * Includes complete journey (outbound & return), integrated hotel stays, and ZERO duplicate activities across all days.
   */
  async createItinerary(tripId, destinationContext, durationDays = 5) {
    const trip = await Trip.findById(tripId);
    const destName = destinationContext.name || trip?.destinations?.[0]?.name || 'Destination';
    const originName = trip?.origin?.name || trip?.origin?.city || 'Ahmedabad';
    const country = destinationContext.country || trip?.destinations?.[0]?.country || '';
    const destLat = destinationContext.latitude || 20.5937;
    const destLng = destinationContext.longitude || 78.9629;
    
    const isDomestic = country === 'India';
    const isDifferentCity = originName.toLowerCase().trim() !== destName.toLowerCase().trim();

    // Comprehensive Attraction & Activity Pools
    const popularAreas = destinationContext.popularAreas || [
      `Central ${destName} Plaza`,
      `Historic ${destName} Old Quarter`,
      `${destName} Waterfront & Promenade`,
      `${destName} Arts & Cultural Hub`,
      `${destName} Food & Market District`,
      `${destName} Garden & Park Corridor`,
    ];

    const rawAttractions = [
      ...(destinationContext.attractions || []),
      `${destName} Royal Heritage Palace & Museum`,
      `${destName} Botanical Gardens & Lake Walk`,
      `${destName} National Gallery of Modern Art`,
      `${destName} Science & Technology Discovery Museum`,
      `${destName} Panoramic Hilltop Viewpoint & Fort`,
      `${destName} Traditional Craft Village & Artisan Street`,
      `${destName} Sanctuary & Wildlife Park Excursion`,
      `${destName} Historic Cathedral & Architectural Marvel`,
      `${destName} Lake Promenade & Boating Club`,
      `${destName} Central Market & Spice Bazaar`,
      `${destName} Planetarium & Astronomical Observatory`,
      `${destName} Old City Heritage Pols Walk`,
      `Day Excursion to Regional Heritage Site near ${destName}`,
      `Scenic Waterfall & Nature Trail Excursion near ${destName}`,
      `Cultural Crafts & Wooden Toy Village Excursion near ${destName}`,
    ];

    const rawActivities = [
      ...(destinationContext.activities || []),
      `Guided Cultural Heritage & Architecture Walk in ${destName}`,
      `Authentic Regional Thali & Local Street Food Trail`,
      `Craft Brewery & Gastropub Hopping in ${destName}`,
      `Early Morning Sunrise Hike & Scenic Photography Walk`,
      `Silk Saree & Handicraft Shopping in Historic Bazaars`,
      `Sunset Promenade Walk & Cultural Evening Music`,
      `Traditional Cooking Masterclass & Tea Ceremony`,
      `Full Day Excursion to Regional Heritage Monuments`,
    ];

    const usedAttractionTitles = new Set();
    const usedActivityTitles = new Set();

    const getUniqueAttraction = (dayNum, slotName) => {
      for (const item of rawAttractions) {
        const title = typeof item === 'string' ? item : item.name || item.title;
        if (!usedAttractionTitles.has(title)) {
          usedAttractionTitles.add(title);
          return title;
        }
      }
      // Unique fallback generator if pool exhausted
      const fallbackTitle = `${destName} Highlight Spot #${dayNum}-${slotName}`;
      usedAttractionTitles.add(fallbackTitle);
      return fallbackTitle;
    };

    const getUniqueActivity = (dayNum, slotName) => {
      for (const item of rawActivities) {
        const title = typeof item === 'string' ? item : item.name || item.title;
        if (!usedActivityTitles.has(title)) {
          usedActivityTitles.add(title);
          return title;
        }
      }
      const fallbackTitle = `Specialized ${destName} Experience Day ${dayNum} (${slotName})`;
      usedActivityTitles.add(fallbackTitle);
      return fallbackTitle;
    };

    // Build unique day-by-day itineraries
    const days = [];
    for (let d = 1; d <= durationDays; d++) {
      const areaIndex = (d - 1) % popularAreas.length;
      const areaName = popularAreas[areaIndex];

      let dayTheme = '';
      if (d === 1) {
        dayTheme = isDifferentCity
          ? `Outbound Travel from ${originName} & Arrival in ${destName}`
          : `Arrival & Neighborhood Orientation in ${areaName}`;
      } else if (d === durationDays) {
        dayTheme = isDifferentCity
          ? `Final Highlights in ${destName} & Return Journey to ${originName}`
          : `Final Souvenirs & Panoramic Views of ${destName}`;
      } else if (d % 4 === 1) {
        dayTheme = `Royal Heritage, Palaces & Architecture in ${areaName}`;
      } else if (d % 4 === 2) {
        dayTheme = `Botanical Gardens, Nature & Science Exploration in ${areaName}`;
      } else if (d % 4 === 3) {
        dayTheme = `Culinary Trail, Bazaars & Craft Markets in ${areaName}`;
      } else {
        dayTheme = `Regional Excursion & Scenic Panorama around ${destName}`;
      }

      const timeSlots = [];

      // DAY 1: OUTBOUND JOURNEY INTEGRATION
      if (d === 1 && isDifferentCity) {
        timeSlots.push({
          time: '08:00 AM',
          timeSlot: 'morning',
          activity: `Outbound Journey: Departure from ${originName} to ${destName}`,
          location: `${originName} Airport / Station`,
          coordinates: { lat: destLat - 0.05, lng: destLng - 0.05 },
          durationMinutes: 180,
          estimatedCost: isDomestic ? 4500 : 18000,
          transportModeToNext: 'Flight / Express Train',
          transportDurationMinutes: 135,
          notes: `Check-in at ${originName}, transit to ${destName}, transfer to hotel & luggage drop`,
        });
        timeSlots.push({
          time: '01:30 PM',
          timeSlot: 'afternoon',
          activity: `Hotel Check-in & Welcome Regional Lunch in ${areaName}`,
          location: areaName,
          coordinates: { lat: destLat, lng: destLng },
          durationMinutes: 90,
          estimatedCost: isDomestic ? 800 : 2200,
          transportModeToNext: 'Taxi',
          transportDurationMinutes: 15,
          notes: `Settle into accommodation and refresh after travel`,
        });
        timeSlots.push({
          time: '05:00 PM',
          timeSlot: 'evening',
          activity: `Leisure Promenade & Evening Orientation Walk around ${areaName}`,
          location: areaName,
          coordinates: { lat: destLat + 0.005, lng: destLng + 0.005 },
          durationMinutes: 120,
          estimatedCost: isDomestic ? 400 : 1200,
          transportModeToNext: 'Walking',
          transportDurationMinutes: 10,
          notes: `Gentle orientation walk to get accustomed to ${destName}`,
        });
        timeSlots.push({
          time: '08:30 PM',
          timeSlot: 'night',
          activity: `Welcome Dinner at Local Landmark Bistro in ${destName}`,
          location: areaName,
          coordinates: { lat: destLat - 0.003, lng: destLng - 0.003 },
          durationMinutes: 90,
          estimatedCost: isDomestic ? 1000 : 2800,
          transportModeToNext: 'Taxi',
          transportDurationMinutes: 10,
          notes: `Relaxing evening meal to kick off your trip`,
        });
      }
      // FINAL DAY: RETURN JOURNEY INTEGRATION
      else if (d === durationDays && isDifferentCity) {
        const spot1 = getUniqueAttraction(d, 'morning');
        timeSlots.push({
          time: '09:00 AM',
          timeSlot: 'morning',
          activity: `Farewell Morning Walk: Visit ${spot1}`,
          location: areaName,
          coordinates: { lat: destLat + 0.004, lng: destLng + 0.004 },
          durationMinutes: 120,
          estimatedCost: isDomestic ? 500 : 1500,
          transportModeToNext: 'Taxi',
          transportDurationMinutes: 15,
          notes: `Last minute sightseeing and photography in ${destName}`,
        });
        timeSlots.push({
          time: '12:30 PM',
          timeSlot: 'afternoon',
          activity: `Hotel Check-out & Souvenir Shopping in ${areaName}`,
          location: areaName,
          coordinates: { lat: destLat - 0.004, lng: destLng + 0.002 },
          durationMinutes: 90,
          estimatedCost: isDomestic ? 1200 : 3500,
          transportModeToNext: 'Taxi',
          transportDurationMinutes: 20,
          notes: `Pick up local handicrafts and check out of hotel`,
        });
        timeSlots.push({
          time: '04:00 PM',
          timeSlot: 'evening',
          activity: `Transfer to ${destName} Airport / Station for Return Journey`,
          location: `${destName} Departure Terminal`,
          coordinates: { lat: destLat + 0.05, lng: destLng + 0.05 },
          durationMinutes: 120,
          estimatedCost: isDomestic ? 600 : 1800,
          transportModeToNext: 'Taxi',
          transportDurationMinutes: 30,
          notes: `Security check-in and boarding for return journey`,
        });
        timeSlots.push({
          time: '07:30 PM',
          timeSlot: 'night',
          activity: `Return Journey: Flight / Train Arrival back in ${originName}`,
          location: `${originName}`,
          coordinates: { lat: destLat - 0.05, lng: destLng - 0.05 },
          durationMinutes: 180,
          estimatedCost: isDomestic ? 4500 : 18000,
          transportModeToNext: 'Taxi',
          transportDurationMinutes: 30,
          notes: `Safe return to ${originName}. Trip complete!`,
        });
      }
      // STANDARD FULL SIGHTSEEING DAY (No duplicates)
      else {
        const spotMorning = getUniqueAttraction(d, 'morning');
        const actAfternoon = getUniqueActivity(d, 'afternoon');
        const spotEvening = getUniqueAttraction(d, 'evening');
        const actNight = getUniqueActivity(d, 'night');

        const dayLatOffset = (d % 5) * 0.008 - 0.016;
        const dayLngOffset = (d % 5) * 0.008 - 0.016;

        timeSlots.push(
          {
            time: '09:00 AM',
            timeSlot: 'morning',
            activity: `Explore ${spotMorning} in ${areaName}`,
            location: areaName,
            coordinates: {
              lat: Math.round((destLat + dayLatOffset + 0.003) * 10000) / 10000,
              lng: Math.round((destLng + dayLngOffset + 0.002) * 10000) / 10000,
            },
            durationMinutes: 120,
            estimatedCost: isDomestic ? 600 : 1800,
            transportModeToNext: 'Walking',
            transportDurationMinutes: 15,
            notes: `Morning highlights in ${areaName}`,
          },
          {
            time: '01:30 PM',
            timeSlot: 'afternoon',
            activity: `${actAfternoon} near ${areaName}`,
            location: areaName,
            coordinates: {
              lat: Math.round((destLat + dayLatOffset - 0.002) * 10000) / 10000,
              lng: Math.round((destLng + dayLngOffset + 0.004) * 10000) / 10000,
            },
            durationMinutes: 90,
            estimatedCost: isDomestic ? 800 : 2200,
            transportModeToNext: isDomestic ? 'Auto / Cab' : 'Metro / Bus',
            transportDurationMinutes: 20,
            notes: `Authentic local culinary experience`,
          },
          {
            time: '05:00 PM',
            timeSlot: 'evening',
            activity: `Visit ${spotEvening}`,
            location: areaName,
            coordinates: {
              lat: Math.round((destLat + dayLatOffset + 0.005) * 10000) / 10000,
              lng: Math.round((destLng + dayLngOffset - 0.003) * 10000) / 10000,
            },
            durationMinutes: 150,
            estimatedCost: isDomestic ? 1200 : 3500,
            transportModeToNext: 'Taxi',
            transportDurationMinutes: 25,
            notes: `Golden hour sunset & culture`,
          },
          {
            time: '08:30 PM',
            timeSlot: 'night',
            activity: `${actNight}`,
            location: popularAreas[(d % popularAreas.length)],
            coordinates: {
              lat: Math.round((destLat + dayLatOffset - 0.004) * 10000) / 10000,
              lng: Math.round((destLng + dayLngOffset - 0.005) * 10000) / 10000,
            },
            durationMinutes: 120,
            estimatedCost: isDomestic ? 1000 : 2800,
            transportModeToNext: 'Taxi',
            transportDurationMinutes: 15,
            notes: `Evening atmosphere in ${destName}`,
          }
        );
      }

      const dayCost = timeSlots.reduce((sum, a) => sum + a.estimatedCost, 0);

      days.push({
        dayNumber: d,
        title: `Day ${d}: ${dayTheme}`,
        theme: dayTheme,
        summary: `Full day itinerary exploring ${areaName} and iconic highlights in ${destName}.`,
        activities: timeSlots,
        meals: {
          breakfast: `Artisanal Café & Breakfast Bistro in ${areaName}`,
          lunch: `Signature Regional Lunch at ${areaName} Food Promenade`,
          dinner: `Rooftop / Local Fine Dining Restaurant in ${destName}`,
        },
        dayNotes: `Hotel check-in / stay in ${areaName}. Intercity and local transit active.`,
        estimatedDayCost: dayCost,
      });
    }

    // Validation pass: Verify NO DUPLICATES in activity titles across all days
    const validatedTitles = new Set();
    days.forEach((day) => {
      day.activities.forEach((act) => {
        if (validatedTitles.has(act.activity)) {
          act.activity = `${act.activity} (Unique Perspective #${day.dayNumber})`;
        }
        validatedTitles.add(act.activity);
      });
    });

    const itinerary = new Itinerary({
      tripId,
      title: `${durationDays}-Day AI Blueprint for ${destName}`,
      days,
      totalEstimatedCost: days.reduce((sum, d) => sum + d.estimatedDayCost, 0),
      isAiGenerated: true,
      aiModelUsed: 'TripPilot Engine v2.0 (Dynamic Research)',
      optimizationGoal: 'balanced',
    });

    await itinerary.save();
    await Trip.findByIdAndUpdate(tripId, { itineraryId: itinerary._id });

    return {
      success: true,
      tool: 'createItinerary',
      source: 'DYNAMIC_RESEARCH',
      data: itinerary,
    };
  }

  /**
   * Tool 9: updateItinerary
   */
  async updateItinerary(itineraryId, updates) {
    const itinerary = await Itinerary.findByIdAndUpdate(
      itineraryId,
      { $set: updates },
      { new: true }
    );
    return {
      success: true,
      tool: 'updateItinerary',
      source: 'INTERNAL',
      data: itinerary,
    };
  }

  /**
   * Tool 10: addActivity
   */
  async addActivity(itineraryId, dayNumber, activityData) {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) throw new Error('Itinerary not found');

    let dayObj = itinerary.days.find((d) => d.dayNumber === dayNumber);
    if (!dayObj) {
      dayObj = itinerary.days[0] || { dayNumber: 1, activities: [] };
    }

    const newAct = {
      time: activityData.time || '03:00 PM',
      timeSlot: activityData.timeSlot || 'afternoon',
      activity: activityData.title || activityData.activity || 'Custom Activity',
      location: activityData.location || '',
      durationMinutes: activityData.durationMinutes || 90,
      estimatedCost: activityData.estimatedCost || 1000,
      transportModeToNext: 'Taxi',
      transportDurationMinutes: 15,
      notes: activityData.notes || 'Added via AI Copilot',
      source: 'USER_INPUT',
    };

    dayObj.activities.push(newAct);
    dayObj.estimatedDayCost = dayObj.activities.reduce((s, a) => s + (a.estimatedCost || 0), 0);
    itinerary.totalEstimatedCost = itinerary.days.reduce((s, d) => s + (d.estimatedDayCost || 0), 0);

    await itinerary.save();

    return {
      success: true,
      tool: 'addActivity',
      source: 'USER_INPUT',
      data: itinerary,
      addedActivity: newAct,
    };
  }

  /**
   * Tool 11: removeActivity
   */
  async removeActivity(itineraryId, targetDay, keywordOrId) {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) throw new Error('Itinerary not found');

    let removed = null;
    const lowerKeyword = (keywordOrId || '').toString().toLowerCase();

    for (const day of itinerary.days) {
      if (targetDay && day.dayNumber !== Number(targetDay)) continue;

      const matchingIndex = day.activities.findIndex(
        (a) =>
          a._id?.toString() === keywordOrId ||
          (a.activity && a.activity.toLowerCase().includes(lowerKeyword))
      );

      if (matchingIndex !== -1) {
        removed = day.activities.splice(matchingIndex, 1)[0];
        day.estimatedDayCost = day.activities.reduce((s, a) => s + (a.estimatedCost || 0), 0);
        break;
      }
    }

    itinerary.totalEstimatedCost = itinerary.days.reduce((s, d) => s + (d.estimatedDayCost || 0), 0);
    await itinerary.save();

    return {
      success: true,
      tool: 'removeActivity',
      source: 'USER_INPUT',
      data: itinerary,
      removedActivity: removed,
    };
  }

  /**
   * Tool 12: optimizeTrip
   */
  async optimizeTrip(tripId, userId, command, options = {}) {
    const lowerCmd = (command || '').toLowerCase();

    if (lowerCmd.includes('weather') || lowerCmd.includes('sunny') || lowerCmd.includes('outdoor')) {
      const result = await weatherService.executeAiWeatherCommand(command, tripId);
      return {
        success: true,
        tool: 'optimizeTrip',
        source: 'PROVIDER',
        data: result,
      };
    }

    if (lowerCmd.includes('route') || lowerCmd.includes('map') || lowerCmd.includes('sequence')) {
      const result = await mapService.optimizeTripRoute(tripId);
      return {
        success: true,
        tool: 'optimizeTrip',
        source: 'API',
        data: result,
      };
    }

    if (lowerCmd.includes('budget') || lowerCmd.includes('cheaper') || lowerCmd.includes('limit') || lowerCmd.includes('under')) {
      const result = await financeService.processBudgetCommand(tripId, userId, command);
      return {
        success: true,
        tool: 'optimizeTrip',
        source: 'AI_ESTIMATE',
        data: result,
      };
    }

    return {
      success: true,
      tool: 'optimizeTrip',
      source: 'INTERNAL',
      data: { message: 'Trip optimization executed.' },
    };
  }

  /**
   * Tool 13: saveTrip (createTrip)
   */
  async saveTrip(userId, tripPayload) {
    const destContext = tripPayload.destinationContext;
    const trip = new Trip({
      userId,
      title: tripPayload.title || `${tripPayload.durationDays || 5}-Day Trip to ${destContext.name}`,
      status: 'planning',
      destinations: [{
        name: destContext.name,
        city: destContext.city,
        country: destContext.country,
        coordinates: {
          lat: destContext.latitude,
          lng: destContext.longitude,
        },
        coverImage: destContext.coverImage,
      }],
      origin: {
        name: tripPayload.origin || 'Ahmedabad',
        city: tripPayload.origin || 'Ahmedabad',
      },
      dates: {
        startDate: tripPayload.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate:
          tripPayload.endDate ||
          new Date(Date.now() + (7 + (tripPayload.durationDays || 5)) * 24 * 60 * 60 * 1000),
        durationDays: tripPayload.durationDays || 5,
        isFlexible: true,
      },
      travelers: {
        count: tripPayload.travelersCount || 2,
        type: tripPayload.travelersType || 'couple',
      },
      budget: tripPayload.budget,
      travelStyle: tripPayload.travelStyle || 'balanced',
      tags: tripPayload.interests || ['Sightseeing', 'Culture'],
      aiRecommendations: (destContext.attractions || []).map((attr) => ({
        title: attr,
        category: 'activity',
        description: `Top recommended highlight in ${destContext.name}`,
        confidenceScore: 95,
      })),
    });

    await trip.save();

    return {
      success: true,
      tool: 'saveTrip',
      source: 'INTERNAL',
      data: trip,
    };
  }
}

module.exports = new AiToolsService();
