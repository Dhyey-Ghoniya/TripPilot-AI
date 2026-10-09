const BaseHotelProvider = require('./BaseHotelProvider');

class HotelsComProvider extends BaseHotelProvider {
  constructor() {
    super('Hotels.com', 'HOTELSCOM', 'https://www.hotels.com/_dls/gda/assets/branding/hotels-logo.svg');
  }

  async searchHotels(searchParams) {
    const dest = (searchParams.destination || 'Dubai').trim();
    const destLower = dest.toLowerCase();

    return [
      {
        hotelId: `hotelscom-${destLower.replace(/[^a-z0-9]/g, '')}-1`,
        name: `Hotels.com Preferred ${dest} Heights Hotel`,
        address: `Financial Avenue, ${dest}`,
        neighborhood: 'Downtown Core',
        coordinates: { lat: 25.199, lng: 55.275 },
        starRating: 4,
        userRating: 4.6,
        reviewsCount: 1680,
        pricePerNight: {
          amount: 13900,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 13900 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'pool', 'breakfast', 'city_view', 'fitness'],
        accommodationType: 'Hotel',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 0.6,
        vibeScore: 94,
      },
    ];
  }

  async getHotelDetails(hotelId) {
    return {
      hotelId,
      provider: this.name,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Earn 1 stamp per night reward',
      breakfastIncluded: true,
    };
  }

  generateBookingLink(hotel, searchParams) {
    const dest = encodeURIComponent(searchParams.destination || 'Dubai');
    const checkIn = this.formatDate(searchParams.checkIn);
    const checkOut = this.formatDate(searchParams.checkOut);
    const guests = searchParams.guests?.adults || searchParams.guests || 2;
    return `https://www.hotels.com/Hotel-Search?destination=${dest}&startDate=${checkIn}&endDate=${checkOut}&rooms=${searchParams.rooms || 1}&adults=${guests}`;
  }
}

module.exports = new HotelsComProvider();
