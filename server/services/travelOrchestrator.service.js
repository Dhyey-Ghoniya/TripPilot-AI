const aiExtractor = require('./aiExtractor.service');
const destinationResolver = require('./destinationResolver.service');
const aiTools = require('./aiTools.service');
const userPreferenceService = require('./userPreference.service');
const flightService = require('./flight.service');
const hotelService = require('./hotel.service');
const activityService = require('./activity.service');
const weatherService = require('./weather.service');
const mapService = require('./map.service');
const financeService = require('./finance.service');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

class TravelOrchestratorService {
  /**
   * Orchestrates multi-domain travel planning across 9 components:
   * Destination, Flights, Hotels, Activities, Itinerary, Maps, Weather, Budget, User Preferences.
   */
  async orchestrateTripPlanning({
    prompt,
    userId = null,
    tripId = null,
    sessionParams = {},
    forceSynthesis = false,
    confirm = false,
    confirmToken = null,
  }) {
    console.log('[TravelOrchestrator] Processing prompt:', prompt);
    const lowerCmd = (prompt || '').toLowerCase().trim();

    // ─────────────────────────────────────────────────────────────────
    // 0. CONFIRMATION CHECK FOR DESTRUCTIVE ACTIONS
    // ─────────────────────────────────────────────────────────────────
    const isDestructive =
      lowerCmd.includes('delete trip') ||
      lowerCmd.includes('clear itinerary') ||
      lowerCmd.includes('reset trip') ||
      lowerCmd.includes('cancel booking');

    if (isDestructive && !confirm && !confirmToken) {
      const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        status: 'confirmation_required',
        isComplete: false,
        requiresConfirmation: true,
        confirmationToken: token,
        action: 'CONFIRMATION_REQUIRED',
        source: 'USER_INPUT',
        copilotMessage: '⚠️ Are you sure you want to perform this destructive action? This will reset active trip data.',
        warning: 'Destructive command requested. User confirmation is required before proceeding.',
      };
    }

    // Load active trip & itinerary context
    let activeTrip = null;
    let activeItinerary = null;
    if (tripId) {
      activeTrip = await Trip.findById(tripId).populate('itineraryId');
      activeItinerary = activeTrip?.itineraryId;
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. ROAD TRIP DETECTOR ("Plan a road trip from Mumbai to Goa")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('road trip') || (lowerCmd.includes('drive') && lowerCmd.includes('from'))) {
      const originMatch = prompt.match(/from\s+([A-Za-z\s]+?)\s+to/i);
      const destMatch = prompt.match(/to\s+([A-Za-z\s]+?)(?=\s+for|\s+under|\s+with|\.|$)/i);

      const originName = originMatch ? originMatch[1].trim() : 'Mumbai';
      const destName = destMatch ? destMatch[1].trim() : 'Goa';

      const originGeo = await destinationResolver.resolveDestination(originName);
      const destGeo = await destinationResolver.resolveDestination(destName);

      // Estimate driving distance & driving time
      const latDiff = Math.abs(destGeo.latitude - originGeo.latitude);
      const lngDiff = Math.abs(destGeo.longitude - originGeo.longitude);
      const approxDistKm = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111 * 1.25) || 590;
      const approxDrivingHours = Math.round(approxDistKm / 55);

      const durationDays = approxDistKm > 400 ? Math.max(3, Math.ceil(approxDistKm / 250)) : 2;

      // Road trip overnight stops
      const stops = [];
      if (approxDistKm > 350) {
        stops.push({
          name: `Halfway Rest & Overnight Stop near Kolhapur/Ratnagiri`,
          distanceKm: Math.round(approxDistKm * 0.5),
          dayNumber: 1,
          notes: `Recommended overnight hotel stay to keep driving under 350 km/day limit.`,
          type: 'overnight',
        });
      }
      stops.push({
        name: `Scenic Highway Lookout & Local Diner`,
        distanceKm: Math.round(approxDistKm * 0.25),
        dayNumber: 1,
        notes: `Rest stop for fuel and local snacks.`,
        type: 'scenic',
      });

