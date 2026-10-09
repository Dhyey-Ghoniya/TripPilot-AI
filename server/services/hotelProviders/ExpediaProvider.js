const BaseHotelProvider = require('./BaseHotelProvider');

class ExpediaProvider extends BaseHotelProvider {
  constructor() {
    super('Expedia', 'EXPEDIA', 'https://www.expedia.com/_dls/gda/assets/branding/expedia-logo-yellow.svg');
  }

  async searchHotels(searchParams) {
    const dest = (searchParams.destination || 'Dubai').trim();
    const destLower = dest.toLowerCase();

    return [
      {
        hotelId: `expedia-${destLower.replace(/[^a-z0-9]/g, '')}-1`,
        name: `Expedia VIP ${dest} Grand Harbor Resort`,
        address: `Marina Promenade, ${dest}`,
        neighborhood: 'Marina & Bay',
        coordinates: { lat: 25.081, lng: 55.141 },
        starRating: 5,
        userRating: 4.7,
        reviewsCount: 1840,
        pricePerNight: {
          amount: 17500,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 17500 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'pool', 'marina_view', 'spa', 'breakfast', 'beach_access'],
        accommodationType: 'Resort',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 2.4,
        vibeScore: 93,
      },
      {
        hotelId: `expedia-${destLower.replace(/[^a-z0-9]/g, '')}-2`,
        name: `${dest} Oasis Serviced Apartments`,
        address: `Palm Grove Plaza, ${dest}`,
        neighborhood: 'Suburban Palms',
        coordinates: { lat: 25.112, lng: 55.201 },
        starRating: 4,
        userRating: 4.4,
        reviewsCount: 510,
        pricePerNight: {
          amount: 8500,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 8500 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'kitchen', 'washing_machine', 'parking', 'family_friendly'],
        accommodationType: 'Apartment',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 3.2,
        vibeScore: 87,
      },
    ];
  }

  async getHotelDetails(hotelId) {
    return {
      hotelId,
      provider: this.name,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'Free cancellation options available',
      breakfastIncluded: false,
    };
  }

  generateBookingLink(hotel, searchParams) {
    const dest = encodeURIComponent(searchParams.destination || 'Dubai');
    const checkIn = this.formatDate(searchParams.checkIn);
    const checkOut = this.formatDate(searchParams.checkOut);
    const guests = searchParams.guests?.adults || searchParams.guests || 2;
    return `https://www.expedia.com/Hotel-Search?destination=${dest}&startDate=${checkIn}&endDate=${checkOut}&rooms=${searchParams.rooms || 1}&adults=${guests}`;
  }
}

module.exports = new ExpediaProvider();
