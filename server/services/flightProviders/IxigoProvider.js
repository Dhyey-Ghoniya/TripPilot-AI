const BaseFlightProvider = require('./BaseFlightProvider');

class IxigoProvider extends BaseFlightProvider {
  constructor() {
    super('Ixigo', 'IXIGO', 'https://images.ixigo.com/image/upload/f_auto/ixigo-logo.png');
  }

  async searchFlights(searchParams) {
    const { originAirport = 'AMD', destinationAirport = 'DXB', departureDate } = searchParams;
    const dateStr = this.formatDate(departureDate);
    const bookingUrl = this.generateBookingLink(null, searchParams);

    const isDomestic = this.isDomesticRoute(originAirport, destinationAirport);
    const basePrice = isDomestic ? 5200 : 21500;

    return [
      {
        flightId: `IXI-${originAirport}-${destinationAirport}-101`,
        provider: this.name,
        providerCode: this.code,
        airline: isDomestic ? 'IndiGo' : 'Emirates',
        airlineCode: isDomestic ? '6E' : 'EK',
        flightNumber: isDomestic ? '6E-1721' : 'EK-501',
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: `${dateStr}T08:15:00.000Z`,
        arrivalTime: `${dateStr}T${isDomestic ? '10:00' : '11:45'}:00.000Z`,
        durationMinutes: isDomestic ? 105 : 210,
        stopsCount: 0,
        price: { amount: basePrice, currency: 'INR' },
        cabinClass: searchParams.cabinClass || 'economy',
        bookingUrl,
      },
    ];
  }

  generateBookingLink(flight, searchParams) {
    const origin = (searchParams?.originAirport || 'AMD').toUpperCase();
    const dest = (searchParams?.destinationAirport || 'DXB').toUpperCase();
    // Ixigo's result URL expects DDMMYYYY, unlike the YYYYMMDD format used by our other adapter URLs.
    const dateStr = this.formatDate(searchParams?.departureDate).split('-').reverse().join('');
    const cabin = searchParams?.cabinClass === 'business' ? 'e' : 'e';
    return `https://www.ixigo.com/search/result/flight/${origin}/${dest}/${dateStr}/1/0/0/${cabin}`;
  }
}

module.exports = new IxigoProvider();
