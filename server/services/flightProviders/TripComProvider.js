const BaseFlightProvider = require('./BaseFlightProvider');

class TripComProvider extends BaseFlightProvider {
  constructor() {
    super('Trip.com', 'TRIPCOM', 'https://ak-s.tripcdn.com/images/100u00000000000000000100.png');
  }

  async searchFlights(searchParams) {
    const { originAirport = 'AMD', destinationAirport = 'DXB', departureDate } = searchParams;
    const dateStr = this.formatDate(departureDate);
    const bookingUrl = this.generateBookingLink(null, searchParams);

    const isDomestic = originAirport === 'AMD' && (destinationAirport === 'GOI' || destinationAirport === 'DEL' || destinationAirport === 'BOM');
    const basePrice = isDomestic ? 5080 : 21200;

    return [
      {
        flightId: `TRIP-${originAirport}-${destinationAirport}-505`,
        provider: this.name,
        providerCode: this.code,
        airline: isDomestic ? 'Air India Express' : 'Etihad Airways',
        airlineCode: isDomestic ? 'IX' : 'EY',
        flightNumber: isDomestic ? 'IX-204' : 'EY-288',
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: `${dateStr}T11:00:00.000Z`,
        arrivalTime: `${dateStr}T14:45:00.000Z`,
        durationMinutes: isDomestic ? 110 : 225,
        stopsCount: isDomestic ? 0 : 1,
        price: { amount: basePrice, currency: 'INR' },
        cabinClass: searchParams.cabinClass || 'economy',
        seatsRemaining: 8,
        bookingUrl,
      },
    ];
  }

  generateBookingLink(flight, searchParams) {
    const origin = (searchParams?.originAirport || 'AMD').toLowerCase();
    const dest = (searchParams?.destinationAirport || 'DXB').toLowerCase();
    const dateStr = this.formatDate(searchParams?.departureDate);
    return `https://www.trip.com/flights/${origin}-to-${dest}/tickets-${origin}-${dest}?ddate=${dateStr}`;
  }
}

module.exports = new TripComProvider();
