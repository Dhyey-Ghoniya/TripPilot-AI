const BaseFlightProvider = require('./BaseFlightProvider');

class MakeMyTripProvider extends BaseFlightProvider {
  constructor() {
    super('MakeMyTrip', 'MMT', 'https://imgak.mmtcdn.com/pwa_v3/pwa_commons_assets/desktop/logo.png');
  }

  async searchFlights(searchParams) {
    const { originAirport = 'AMD', destinationAirport = 'DXB', departureDate } = searchParams;
    const dateStr = this.formatDate(departureDate);
    const bookingUrl = this.generateBookingLink(null, searchParams);

    const isDomestic = originAirport === 'AMD' && (destinationAirport === 'GOI' || destinationAirport === 'DEL' || destinationAirport === 'BOM');
    const basePrice = isDomestic ? 5150 : 22100;

    return [
      {
        flightId: `MMT-${originAirport}-${destinationAirport}-202`,
        provider: this.name,
        providerCode: this.code,
        airline: isDomestic ? 'Air India' : 'Air India',
        airlineCode: 'AI',
        flightNumber: isDomestic ? 'AI-614' : 'AI-995',
        departureAirport: originAirport,
        arrivalAirport: destinationAirport,
        departureTime: `${dateStr}T14:30:00.000Z`,
        arrivalTime: `${dateStr}T18:00:00.000Z`,
        durationMinutes: isDomestic ? 110 : 210,
        stopsCount: 0,
        price: { amount: basePrice, currency: 'INR' },
        cabinClass: searchParams.cabinClass || 'economy',
        seatsRemaining: 5,
        bookingUrl,
      },
    ];
  }

  generateBookingLink(flight, searchParams) {
    const origin = (searchParams?.originAirport || 'AMD').toUpperCase();
    const dest = (searchParams?.destinationAirport || 'DXB').toUpperCase();
    const d = new Date(searchParams?.departureDate || Date.now());
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    return `https://www.makemytrip.com/flight/search?itinerary=${origin}-${dest}-${dateFormatted}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=E`;
  }
}

module.exports = new MakeMyTripProvider();
