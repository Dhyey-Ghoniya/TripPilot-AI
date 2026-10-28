const BaseFlightProvider = require('./BaseFlightProvider');

class SkyscannerProvider extends BaseFlightProvider {
  constructor() {
    super('Skyscanner', 'SKYSCANNER', 'https://content.skyscnr.com/m/660c6d7a5b3a4c49/original/Skyscanner-Logo.png');
  }

  async searchFlights(searchParams) {
    const { originAirport = 'AMD', destinationAirport = 'DXB', departureDate } = searchParams;
    const dateStr = this.formatDate(departureDate);
    const bookingUrl = this.generateBookingLink(null, searchParams);

    const isDomestic = this.isDomesticRoute(originAirport, destinationAirport);
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
        arrivalTime: `${dateStr}T${isDomestic ? '07:45' : '09:30'}:00.000Z`,
        durationMinutes: isDomestic ? 105 : 210,
        stopsCount: 0,
        price: { amount: basePrice, currency: 'INR' },
        cabinClass: searchParams.cabinClass || 'economy',
        seatsRemaining: 4,
        bookingUrl,
      },
    ];
  }

  generateBookingLink() {
    // Direct search URLs are currently triggering Skyscanner's CAPTCHA page.
    // Use the public homepage rather than attempting to bypass its verification.
    return 'https://www.skyscanner.co.in/';
  }
}

module.exports = new SkyscannerProvider();
