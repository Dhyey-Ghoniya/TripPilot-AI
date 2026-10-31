const FlightSearch = require('../models/FlightSearch');
const Trip = require('../models/Trip');
const { buildFlightHandoff } = require('./flightHandoff.service');

class FlightService {
  /**
   * Build ordinary outbound flight-search links. No live inventory provider is connected.
   */
  async searchFlights(searchParams = {}, userId = null) {
    const handoff = buildFlightHandoff(searchParams);
    const { origin, destination, departureDate, returnDate, travelersCount, cabinClass } = handoff.searchParams;
    const formattedParams = {
      originAirport: origin,
      destinationAirport: destination,
      departureDate,
      returnDate,
      isRoundTrip: Boolean(returnDate),
      passengers: { adults: travelersCount, children: 0, infants: 0 },
      cabinClass,
    };

    // Save search history in MongoDB
    let searchId = null;
    if (FlightSearch.db.readyState === 1 && origin && destination && departureDate) {
      try {
        const flightSearchDoc = new FlightSearch({
          userId: userId || null,
          searchParams: formattedParams,
          results: [],
          handoffLinks: handoff.handoffLinks,
        });
        await flightSearchDoc.save();
        searchId = flightSearchDoc._id;
      } catch (error) {
        console.warn('[FlightService] Search results returned without saving history:', error.message);
      }
    }

    return {
      searchId,
      searchParams: handoff.searchParams,
      handoffLinks: handoff.handoffLinks,
    };
  }

  /**
   * Attach selected flight to active Trip & update trip budget
   */
  async attachFlightToTrip(tripId, flightData, userId) {
    const verifiedPrice = Number(flightData?.price?.amount ?? flightData?.price);
    if (!flightData?.isLive || !flightData.airline || !flightData.flightNumber || !flightData.departureTime || !flightData.arrivalTime || !Number.isFinite(verifiedPrice) || verifiedPrice <= 0) {
      const err = new Error('Only a verified live flight result can be attached. Search and book with a provider, then add verified flight details when live inventory is connected.');
      err.statusCode = 400;
      throw err;
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      const err = new Error('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    const flightPrice = verifiedPrice;

    // Construct standardized flight object
    const newFlightItem = {
      direction: flightData.direction || 'outbound',
      airline: flightData.airline,
      flightNumber: flightData.flightNumber,
      departureAirport: flightData.departureAirport || trip.origin?.city || 'AMD',
      arrivalAirport: flightData.arrivalAirport || trip.destinations?.[0]?.name || 'DXB',
      departureTime: flightData.departureTime,
      arrivalTime: flightData.arrivalTime,
      price: flightPrice,
      cabinClass: flightData.cabinClass || 'Economy',
      isLive: true,
      status: 'shortlisted',
      bookingUrl: flightData.bookingUrl || '',
    };

    // Push to trip flights array
    trip.flights.push(newFlightItem);

    // Update trip budget breakdown & total spent
    if (trip.budget) {
      trip.budget.breakdown.flights = (trip.budget.breakdown.flights || 0) + flightPrice;
      trip.budget.spent = (trip.budget.spent || 0) + flightPrice;
    }

    await trip.save();

    return {
      success: true,
      message: `Flight ${newFlightItem.airline} (${newFlightItem.flightNumber}) attached to trip "${trip.title}"! Budget updated by ₹${flightPrice.toLocaleString()}.`,
      trip,
      attachedFlight: newFlightItem,
    };
  }

  /**
   * Execute AI Flight Assistant command
   */
  async executeAiFlightCommand(promptText, tripId = null, userId = null) {
    const prompt = (promptText || '').toLowerCase();

    // Search commands return provider links, never synthetic options or prices.
    if (prompt.includes('find flights') || prompt.includes('search flights') || prompt.includes('flight from')) {
      const originMatch = prompt.match(/from\s+([A-Za-z\s]+?)(?=\s+to|\.|$)/i);
      const destMatch = prompt.match(/to\s+([A-Za-z\s]+?)(?=\s+from|\.|$)/i);

      const origin = originMatch ? originMatch[1].trim() : '';
      const destination = destMatch ? destMatch[1].trim() : '';

      if (!origin || !destination) {
        return {
          action: 'need_details',
          message: 'Provide both your origin and destination, then use Flight Search to enter dates, travelers, and cabin class.',
          handoffLinks: [],
        };
      }

      const searchRes = await this.searchFlights({ originAirport: origin, destinationAirport: destination }, userId);

      return {
        action: 'search',
        message: `Compare real fares for ${origin} to ${destination} using the provider links. TripPilot does not show live fares.`,
        searchParams: searchRes.searchParams,
        handoffLinks: searchRes.handoffLinks,
      };
    }

    // A cheapest-flight selection requires live provider results, which are not connected.
    else if (prompt.includes('cheapest') || prompt.includes('lowest fare')) {
      return {
        action: 'cheapest',
        message: 'TripPilot cannot rank live fares. Open a provider search link to compare current prices and availability.',
        handoffLinks: [],
      };
    }

    // 3. "Add this flight to my trip"
    else if (prompt.includes('add this flight') || prompt.includes('attach flight')) {
      if (!tripId) {
        throw new Error('Trip ID is required to attach a flight.');
      }

      return {
        action: 'attach',
        message: 'No flight has been selected or verified. Use a provider link to book directly. TripPilot can only attach a verified live flight result.',
      };
    }

    // Fallback
    return {
      action: 'search',
      message: 'Tell me your origin, destination, and dates, or open Flight Search to compare current provider results.',
      handoffLinks: [],
    };
  }
}

module.exports = new FlightService();
