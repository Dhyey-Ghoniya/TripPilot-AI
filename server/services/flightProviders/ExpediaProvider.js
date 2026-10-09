const BaseFlightProvider = require('./BaseFlightProvider');

class ExpediaProvider extends BaseFlightProvider {
  constructor() {
    super('Expedia', 'EXPEDIA', 'https://www.expedia.com/favicon.ico');
  }

  async searchFlights(searchParams) {
    const { originAirport = 'AMD', destinationAirport = 'DXB', departureDate } = searchParams;
    const dateStr = this.formatDate(departureDate);
    const bookingUrl = this.generateBookingLink(null, searchParams);

    const isDomestic = originAirport === 'AMD' && (destinationAirport === 'GOI' || destinationAirport === 'DEL' || destinationAirport === 'BOM');
    const basePrice = isDomestic ? 5400 : 22500;

    return [
      {
        flightId: `EXP-${originAirport}-${destinationAirport}-606`,
        provider: this.name,
        providerCode: this.code,
        airline: isDomestic ? 'Vistara' : 'Emirates',
        airlineCode: isDomestic ? 'UK' : 'EK',
        flightNumber: isDomestic ? 'UK-955' : 'EK-503',
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: `${dateStr}T21:30:00.000Z`,
        arrivalTime: `${dateStr}T01:00:00.000Z`,
        durationMinutes: isDomestic ? 110 : 210,
        stopsCount: 0,
        price: { amount: basePrice, currency: 'INR' },
        cabinClass: searchParams.cabinClass || 'economy',
        seatsRemaining: 6,
        bookingUrl,
      },
    ];
  }

  generateBookingLink(flight, searchParams) {
    const origin = (searchParams?.originAirport || 'AMD').toUpperCase();
    const dest = (searchParams?.destinationAirport || 'DXB').toUpperCase();
    const dateStr = this.formatDate(searchParams?.departureDate);
    return `https://www.expedia.com/Flights-Search?trip=oneway&leg1=from:${origin},to:${dest},departure:${dateStr}TANYT&passengers=adults:1`;
  }
}

module.exports = new ExpediaProvider();
