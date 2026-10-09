const BaseHotelProvider = require('./BaseHotelProvider');

class BookingProvider extends BaseHotelProvider {
  constructor() {
    super('Booking.com', 'BOOKING', 'https://cf.bstatic.com/static/img/tfl/group_logos/logo_booking/2786c6c650d637f284f6dee7d65370d07d67386b.png');
  }

  async searchHotels(searchParams) {
    const dest = (searchParams.destination || 'Dubai').trim();
    const destLower = dest.toLowerCase();
    
    // Seed real-style hotel catalog tailored to destination query
    const catalog = this._getHotelsCatalogForDestination(dest);

    return catalog.map((h, idx) => ({
      hotelId: `booking-${destLower.replace(/[^a-z0-9]/g, '')}-${idx + 1}`,
      name: `${h.namePrefix || ''} ${dest} ${h.nameSuffix}`,
      address: `${h.streetNumber || 101} ${h.area}, ${dest}`,
      neighborhood: h.area,
      coordinates: h.coordinates,
      starRating: h.starRating,
      userRating: h.userRating,
      reviewsCount: h.reviewsCount,
      pricePerNight: {
        amount: h.pricePerNight,
        currency: searchParams.currency || 'INR',
      },
      totalEstimate: h.pricePerNight * (searchParams.nights || 3),
      images: h.images,
      coverImage: h.images[0],
      amenities: h.amenities,
      accommodationType: h.type || 'Hotel',
      providerName: this.name,
      providerCode: this.code,
      providerLogo: this.logoUrl,
      distanceToCenterKm: h.distanceToCenterKm,
      vibeScore: h.vibeScore,
    }));
  }

  async getHotelDetails(hotelId) {
    return {
      hotelId,
      provider: this.name,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
      breakfastIncluded: true,
      parkingAvailable: true,
    };
  }

  generateBookingLink(hotel, searchParams) {
    const dest = encodeURIComponent(searchParams.destination || hotel.neighborhood || 'Dubai');
    const checkIn = this.formatDate(searchParams.checkIn);
    const checkOut = this.formatDate(searchParams.checkOut);
    const guests = searchParams.guests?.adults || searchParams.guests || 2;
    return `https://www.booking.com/searchresults.html?ss=${dest}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}&no_rooms=${searchParams.rooms || 1}`;
  }

  _getHotelsCatalogForDestination(dest) {
    return [
      {
        namePrefix: 'Grand',
        nameSuffix: 'Palace & Spa',
        area: 'Downtown',
        coordinates: { lat: 25.1972, lng: 55.2744 },
        starRating: 5,
        userRating: 4.8,
        reviewsCount: 1420,
        pricePerNight: 18500,
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'],
        amenities: ['wifi', 'pool', 'spa', 'breakfast', 'fitness', 'fine_dining'],
        type: 'Hotel',
        distanceToCenterKm: 0.5,
        vibeScore: 96,
      },
      {
        namePrefix: 'The Riviera',
        nameSuffix: 'Boutique Suites',
        area: 'Marina & Beachfront',
        coordinates: { lat: 25.0772, lng: 55.1332 },
        starRating: 4,
        userRating: 4.6,
        reviewsCount: 890,
        pricePerNight: 12400,
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'],
        amenities: ['wifi', 'pool', 'beach_access', 'breakfast', 'sea_view'],
        type: 'Boutique',
        distanceToCenterKm: 2.1,
        vibeScore: 92,
      },
    ];
  }
}

module.exports = new BookingProvider();
