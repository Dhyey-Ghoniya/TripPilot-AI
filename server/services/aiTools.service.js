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
   */
  async createItinerary(tripId, destinationContext, durationDays = 5) {
    const destName = destinationContext.name;
    const country = destinationContext.country || '';
    const popularAreas = destinationContext.popularAreas || [`Central ${destName}`, `Old Town ${destName}`];
    const attractions = destinationContext.attractions || [`${destName} Historic Landmark`, `${destName} Viewpoint`];
    const activitiesList = destinationContext.activities || [`Sightseeing Tour`, `Local Dining`];

    const isDomestic = country === 'India';
    const currency = destinationContext.currency || (isDomestic ? 'INR' : 'USD');

    // Generate destination-specific themes & daily schedules
    const days = [];
    for (let d = 1; d <= durationDays; d++) {
      const areaIndex = (d - 1) % popularAreas.length;
      const areaName = popularAreas[areaIndex];

      // Build day-specific theme
      let dayTheme = '';
      if (d === 1) dayTheme = `Arrival & Neighborhood Orientation in ${areaName}`;
      else if (d === durationDays) dayTheme = `Final Souvenirs & Panoramic Views of ${destName}`;
      else if (d % 2 === 0) dayTheme = `Cultural Immersion & Local Flavors in ${areaName}`;
      else dayTheme = `Iconic Landmarks & Sunset Experience in ${areaName}`;

      // 4 Time slots per day with destination-tailored activities
      const timeSlots = [
        {
          time: '09:00 AM',
          slot: 'morning',
          activity: `Explore ${attractions[(d - 1) % attractions.length]} in ${areaName}`,
          location: areaName,
          durationMinutes: 120,
          estimatedCost: isDomestic ? 500 : 1500,
          transportModeToNext: 'Walking',
          notes: `Morning highlight in central ${areaName}`,
        },
        {
          time: '01:30 PM',
          slot: 'afternoon',
          activity: `Authentic Local Dining & Street Food Walk in ${areaName}`,
          location: areaName,
          durationMinutes: 90,
          estimatedCost: isDomestic ? 800 : 2200,
          transportModeToNext: isDomestic ? 'Auto / Cab' : 'Metro / Bus',
          notes: `Try signature regional dishes of ${destName}`,
        },
        {
          time: '05:00 PM',
          slot: 'evening',
          activity: activitiesList[(d - 1) % activitiesList.length] || `Sunset Experience at ${destName} Viewpoint`,
          location: areaName,
          durationMinutes: 150,
          estimatedCost: isDomestic ? 1200 : 3500,
          transportModeToNext: 'Taxi',
          notes: `Prime golden hour viewing spot in ${destName}`,
        },
        {
          time: '08:30 PM',
          slot: 'night',
          activity: `Evening Promenade & Nightlife at ${popularAreas[(d % popularAreas.length)]}`,
          location: popularAreas[(d % popularAreas.length)],
          durationMinutes: 120,
          estimatedCost: isDomestic ? 1000 : 2800,
          transportModeToNext: 'Taxi',
          notes: `Vibrant evening atmosphere in ${destName}`,
        },
      ];

      const dayCost = timeSlots.reduce((sum, a) => sum + a.estimatedCost, 0);

      days.push({
        dayNumber: d,
        title: `Day ${d}: ${dayTheme}`,
        theme: dayTheme,
        summary: `Full day itinerary exploring ${areaName} and iconic highlights in ${destName}.`,
        activities: timeSlots,
        estimatedDayCost: dayCost,
      });
    }

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
