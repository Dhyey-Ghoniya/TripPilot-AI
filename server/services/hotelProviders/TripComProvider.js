const BaseHotelProvider = require('./BaseHotelProvider');

class TripComProvider extends BaseHotelProvider {
  constructor() {
    super('Trip.com', 'TRIPCOM', 'https://ak-s.tripcdn.com/bnd/res/trip/head_logo_normal.png');
  }

  async searchHotels(searchParams) {
    const dest = (searchParams.destination || 'Dubai').trim();
    const destLower = dest.toLowerCase();

    return [
      {
        hotelId: `tripcom-${destLower.replace(/[^a-z0-9]/g, '')}-1`,
        name: `Trip.com Select ${dest} Skytower Hotel`,
        address: `Financial Center Road, ${dest}`,
        neighborhood: 'Business Hub',
        coordinates: { lat: 25.202, lng: 55.277 },
        starRating: 5,
        userRating: 4.8,
        reviewsCount: 3100,
        pricePerNight: {
          amount: 19200,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 19200 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'rooftop_pool', 'spa', 'breakfast', 'concierge'],
        accommodationType: 'Hotel',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 0.3,
        vibeScore: 97,
      },
    ];
  }

  async getHotelDetails(hotelId) {
    return {
      hotelId,
      provider: this.name,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24h before arrival',
      breakfastIncluded: true,
    };
  }

  generateBookingLink(hotel, searchParams) {
    const dest = encodeURIComponent(searchParams.destination || 'Dubai');
    const checkIn = this.formatDate(searchParams.checkIn);
    const checkOut = this.formatDate(searchParams.checkOut);
    const guests = searchParams.guests?.adults || searchParams.guests || 2;
    return `https://www.trip.com/hotels/list?city=${dest}&checkin=${checkIn}&checkout=${checkOut}&crn=${searchParams.rooms || 1}&adult=${guests}`;
  }
}

module.exports = new TripComProvider();