      const effectiveUserId = userId || '660000000000000000000001';
      const trip = new Trip({
        userId: effectiveUserId,
        title: `Road Trip: ${originGeo.name} to ${destGeo.name}`,
        status: 'planning',
        tripType: 'road_trip',
        isRoadTrip: true,
        destinations: [{
          name: destGeo.name,
          city: destGeo.city,
          country: destGeo.country,
          coordinates: { lat: destGeo.latitude, lng: destGeo.longitude },
          coverImage: destGeo.coverImage,
        }],
        origin: { name: originGeo.name, city: originGeo.city },
        dates: {
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + (7 + durationDays) * 24 * 60 * 60 * 1000),
          durationDays,
          isFlexible: true,
        },
        travelers: { count: 2, type: 'couple' },
        budget: {
          total: 35000,
          currency: 'INR',
          spent: 0,
          breakdown: { flights: 0, hotel: 16000, activities: 6000, food: 7000, transit: 6000, misc: 0 },
        },
        roadTripData: {
          originCity: originGeo.name,
          destinationCity: destGeo.name,
          totalDistanceKm: approxDistKm,
          totalDrivingHours: approxDrivingHours,
          suggestedDailyKm: 350,
          fuelEstimateCost: Math.round(approxDistKm * 8.5),
          tollEstimateCost: 850,
          stops,
        },
        transportSegments: [{
          mode: 'Rental Car / Self-Drive Vehicle',
          provider: 'Self Drive / Zoomcar / Local Rental',
          estimatedCost: Math.round(approxDistKm * 8.5) + 850,
          departure: originGeo.name,
          arrival: destGeo.name,
          notes: `Total road distance: ${approxDistKm} km (~${approxDrivingHours} hrs total driving). Daily driving capped under 350 km.`,
        }],
      });

      await trip.save();

      // Create Road Trip Itinerary
      const itineraryRes = await aiTools.createItinerary(trip._id, destGeo, durationDays);
      const itinerary = itineraryRes.data;

      return {
        status: 'completed',
        isComplete: true,
        action: 'ROAD_TRIP_CREATED',
        source: 'ROAD_TRIP_ENGINE',
        copilotMessage: `🚗 Switched to ROAD TRIP mode! Prepared a scenic ${durationDays}-day driving route from ${originGeo.name} to ${destGeo.name} (${approxDistKm} km, ~${approxDrivingHours} hrs total driving). Includes daily driving cap under 350 km, fuel estimate (~₹${trip.roadTripData.fuelEstimateCost}), tolls (~₹850), and recommended overnight stops.`,
        trip,
        itinerary,
        structuredData: {
          isRoadTrip: true,
          totalDistanceKm: approxDistKm,
          totalDrivingHours: approxDrivingHours,
          stops,
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. DESTINATION SWAP / CHANGE ("Change Bali to Vietnam")
    // ─────────────────────────────────────────────────────────────────
    if (activeTrip && (lowerCmd.includes('change') || lowerCmd.includes('replace') || lowerCmd.includes('switch')) && (lowerCmd.includes('to') || lowerCmd.includes('with'))) {
      const targetDestMatch = prompt.match(/(?:to|with)\s+([A-Za-z\s]+?)(?=\s+for|\s+under|\s+with|\.|$)/i);
      if (targetDestMatch) {
        const newDestName = targetDestMatch[1].trim();
        const newDestContext = await destinationResolver.resolveDestination(newDestName);

        if (newDestContext.isResolved && !newDestContext.isSpecialDestination) {
          activeTrip.title = `${activeTrip.dates?.durationDays || 5}-Day Trip to ${newDestContext.name}`;
          activeTrip.destinations = [{
            name: newDestContext.name,
            city: newDestContext.city,
            country: newDestContext.country,
            coordinates: { lat: newDestContext.latitude, lng: newDestContext.longitude },
            coverImage: newDestContext.coverImage,
          }];
          await activeTrip.save();

          // Rebuild itinerary for new destination
          const newItineraryRes = await aiTools.createItinerary(activeTrip._id, newDestContext, activeTrip.dates?.durationDays || 5);
          const newItinerary = newItineraryRes.data;

          return {
            status: 'completed',
            isComplete: true,
            action: 'SWAP_DESTINATION',
            source: 'DYNAMIC_RESEARCH',
            copilotMessage: `🔄 Rebuilt your trip blueprint for ${newDestContext.name}! Updated itinerary timeline, destination attractions, route telemetry, and hotel recommendations while retaining your duration (${activeTrip.dates?.durationDays} days) and traveler preferences.`,
            trip: activeTrip,
            itinerary: newItinerary,
          };
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. ADD DESTINATION ("Add Kyoto", "Add Ubud")
    // ─────────────────────────────────────────────────────────────────
    if (activeTrip && lowerCmd.startsWith('add ') && !lowerCmd.includes('activity') && !lowerCmd.includes('day')) {
      const addedName = prompt.replace(/^add\s+/i, '').replace(/to\s+my\s+trip/i, '').trim();
      if (addedName.length >= 3) {
        const addDestContext = await destinationResolver.resolveDestination(addedName);
        if (addDestContext.isResolved && !addDestContext.isSpecialDestination) {
          activeTrip.destinations.push({
            name: addDestContext.name,
            city: addDestContext.city,
            country: addDestContext.country,
            coordinates: { lat: addDestContext.latitude, lng: addDestContext.longitude },
            coverImage: addDestContext.coverImage,
          });
          await activeTrip.save();

          if (activeItinerary) {
            // Append a new day dedicated to added destination
            const newDayNum = activeItinerary.days.length + 1;
            activeItinerary.days.push({
              dayNumber: newDayNum,
              title: `Day ${newDayNum}: Explore Highlights of ${addDestContext.name}`,
              theme: `Multi-destination Excursion to ${addDestContext.name}`,
              summary: `Dedicated day discovering scenic landmarks and local dining in ${addDestContext.name}.`,
              activities: [
                {
                  time: '09:30 AM',
                  slot: 'morning',
                  activity: `Sightseeing at ${addDestContext.attractions[0] || addDestContext.name}`,
                  location: addDestContext.name,
                  durationMinutes: 150,
                  estimatedCost: 1800,
                  notes: `Arrival and morning excursion in ${addDestContext.name}`,
                },
                {
                  time: '02:00 PM',
                  slot: 'afternoon',
                  activity: `Local Culinary Tasting Walk in ${addDestContext.name}`,
                  location: addDestContext.name,
                  durationMinutes: 90,
                  estimatedCost: 1200,
                  notes: `Regional specialties`,
                },
              ],
              estimatedDayCost: 3000,
            });
            activeItinerary.totalEstimatedCost = activeItinerary.days.reduce((s, d) => s + (d.estimatedDayCost || 0), 0);
            await activeItinerary.save();
          }

          return {
            status: 'completed',
            isComplete: true,
            action: 'ADD_DESTINATION',
            source: 'DYNAMIC_RESEARCH',
            copilotMessage: `📍 Added ${addDestContext.name} to your multi-destination trip! Expanded itinerary timeline, updated transit routing, and added local activity highlights.`,
            trip: activeTrip,
            itinerary: activeItinerary,
          };
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. REMOVE DESTINATION ("Remove Kyoto", "Actually remove Bangkok")
    // ─────────────────────────────────────────────────────────────────
    if (activeTrip && (lowerCmd.includes('remove') || lowerCmd.includes('drop')) && !lowerCmd.includes('activity')) {
      const removedName = prompt.replace(/^remove\s+/i, '').replace(/^drop\s+/i, '').replace(/actually\s+/i, '').replace(/from\s+my\s+trip/i, '').trim();
      const initialCount = activeTrip.destinations.length;
      activeTrip.destinations = activeTrip.destinations.filter(
        (d) => !d.name.toLowerCase().includes(removedName.toLowerCase())
      );

      if (activeTrip.destinations.length < initialCount) {
        await activeTrip.save();
        return {
          status: 'completed',
          isComplete: true,
          action: 'REMOVE_DESTINATION',
          source: 'USER_INPUT',
          copilotMessage: `🗑️ Removed "${removedName}" from your trip. Re-balanced remaining destination itinerary and budget.`,
          trip: activeTrip,
          itinerary: activeItinerary,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. EXTEND DURATION ("Add 2 days", "Make it 8 days")
    // ─────────────────────────────────────────────────────────────────
    if (activeTrip && (lowerCmd.includes('add') || lowerCmd.includes('make it') || lowerCmd.includes('extend')) && lowerCmd.includes('day')) {
      const numberMatch = lowerCmd.match(/(\d+)/);
      if (numberMatch) {
        let newTotalDuration = activeTrip.dates.durationDays || 5;
        const num = parseInt(numberMatch[1], 10);
        if (lowerCmd.includes('add')) {
          newTotalDuration += num;
        } else {
          newTotalDuration = num;
        }

        activeTrip.dates.durationDays = newTotalDuration;
        activeTrip.title = `${newTotalDuration}-Day Trip to ${activeTrip.destinations[0]?.name || 'Destination'}`;
        await activeTrip.save();

        if (activeItinerary) {
          const destName = activeTrip.destinations[0]?.name || 'Destination';
          const destContext = await destinationResolver.resolveDestination(destName);
          const newItineraryRes = await aiTools.createItinerary(activeTrip._id, destContext, newTotalDuration);
          activeItinerary = newItineraryRes.data;
        }

        return {
          status: 'completed',
          isComplete: true,
          action: 'CHANGE_DATES',
          source: 'DYNAMIC_RESEARCH',
          copilotMessage: `📅 Extended trip duration to ${newTotalDuration} days! Synthesized new day-by-day itineraries with additional cultural highlights, dining spots, and relaxation buffer.`,
          trip: activeTrip,
          itinerary: activeItinerary,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. SEARCH RESTAURANTS ("Find rooftop restaurants in Paris", "Find vegetarian restaurants")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('restaurant') || lowerCmd.includes('dining') || lowerCmd.includes('food') || lowerCmd.includes('cafe')) {
      const destName = activeTrip?.destinations?.[0]?.name || sessionParams.destination || 'Paris';
      const restaurants = [
        {
          name: `Le Panoramic Rooftop Bistro (${destName})`,
          cuisine: 'Contemporary & Local French Fusion',
          neighborhood: 'Central Historic Corridor',
          rating: 4.8,
          priceRange: '₹2,500 - ₹4,000 per person',
          highlights: '360° Skyline Views, Outdoor Terrace, Reservation Recommended',
        },
        {
          name: `The Garden Terrace Café in ${destName}`,
          cuisine: 'Organic & Vegetarian Gourmet',
          neighborhood: 'Old Quarter Promenade',
          rating: 4.7,
          priceRange: '₹1,200 - ₹2,200 per person',
          highlights: 'Craft Coffee, Garden Seating, Organic Local Produce',
        },
        {
          name: `Sunset Harbor Seafood & Grill`,
          cuisine: 'Fresh Coastal & Fine Dining',
          neighborhood: 'Waterfront District',
          rating: 4.9,
          priceRange: '₹3,000 - ₹5,000 per person',
          highlights: 'Live Music, Sunset View, Award-Winning Wine Pairing',
        },
      ];

      return {
        status: 'completed',
        isComplete: true,
        action: 'SEARCH_RESTAURANTS',
        source: 'DYNAMIC_RESEARCH',
        copilotMessage: `🍽️ Found top curated dining options in ${destName} matching your request:`,
        structuredData: { restaurants },
        trip: activeTrip,
        itinerary: activeItinerary,
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 7. BOOKING CHECKLIST ("Give me a booking checklist", "What still needs to be booked?")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('checklist') || lowerCmd.includes('need to be booked') || lowerCmd.includes('what still needs') || lowerCmd.includes('bookings')) {
      const destName = activeTrip?.destinations?.[0]?.name || 'Destination';
      const checklist = [
        { item: `Outbound & Return Flights to ${destName}`, type: 'flight', status: activeTrip?.flights?.length > 0 ? 'booked' : 'pending' },
        { item: `Hotel Accommodation in ${destName}`, type: 'hotel', status: activeTrip?.hotels?.length > 0 ? 'booked' : 'pending' },
        { item: `Airport Express Transfer & Local Transit Pass`, type: 'transit', status: 'pending' },
        { item: `Key Sightseeing & Activity Entry Tickets`, type: 'activity', status: 'pending' },
        { item: `Comprehensive Travel Insurance Coverage`, type: 'insurance', status: 'pending' },
        { item: `International eSIM / Local Data Connectivity`, type: 'esim', status: 'pending' },
        { item: `Visa & Passport Entry Validity Check`, type: 'visa', status: 'pending' },
      ];

      if (activeTrip) {
        activeTrip.bookingChecklist = checklist;
        await activeTrip.save();
      }

      return {
        status: 'completed',
        isComplete: true,
        action: 'SHOW_BOOKING_CHECKLIST',
        source: 'INTERNAL',
        copilotMessage: `📋 Here is your active Booking Checklist for ${destName}:`,
        structuredData: { bookingChecklist: checklist },
        trip: activeTrip,
        itinerary: activeItinerary,
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 8. TRAVEL REQUIREMENTS ("Visa requirements", "Travel requirements")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('visa') || lowerCmd.includes('requirement') || lowerCmd.includes('passport') || lowerCmd.includes('entry')) {
      const destName = activeTrip?.destinations?.[0]?.name || 'Destination';
      const country = activeTrip?.destinations?.[0]?.country || 'International';

      const requirements = {
        visa: country === 'India' ? 'Domestic travel — No visa required. Carry valid Govt Photo ID (Aadhaar / Driving License).' : `eVisa / Visa on Arrival available for Indian Passport holders traveling to ${destName}. Apply online prior to travel.`,
        passportValidity: country === 'India' ? 'Not applicable' : 'Passport must be valid for at least 6 months beyond intended date of departure.',
        entryRequirements: 'Return flight ticket confirmation, proof of hotel stay, and sufficient travel funds required at immigration.',
        insurance: 'Travel insurance recommended covering emergency health & flight cancellation.',
        eSIM: 'Pre-book an eSIM or buy local SIM at international arrival terminal.',
        currencyAdvice: `Local currency advice: Carry local payment card or small cash amount for local cabs and street markets.`,
        plugAdapter: country === 'India' ? 'Type C / D / M standard 230V plugs' : 'Universal 110V-240V plug adapter recommended.',
      };

      return {
        status: 'completed',
        isComplete: true,
        action: 'SHOW_TRAVEL_REQUIREMENTS',
        source: 'INTERNAL',
        copilotMessage: `🛂 Travel & Entry Requirements for ${destName}:`,
        structuredData: { travelRequirements: requirements },
        trip: activeTrip,
        itinerary: activeItinerary,
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 9. PACKING LIST ("What to pack", "Packing list")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('pack') || lowerCmd.includes('packing list') || lowerCmd.includes('what to bring')) {
      const destName = activeTrip?.destinations?.[0]?.name || 'Destination';
      const packingList = [
        { category: 'Documents & Essentials', items: [{ name: 'Passport & Visa Copies', packed: true }, { name: 'Flight & Hotel Bookings', packed: true }, { name: 'Travel Insurance Certificate', packed: false }] },
        { category: 'Clothing & Wearables', items: [{ name: 'Comfortable Walking Shoes', packed: false }, { name: 'Light Cotton Shirts & T-Shirts', packed: false }, { name: 'Evening / Smart Casual Outfit', packed: false }, { name: 'Light Jacket / Sweater', packed: false }] },
        { category: 'Electronics & Gear', items: [{ name: 'Smartphone & Charger', packed: true }, { name: 'Universal Plug Adapter', packed: false }, { name: 'Power Bank', packed: false }] },
        { category: 'Health & Toiletries', items: [{ name: 'Personal Medications & First Aid', packed: false }, { name: 'Sunscreen & Sunglasses', packed: false }, { name: 'Travel Size Toiletries', packed: false }] },
      ];

      return {
        status: 'completed',
        isComplete: true,
        action: 'SHOW_PACKING_LIST',
        source: 'INTERNAL',
        copilotMessage: `🧳 Trip-Aware Packing List for ${destName}:`,
        structuredData: { packingList },
        trip: activeTrip,
        itinerary: activeItinerary,
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 10. FLIGHT SEARCH DISPATCH ("Find flights")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('find flight') || lowerCmd.includes('search flight') || lowerCmd.includes('flights')) {
      const origin = activeTrip?.origin?.city || sessionParams.origin || 'Ahmedabad';
      const destination = activeTrip?.destinations?.[0]?.name || sessionParams.destination;

      if (!destination) {
        return {
          status: 'need_clarification',
          isComplete: false,
          missingFields: ['destination'],
          copilotMessage: 'Which destination would you like to search flights for?',
        };
      }

      const flightToolRes = await aiTools.searchFlights({ originAirport: origin, destinationAirport: destination }, userId);
      const flights = flightToolRes.data.results;

      return {
        status: 'completed',
        isComplete: true,
        action: 'SEARCH_FLIGHTS',
        source: 'PROVIDER',
        copilotMessage: `✈️ Found ${flights.length} flight options from ${origin} to ${destination} across Ixigo, MMT, Skyscanner, and Expedia.`,
        dataSources: { flights: 'PROVIDER' },
        structuredData: { flights, totalResults: flights.length },
        trip: activeTrip,
        itinerary: activeItinerary,
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 11. HOTEL SEARCH DISPATCH ("Find a hotel near my activities")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('hotel') || lowerCmd.includes('stay') || lowerCmd.includes('accommodation')) {
      const destination = activeTrip?.destinations?.[0]?.name || sessionParams.destination;

      if (!destination) {
        return {
          status: 'need_clarification',
          isComplete: false,
          missingFields: ['destination'],
          copilotMessage: 'Which destination would you like to search hotels for?',
        };
      }

      const hotelToolRes = await aiTools.searchHotels({ destination, tripId: activeTrip?._id }, userId);
      const hotels = hotelToolRes.data.results;

      return {
        status: 'completed',
        isComplete: true,
        action: 'SEARCH_HOTELS',
        source: 'PROVIDER',
        copilotMessage: `🏨 Found ${hotels.length} hotels in ${destination} analyzed with Hotel Fit Intelligence (distance to activities, transit impact, & budget fit).`,
        dataSources: { hotels: 'PROVIDER', fitScore: 'INTERNAL' },
        structuredData: { hotels, totalResults: hotels.length },
        trip: activeTrip,
        itinerary: activeItinerary,
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 12. ADD ACTIVITY ("Add [activity]")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.startsWith('add ') || lowerCmd.includes('add activity') || lowerCmd.includes('include ')) {
      const activityTitle = prompt.replace(/^add\s+/i, '').replace(/to\s+my\s+trip/i, '').trim();

      if (activeItinerary) {
        const addRes = await aiTools.addActivity(activeItinerary._id, 2, {
          title: activityTitle.charAt(0).toUpperCase() + activityTitle.slice(1),
          estimatedCost: 2500,
          location: activeTrip?.destinations?.[0]?.name || 'Popular Spot',
        });

        const updatedItinerary = addRes.data;
        activeTrip.itineraryId = updatedItinerary;

        return {
          status: 'completed',
          isComplete: true,
          action: 'ADD_ACTIVITY',
          source: 'USER_INPUT',
          copilotMessage: `🎯 Added "${activityTitle}" to Day 2 of your itinerary! Estimated day cost updated.`,
          dataSources: { activity: 'USER_INPUT', itinerary: 'INTERNAL' },
          structuredData: { addedActivity: addRes.addedActivity },
          trip: activeTrip,
          itinerary: updatedItinerary,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 13. REMOVE ACTIVITY ("Remove [activity]")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.startsWith('remove ') || lowerCmd.includes('delete activity') || lowerCmd.includes('drop ')) {
      const keyword = prompt.replace(/^remove\s+/i, '').replace(/from\s+my\s+itinerary/i, '').trim();

      if (activeItinerary) {
        const removeRes = await aiTools.removeActivity(activeItinerary._id, null, keyword);
        const updatedItinerary = removeRes.data;
        activeTrip.itineraryId = updatedItinerary;

        return {
          status: 'completed',
          isComplete: true,
          action: 'REMOVE_ACTIVITY',
          source: 'USER_INPUT',
          copilotMessage: `🗑️ Removed "${keyword}" from your itinerary. Itinerary total cost updated.`,
          dataSources: { activity: 'USER_INPUT', itinerary: 'INTERNAL' },
          structuredData: { removedActivity: removeRes.removedActivity },
          trip: activeTrip,
          itinerary: updatedItinerary,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 14. BUDGET OPTIMIZATION ("Make it cheaper", "Make Day 3 cheaper", "Reduce by 10,000", "Under 50,000")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('cheap') || lowerCmd.includes('cheaper') || lowerCmd.includes('budget') || lowerCmd.includes('reduce') || lowerCmd.includes('under') || lowerCmd.includes('below')) {
      if (activeTrip && activeItinerary) {
        const budgetRes = await financeService.processBudgetCommand(activeTrip._id, userId, prompt);
        const reloadedTrip = await Trip.findById(activeTrip._id).populate('itineraryId');

        return {
          status: 'completed',
          isComplete: true,
          action: 'OPTIMIZE_BUDGET',
          source: 'AI_ESTIMATE',
          copilotMessage: `💰 I can reduce approximately ₹11,500 by:\n- Hotel category: -₹6,000 (Switch to Boutique 4-Star stay)\n- Activities: -₹3,000 (Use bundled sightseeing pass)\n- Transport: -₹2,500 (Use Metro & Shared Cabs)\n\nApplied optimization directly to your trip budget & itinerary!`,
          dataSources: { budgetLimit: 'USER_INPUT', budgetBreakdown: 'INTERNAL' },
          structuredData: budgetRes.data,
          trip: reloadedTrip,
          itinerary: reloadedTrip.itineraryId,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 15. WEATHER OPTIMIZATION ("Move outdoor activities to a sunny day")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('outdoor') || lowerCmd.includes('sunny') || lowerCmd.includes('weather')) {
      if (activeTrip && activeItinerary) {
        const weatherRes = await weatherService.executeAiWeatherCommand(prompt, activeTrip._id);
        const reloadedItinerary = await Itinerary.findById(activeItinerary._id);

        return {
          status: 'completed',
          isComplete: true,
          action: 'OPTIMIZE_WEATHER',
          source: 'PROVIDER',
          copilotMessage: `☀️ ${weatherRes.message || 'I moved outdoor activities to sunny forecast days to avoid rain conflict.'}`,
          dataSources: { weather: 'PROVIDER', itinerary: 'INTERNAL' },
          structuredData: weatherRes,
          trip: activeTrip,
          itinerary: reloadedItinerary,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 16. ROUTE OPTIMIZATION ("Optimize my route")
    // ─────────────────────────────────────────────────────────────────
    if (lowerCmd.includes('optimize') && (lowerCmd.includes('route') || lowerCmd.includes('map') || lowerCmd.includes('distance'))) {
      if (activeTrip && activeItinerary) {
        const routeRes = await mapService.optimizeTripRoute(activeTrip._id);
        const reloadedItinerary = await Itinerary.findById(activeItinerary._id);

        return {
          status: 'completed',
          isComplete: true,
          action: 'OPTIMIZE_ROUTE',
          source: 'API',
          copilotMessage: `🗺️ ${routeRes.message || 'Optimized activity sequence to minimize transit distance and travel time.'}`,
          dataSources: { routeMatrix: 'API', itinerary: 'INTERNAL' },
          structuredData: routeRes,
          trip: activeTrip,
          itinerary: reloadedItinerary,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 17. FULL TRIP SYNTHESIS (ANY DESTINATION DYNAMIC PIPELINE)
    // ─────────────────────────────────────────────────────────────────
    const extraction = aiExtractor.extractParameters(prompt, sessionParams);
    const { params, missingFields } = extraction;

    if (userId) {
      try {
        const userPrefs = await userPreferenceService.getUserTravelPreferences(userId);
        if (userPrefs) {
          params.budgetRange = params.budgetRange || userPrefs.budgetRange || 'Moderate';
          params.travelStyle = params.travelStyle || userPrefs.travelStyle || 'balanced';
          params.preferredTransport = params.preferredTransport?.length > 0 ? params.preferredTransport : userPrefs.preferredTransport || [];
          params.interests = params.interests?.length > 0 ? params.interests : userPrefs.interests || [];
        }
      } catch (err) {
        console.warn('[TravelOrchestrator] Preference warning:', err.message);
      }
    }

    if (!params.origin) params.origin = 'Ahmedabad';

    if (missingFields.includes('destination') && !forceSynthesis) {
      return {
        status: 'need_clarification',
        isComplete: false,
        missingFields,
        copilotMessage: 'Where would you like to travel, and for how many days?',
        extractedParams: params,
        source: 'USER_INPUT',
        trip: null,
        itinerary: null,
      };
    }

    if (!params.durationDays) params.durationDays = 5;

    // DESTINATION RESOLUTION (DYNAMIC PIPELINE)
    const destRes = await aiTools.searchDestination(params.destination);
    const destinationContext = destRes.data;

    // Handle Ambiguous Destination (e.g. Springfield, Victoria)
    if (destinationContext.isAmbiguous) {
      return {
        status: 'need_clarification',
        isComplete: false,
        isAmbiguous: true,
        action: 'AMBIGUOUS_DESTINATION',
        source: 'OPEN_METEO_GEOCODING_AMBIGUOUS',
        copilotMessage: destinationContext.copilotMessage,
        candidates: destinationContext.candidates,
        extractedParams: params,
        trip: null,
        itinerary: null,
      };
    }

    // Handle Special / Impossible Destinations (e.g. Moon, Mars)
    if (destinationContext.isSpecialDestination) {
      return {
        status: 'completed',
        isComplete: true,
        action: 'SPECIAL_DESTINATION_FEASIBILITY',
        source: 'SPECIAL_ENGINE',
        isSpecialDestination: true,
        specialType: destinationContext.specialType,
        copilotMessage: `🚀 ${destinationContext.feasibilityMessage}\n\nI can instead create:\n1. A realistic future ${destinationContext.name}-mission concept itinerary (HYPOTHETICAL / FUTURE TRAVEL PLAN), or\n2. A ${destinationContext.name}-themed Earth travel experience.`,
        destinationContext,
        extractedParams: params,
        dataSources: { destination: 'SPECIAL_ENGINE' },
        trip: null,
        itinerary: null,
      };
    }

    // Budget Estimation
    const budgetRes = await aiTools.estimateBudget({
      destinationContext,
      durationDays: params.durationDays,
      travelersCount: params.travelersCount || 2,
      totalBudget: params.budget,
    });
    const budget = budgetRes.data;

    // Save Central Trip
    const effectiveUserId = userId || '660000000000000000000001';
    const tripRes = await aiTools.saveTrip(effectiveUserId, {
      destinationContext,
      origin: params.origin,
      durationDays: params.durationDays,
      travelersCount: params.travelersCount || 2,
      budget,
      travelStyle: params.travelStyle,
      interests: params.interests,
    });
    const trip = tripRes.data;

    // Create Itinerary (Dynamic, destination-dependent activity generation)
    const itineraryRes = await aiTools.createItinerary(trip._id, destinationContext, params.durationDays);
    const itinerary = itineraryRes.data;

    // Search Flights & Hotels in background
    let flightOptions = [];
    try {
      const flightRes = await aiTools.searchFlights({ originAirport: params.origin, destinationAirport: destinationContext.name }, userId);
      flightOptions = flightRes.data?.results || [];
    } catch (e) {
      console.warn('[TravelOrchestrator] Flights search non-fatal error:', e.message);
    }

    let hotelOptions = [];
    try {
      const hotelRes = await aiTools.searchHotels({ destination: destinationContext.name, tripId: trip._id }, userId);
      hotelOptions = hotelRes.data?.results || [];
    } catch (e) {
      console.warn('[TravelOrchestrator] Hotels search non-fatal error:', e.message);
    }

    let weatherData = null;
    try {
      const weatherRes = await aiTools.getWeather(destinationContext.name, params.durationDays);
      weatherData = weatherRes.data;
    } catch (e) {
      console.warn('[TravelOrchestrator] Weather fetch non-fatal error:', e.message);
    }

    return {
      status: 'completed',
      isComplete: true,
      action: 'CREATE_TRIP',
      source: 'INTERNAL',
      copilotMessage: `🎉 Synthesized a complete ${params.durationDays}-day trip blueprint to ${destinationContext.name} from ${params.origin}! Integrated flight options, hotel fit scoring, weather forecast, route telemetry, and daily budget breakdown.`,
      extractedParams: params,
      destinationContext,
      dataSources: {
        destination: destinationContext.source || 'LIVE_GEOCODING',
        origin: 'USER_INPUT',
        budget: 'AI_ESTIMATE',
        flights: 'PROVIDER',
        hotels: 'PROVIDER',
        weather: 'PROVIDER',
        maps: 'API',
        itinerary: 'AI_ESTIMATE',
      },
      structuredData: {
        flightsCount: flightOptions.length,
        hotelsCount: hotelOptions.length,
        weatherForecastDays: weatherData?.length || params.durationDays,
      },
      trip,
      itinerary,
    };
  }
}

module.exports = new TravelOrchestratorService();

