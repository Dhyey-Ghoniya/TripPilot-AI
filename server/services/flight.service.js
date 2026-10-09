const FlightSearch = require('../models/FlightSearch');
const Trip = require('../models/Trip');
const flightProviderManager = require('./flightProviders/FlightProviderManager');

class FlightService {
  /**
   * Search flights across all 6 provider adapters (Ixigo, MMT, Cleartrip, Skyscanner, Trip.com, Expedia).
   */
  async searchFlights(searchParams = {}, userId = null) {
    const origin = (searchParams.originAirport || searchParams.origin || 'AMD').toUpperCase();
    const destination = (searchParams.destinationAirport || searchParams.destination || 'DXB').toUpperCase();
    const departureDate = searchParams.departureDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const formattedParams = {
      originAirport: origin,
      destinationAirport: destination,
      departureDate,
      returnDate: searchParams.returnDate || null,
      isRoundTrip: Boolean(searchParams.returnDate),
      cabinClass: searchParams.cabinClass || 'economy',
    };

    // Execute provider search across all adapters
    const flightResults = await flightProviderManager.searchAllProviders(formattedParams);

    // Save search history in MongoDB
    const flightSearchDoc = new FlightSearch({
      userId: userId || null,
      searchParams: formattedParams,
      results: flightResults,
    });
    await flightSearchDoc.save();

    return {
      searchId: flightSearchDoc._id,
      searchParams: formattedParams,
      totalResults: flightResults.length,
      results: flightResults,
    };
  }

  /**
   * Attach selected flight to active Trip & update trip budget
   */
  async attachFlightToTrip(tripId, flightData, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      const err = new Error('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    const flightPrice = Number(flightData.price?.amount || flightData.price || 0);

    // Construct standardized flight object
    const newFlightItem = {
      direction: flightData.direction || 'outbound',
      airline: flightData.airline || 'Air Partner',
      flightNumber: flightData.flightNumber || 'FL-101',
      departureAirport: flightData.departureAirport || trip.origin?.city || 'AMD',
      arrivalAirport: flightData.arrivalAirport || trip.destinations?.[0]?.name || 'DXB',
      departureTime: flightData.departureTime || new Date(),
      arrivalTime: flightData.arrivalTime || new Date(),
      price: flightPrice,
      cabinClass: flightData.cabinClass || 'Economy',
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

    // 1. "Find flights from X to Y"
    if (prompt.includes('find flights') || prompt.includes('search flights') || prompt.includes('flight from')) {
      const originMatch = prompt.match(/from\s+([A-Za-z\s]+?)(?=\s+to|\.|$)/i);
      const destMatch = prompt.match(/to\s+([A-Za-z\s]+?)(?=\s+from|\.|$)/i);

      const origin = originMatch ? originMatch[1].trim() : 'AMD';
      const destination = destMatch ? destMatch[1].trim() : 'DXB';

      const searchRes = await this.searchFlights({ originAirport: origin, destinationAirport: destination }, userId);

      return {
        action: 'search',
        message: `Found ${searchRes.totalResults} flight options from ${origin} to ${destination} across 6 providers (Ixigo, MMT, Cleartrip, Skyscanner, Trip.com, Expedia).`,
        flights: searchRes.results,
      };
    }

    // 2. "Find the cheapest reasonable option"
    else if (prompt.includes('cheapest') || prompt.includes('lowest fare')) {
      const searchRes = await this.searchFlights({ originAirport: 'AMD', destinationAirport: 'DXB' }, userId);
      const sortedByPrice = [...searchRes.results].sort((a, b) => (a.price.amount || a.price) - (b.price.amount || b.price));
      const cheapest = sortedByPrice[0];

      return {
        action: 'cheapest',
        message: `Cheapest option found: ${cheapest.airline} (${cheapest.flightNumber}) via ${cheapest.providerName} for ₹${cheapest.price.amount.toLocaleString()}.`,
        cheapestFlight: cheapest,
      };
    }

    // 3. "Add this flight to my trip"
    else if (prompt.includes('add this flight') || prompt.includes('attach flight')) {
      if (!tripId) {
        throw new Error('Trip ID is required to attach a flight.');
      }

      const searchRes = await this.searchFlights({ originAirport: 'AMD', destinationAirport: 'DXB' }, userId);
      const targetFlight = searchRes.results[0];

      const attachRes = await this.attachFlightToTrip(tripId, targetFlight, userId);
      return {
        action: 'attach',
        message: attachRes.message,
        trip: attachRes.trip,
      };
    }

    // Fallback
    const searchRes = await this.searchFlights({ originAirport: 'AMD', destinationAirport: 'DXB' }, userId);
    return {
      action: 'search',
      message: `Searched flight matrix for your journey.`,
      flights: searchRes.results,
    };
  }
}

module.exports = new FlightService();
