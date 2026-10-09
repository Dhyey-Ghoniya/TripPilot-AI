const BaseHotelProvider = require('./BaseHotelProvider');

class AgodaProvider extends BaseHotelProvider {
  constructor() {
    super('Agoda', 'AGODA', 'https://cdn6.agoda.net/images/HEADER-64547/default/agoda-logo-flat-2019.png');
  }

  async searchHotels(searchParams) {
    const dest = (searchParams.destination || 'Dubai').trim();
    const destLower = dest.toLowerCase();

    return [
      {
        hotelId: `agoda-${destLower.replace(/[^a-z0-9]/g, '')}-1`,
        name: `Agoda Exclusive ${dest} Bay Resort`,
        address: `Beachfront Boulevard, ${dest}`,
        neighborhood: 'Coastal Bay',
        coordinates: { lat: 25.138, lng: 55.188 },
        starRating: 5,
        userRating: 4.7,
        reviewsCount: 2150,
        pricePerNight: {
          amount: 15800,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 15800 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'pool', 'spa', 'breakfast', 'free_cancellation', 'shuttle'],
        accommodationType: 'Resort',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 1.8,
        vibeScore: 94,
      },
      {
        hotelId: `agoda-${destLower.replace(/[^a-z0-9]/g, '')}-2`,
        name: `Urban Smart Stays ${dest}`,
        address: `Central Avenue, ${dest}`,
        neighborhood: 'Business District',
        coordinates: { lat: 25.204, lng: 55.27 },
        starRating: 3,
        userRating: 4.3,
        reviewsCount: 640,
        pricePerNight: {
          amount: 6900,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 6900 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'breakfast', 'fitness', 'work_desk'],
        accommodationType: 'Hotel',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 0.8,
        vibeScore: 88,
      },
    ];
  }

  async getHotelDetails(hotelId) {
    return {
      hotelId,
      provider: this.name,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Non-refundable discount deal',
      breakfastIncluded: true,
    };
  }

  generateBookingLink(hotel, searchParams) {
    const dest = encodeURIComponent(searchParams.destination || 'Dubai');
    const checkIn = this.formatDate(searchParams.checkIn);
    const checkOut = this.formatDate(searchParams.checkOut);
    const guests = searchParams.guests?.adults || searchParams.guests || 2;
    return `https://www.agoda.com/search?text=${dest}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${searchParams.rooms || 1}&adults=${guests}`;
  }
}

module.exports = new AgodaProvider();
