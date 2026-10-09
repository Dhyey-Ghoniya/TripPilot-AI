const BaseFlightProvider = require('./BaseFlightProvider');

class CleartripProvider extends BaseFlightProvider {
  constructor() {
    super('Cleartrip', 'CLEARTRIP', 'https://fastly.static.ctcdn.in/images/cleartrip-logo.png');
  }

  async searchFlights(searchParams) {
    const { originAirport = 'AMD', destinationAirport = 'DXB', departureDate } = searchParams;
    const dateStr = this.formatDate(departureDate);
    const bookingUrl = this.generateBookingLink(null, searchParams);

    const isDomestic = originAirport === 'AMD' && (destinationAirport === 'GOI' || destinationAirport === 'DEL' || destinationAirport === 'BOM');
    const basePrice = isDomestic ? 5300 : 21950;

    return [
      {
        flightId: `CTR-${originAirport}-${destinationAirport}-303`,
        provider: this.name,
        providerCode: this.code,
        airline: isDomestic ? 'Vistara' : 'Flydubai',
        airlineCode: isDomestic ? 'UK' : 'FZ',
        flightNumber: isDomestic ? 'UK-812' : 'FZ-438',
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: `${dateStr}T19:45:00.000Z`,
        arrivalTime: `${dateStr}T23:15:00.000Z`,
        durationMinutes: isDomestic ? 115 : 210,
        stopsCount: 0,
        price: { amount: basePrice, currency: 'INR' },
        cabinClass: searchParams.cabinClass || 'economy',
        seatsRemaining: 9,
        bookingUrl,
      },
    ];
  }

  generateBookingLink(flight, searchParams) {
    const origin = (searchParams?.originAirport || 'AMD').toUpperCase();
    const dest = (searchParams?.destinationAirport || 'DXB').toUpperCase();
    const d = new Date(searchParams?.departureDate || Date.now());
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `https://www.cleartrip.com/flights/results?from=${origin}&to=${dest}&depart_date=${dateFormatted}&adults=1`;
  }
}

module.exports = new CleartripProvider();
