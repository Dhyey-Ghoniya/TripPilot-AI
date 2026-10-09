const BaseFlightProvider = require('./BaseFlightProvider');

class SkyscannerProvider extends BaseFlightProvider {
  constructor() {
    super('Skyscanner', 'SKYSCANNER', 'https://content.skyscnr.com/m/660c6d7a5b3a4c49/original/Skyscanner-Logo.png');
  }

  async searchFlights(searchParams) {
    const { originAirport = 'AMD', destinationAirport = 'DXB', departureDate } = searchParams;
    const dateStr = this.formatDate(departureDate);
    const bookingUrl = this.generateBookingLink(null, searchParams);

    const isDomestic = originAirport === 'AMD' && (destinationAirport === 'GOI' || destinationAirport === 'DEL' || destinationAirport === 'BOM');
    const basePrice = isDomestic ? 4990 : 20800;

    return [
      {
        flightId: `SKY-${originAirport}-${destinationAirport}-404`,
        provider: this.name,
        providerCode: this.code,
        airline: isDomestic ? 'IndiGo' : 'SpiceJet',
        airlineCode: isDomestic ? '6E' : 'SG',
        flightNumber: isDomestic ? '6E-551' : 'SG-15',
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: `${dateStr}T06:00:00.000Z`,
        arrivalTime: `${dateStr}T09:30:00.000Z`,
        durationMinutes: isDomestic ? 105 : 210,
        stopsCount: 0,
        price: { amount: basePrice, currency: 'INR' },
        cabinClass: searchParams.cabinClass || 'economy',
        seatsRemaining: 4,
        bookingUrl,
      },
    ];
  }

  generateBookingLink(flight, searchParams) {
    const origin = (searchParams?.originAirport || 'AMD').toLowerCase();
    const dest = (searchParams?.destinationAirport || 'DXB').toLowerCase();
    const dateStr = this.formatDate(searchParams?.departureDate).replace(/-/g, '').substring(2);
    return `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${dateStr}/`;
  }
}

module.exports = new SkyscannerProvider();
