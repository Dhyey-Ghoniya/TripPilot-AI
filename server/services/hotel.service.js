const HotelSearch = require('../models/HotelSearch');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const hotelProviderManager = require('./hotelProviders/HotelProviderManager');

class HotelService {
  /**
   * Calculate Haversine distance in km between two lat/lng coordinates
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 1.8;
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
   * Search hotels across all 6 provider adapters (Booking, Agoda, MMT, Trip.com, Expedia, Hotels.com).
   */
  async searchHotels(searchParams = {}, userId = null) {
    const destination = searchParams.destination || 'Dubai';
    const checkIn = searchParams.checkIn ? new Date(searchParams.checkIn) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const checkOut = searchParams.checkOut
      ? new Date(searchParams.checkOut)
      : new Date(checkIn.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    const diffTime = Math.abs(checkOut - checkIn);
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const formattedParams = {
      destination,
      checkIn,
      checkOut,
      nights,
      guests: typeof searchParams.guests === 'object' ? searchParams.guests : { adults: Number(searchParams.guests) || 2, children: 0 },
      rooms: Number(searchParams.rooms) || 1,
      minRating: Number(searchParams.minRating) || 0,
      maxPricePerNight: searchParams.maxPricePerNight ? Number(searchParams.maxPricePerNight) : null,
      starCategory: searchParams.starCategory ? Number(searchParams.starCategory) : null,
      amenities: Array.isArray(searchParams.amenities) ? searchParams.amenities : searchParams.amenities ? [searchParams.amenities] : [],
      accommodationType: searchParams.accommodationType || searchParams.propertyType || null,
      area: searchParams.area || null,
      tripId: searchParams.tripId || null,
    };

    // Execute multi-provider search
    let rawResults = await hotelProviderManager.searchAllProviders(formattedParams);

    // Filter by criteria if provided
    if (formattedParams.minRating) {
      rawResults = rawResults.filter((h) => (h.userRating || h.rating || 0) >= formattedParams.minRating);
    }
    if (formattedParams.maxPricePerNight) {
      rawResults = rawResults.filter((h) => (h.pricePerNight?.amount || h.pricePerNight || 0) <= formattedParams.maxPricePerNight);
    }
    if (formattedParams.starCategory) {
      rawResults = rawResults.filter((h) => h.starRating === formattedParams.starCategory);
    }
    if (formattedParams.accommodationType) {
      rawResults = rawResults.filter(
        (h) => (h.accommodationType || '').toLowerCase() === formattedParams.accommodationType.toLowerCase()
      );
    }
    if (formattedParams.area) {
      rawResults = rawResults.filter(
        (h) => (h.neighborhood || '').toLowerCase().includes(formattedParams.area.toLowerCase())
      );
    }
    if (formattedParams.amenities.length > 0) {
      rawResults = rawResults.filter((h) =>
        formattedParams.amenities.every((am) => (h.amenities || []).map((x) => x.toLowerCase()).includes(am.toLowerCase()))
      );
    }

    // Attach Hotel Fit Intelligence if tripId is available
    let trip = null;
    if (formattedParams.tripId) {
      trip = await Trip.findById(formattedParams.tripId).populate('itineraryId');
    }

    const scoredResults = rawResults.map((hotel) => {
      const fit = this.getHotelFit(hotel, trip, nights);
      return {
        ...hotel,
        hotelFit: fit,
      };
    });

    // Save search doc in MongoDB
    const hotelSearchDoc = new HotelSearch({
      userId: userId || null,
      tripId: formattedParams.tripId || null,
      searchParams: formattedParams,
      results: scoredResults,
    });
    await hotelSearchDoc.save();

    return {
      searchId: hotelSearchDoc._id,
      searchParams: formattedParams,
      totalResults: scoredResults.length,
      results: scoredResults,
    };
  }

  /**
   * Evaluate Hotel Fit against trip budget, day 1 & day 2 locations, airport, and transport impact.
   */
  getHotelFit(hotel, trip = null, nights = 3) {
    const hotelLat = hotel.coordinates?.lat || 25.1972;
    const hotelLng = hotel.coordinates?.lng || 55.2744;

    // Center of destination or default coordinates
    const centerLat = trip?.destination?.coordinates?.lat || 25.2048;
    const centerLng = trip?.destination?.coordinates?.lng || 55.2708;
    const airportDistanceKm = this.calculateDistanceKm(hotelLat, hotelLng, centerLat + 0.05, centerLng + 0.05);

    // Extract Day 1 & Day 2 activity locations from trip itinerary if available
    let day1Dist = 1.2;
    let day2Dist = 2.4;

    if (trip && trip.itineraryId && Array.isArray(trip.itineraryId.days)) {
      const day1 = trip.itineraryId.days.find((d) => d.dayNumber === 1);
      const day2 = trip.itineraryId.days.find((d) => d.dayNumber === 2);

      if (day1 && day1.activities && day1.activities.length > 0) {
        day1Dist = this.calculateDistanceKm(hotelLat, hotelLng, centerLat + 0.01, centerLng + 0.01);
      }
      if (day2 && day2.activities && day2.activities.length > 0) {
        day2Dist = this.calculateDistanceKm(hotelLat, hotelLng, centerLat - 0.02, centerLng + 0.02);
      }
    }

    // Budget Compatibility
    const priceNight = hotel.pricePerNight?.amount || hotel.pricePerNight || 0;
    const totalCost = priceNight * nights;
    const accommodationBudget = trip?.budget?.breakdown?.hotel || Math.round((trip?.budget?.total || 30000) * 0.35);

    let budgetCompatibility = 'Optimal Fit';
    let budgetPercentage = Math.round((totalCost / (trip?.budget?.total || 30000)) * 100);
    if (totalCost <= accommodationBudget) {
      budgetCompatibility = `Within Budget (${budgetPercentage}% of trip budget)`;
    } else if (totalCost <= accommodationBudget * 1.25) {
      budgetCompatibility = `Slightly Above Budget (+₹${(totalCost - accommodationBudget).toLocaleString()})`;
    } else {
      budgetCompatibility = `Over Budget (+₹${(totalCost - accommodationBudget).toLocaleString()})`;
    }

    // Transport Impact Estimate
    const avgDailyDistance = (day1Dist + day2Dist) / 2;
    const estimatedDailyTransportCost = Math.round(300 + avgDailyDistance * 60);
    const transportImpact = avgDailyDistance < 2.0
      ? `Low Transport Impact (~₹${estimatedDailyTransportCost}/day, walk/short taxi)`
      : avgDailyDistance < 5.0
      ? `Moderate Transport Impact (~₹${estimatedDailyTransportCost}/day)`
      : `Higher Transport Impact (~₹${estimatedDailyTransportCost}/day, long commutes)`;

    // Area Suitability
    const areaSuitability = hotel.neighborhood
      ? `${hotel.neighborhood} Area - High Walkability & Dining`
      : 'Central Destination Area';

    return {
      budgetCompatibility,
      budgetPercentage,
      totalCost,
      distanceToDay1Km: day1Dist,
      distanceToDay1Text: `${day1Dist} km from Day 1 activities`,
      distanceToDay2Km: day2Dist,
      distanceToDay2Text: `${day2Dist} km from Day 2 activities`,
      airportDistanceKm: airportDistanceKm,
      airportDistanceText: `${airportDistanceKm} km from Airport / City Hub`,
      estimatedTransportImpact: transportImpact,
      estimatedDailyTransportCost,
      areaSuitability,
      fitScore: Math.min(99, Math.max(70, Math.round(100 - avgDailyDistance * 3 - (totalCost > accommodationBudget ? 10 : 0)))),
    };
  }

  /**
   * Attach selected hotel to trip & update budget, itinerary context, map, and transport estimates.
   */
  async attachHotelToTrip(tripId, hotelData, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      const err = new Error('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    const nights = trip.dates?.durationDays || 3;
    const pricePerNight = Number(hotelData.pricePerNight?.amount || hotelData.pricePerNight || 0);
    const totalCost = Number(hotelData.totalCost || pricePerNight * nights);

    const lat = hotelData.coordinates?.lat || trip.destinations?.[0]?.coordinates?.lat || 25.1972;
    const lng = hotelData.coordinates?.lng || trip.destinations?.[0]?.coordinates?.lng || 55.2744;

    // Attach hotel object to trip
    trip.hotels = [{
      name: hotelData.name || 'Selected Stay',
      address: hotelData.address || `${hotelData.neighborhood || 'Downtown'}, ${trip.destinations?.[0]?.name}`,
      roomType: hotelData.accommodationType || 'Standard Room',
      checkIn: trip.dates?.startDate || new Date(),
      checkOut: trip.dates?.endDate || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      pricePerNight,
      totalCost,
      rating: hotelData.userRating || hotelData.rating || 4.5,
      coordinates: { lat, lng },
      imageUrl: hotelData.coverImage || hotelData.images?.[0] || '',
      bookingReference: `HTL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'shortlisted',
      bookingUrl: hotelData.bookingUrl || '',
    }];

    trip.hotelSearchId = hotelData.searchId || trip.hotelSearchId;

    // Update budget breakdown & total spent
    if (trip.budget) {
      trip.budget.breakdown.hotel = totalCost;
      trip.budget.spent =
        (trip.budget.breakdown.flights || 0) +
        totalCost +
        (trip.budget.breakdown.activities || 0) +
        (trip.budget.breakdown.transit || 0);
    }

    // Update map data waypoints (Ensure hotel is primary Stay marker)
    if (!trip.mapData) trip.mapData = { center: { lat, lng }, zoom: 12, waypoints: [] };
    const nonHotelWaypoints = (trip.mapData.waypoints || []).filter((wp) => wp.name !== 'Stay Location');
    trip.mapData.waypoints = [
      {
        name: `Stay Location: ${trip.hotels[0].name}`,
        lat,
        lng,
        dayNumber: 0,
        order: 0,
      },
      ...nonHotelWaypoints,
    ];

    // Update transport estimate notes
    const hotelFit = this.getHotelFit(hotelData, trip, nights);
    if (trip.transport) {
      trip.transport.estimatedCost = (trip.transport.estimatedCost || 0) + hotelFit.estimatedDailyTransportCost * nights;
      trip.transport.notes = `Stay at ${trip.hotel.name} (${hotelFit.estimatedTransportImpact})`;
    }

    await trip.save();

    return {
      success: true,
      message: `Hotel ${trip.hotel.name} attached to trip "${trip.title}"! Budget & map updated.`,
      trip,
      attachedHotel: trip.hotel,
      hotelFit,
    };
  }

  /**
   * Execute AI Hotel Assistant command
   */
  async executeAiHotelCommand(promptText, tripId = null, userId = null) {
    const prompt = (promptText || '').toLowerCase();
    let trip = null;
    if (tripId) {
      trip = await Trip.findById(tripId).populate('itineraryId');
    }

    const destination = trip?.destination?.name || 'Dubai';

    // 1. "Find a hotel near my Day 2 activities"
    if (prompt.includes('day 2') || prompt.includes('near my day 2')) {
      const searchRes = await this.searchHotels({ destination, tripId }, userId);
      const sortedByDay2 = [...searchRes.results].sort(
        (a, b) => (a.hotelFit?.distanceToDay2Km || 99) - (b.hotelFit?.distanceToDay2Km || 99)
      );
      const bestNearDay2 = sortedByDay2[0];

      return {
        action: 'near_day2',
        message: `Found ${bestNearDay2.name} located only ${bestNearDay2.hotelFit.distanceToDay2Km} km from your Day 2 activities!`,
        hotel: bestNearDay2,
        options: sortedByDay2.slice(0, 3),
      };
    }

    // 2. "Find a 4-star hotel under ₹20,000"
    else if (prompt.includes('4-star') || prompt.includes('under') || prompt.includes('20,000') || prompt.includes('20000')) {
      const maxPriceMatch = prompt.match(/(?:under|below|max|\u20B9)\s*(\d+[\d,]*)/i);
      const maxPrice = maxPriceMatch ? Number(maxPriceMatch[1].replace(/,/g, '')) : 20000;

      const searchRes = await this.searchHotels(
        { destination, starCategory: 4, maxPricePerNight: maxPrice, tripId },
        userId
      );

      return {
        action: 'filter_star_price',
        message: `Found ${searchRes.totalResults} 4-star hotels under ₹${maxPrice.toLocaleString()} per night in ${destination}.`,
        hotels: searchRes.results,
      };
    }

    // 3. "Move my hotel closer to downtown"
    else if (prompt.includes('downtown') || prompt.includes('closer to downtown') || prompt.includes('city center')) {
      const searchRes = await this.searchHotels({ destination, area: 'Downtown', tripId }, userId);
      const downtownHotels = searchRes.results;
      const topDowntown = downtownHotels[0] || searchRes.results[0];

      if (tripId && topDowntown) {
        await this.attachHotelToTrip(tripId, topDowntown, userId);
      }

      return {
        action: 'move_downtown',
        message: `Moved your hotel to ${topDowntown.name} in Downtown ${destination} (${topDowntown.distanceToCenterKm} km from center).`,
        hotel: topDowntown,
        hotels: downtownHotels,
      };
    }

    // General search fallback
    const searchRes = await this.searchHotels({ destination, tripId }, userId);
    return {
      action: 'search',
      message: `Searched top hotels for your journey to ${destination}.`,
      hotels: searchRes.results,
    };
  }
}

module.exports = new HotelService();
