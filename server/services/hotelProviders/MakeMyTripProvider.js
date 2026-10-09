const BaseHotelProvider = require('./BaseHotelProvider');

class MakeMyTripProvider extends BaseHotelProvider {
  constructor() {
    super('MakeMyTrip', 'MMT', 'https://imgak.mmtcdn.com/pwa_v3/pwa_commons_ui/header/mmtHeaderLogo.png');
  }

  async searchHotels(searchParams) {
    const dest = (searchParams.destination || 'Dubai').trim();
    const destLower = dest.toLowerCase();

    return [
      {
        hotelId: `mmt-${destLower.replace(/[^a-z0-9]/g, '')}-1`,
        name: `MMT Assured ${dest} Heritage Villa`,
        address: `Old Town Cultural Zone, ${dest}`,
        neighborhood: 'Historic District',
        coordinates: { lat: 25.263, lng: 55.297 },
        starRating: 4,
        userRating: 4.5,
        reviewsCount: 1120,
        pricePerNight: {
          amount: 9800,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 9800 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'pool', 'breakfast', 'heritage_tours', 'airport_transfer'],
        accommodationType: 'Villa',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 1.2,
        vibeScore: 91,
      },
      {
        hotelId: `mmt-${destLower.replace(/[^a-z0-9]/g, '')}-2`,
        name: `${dest} Signature Park Hotel`,
        address: `Park View Avenue, ${dest}`,
        neighborhood: 'City Gardens',
        coordinates: { lat: 25.215, lng: 55.281 },
        starRating: 4,
        userRating: 4.4,
        reviewsCount: 940,
        pricePerNight: {
          amount: 11200,
          currency: searchParams.currency || 'INR',
        },
        totalEstimate: 11200 * (searchParams.nights || 3),
        images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80'],
        coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80',
        amenities: ['wifi', 'pool', 'fitness', 'breakfast'],
        accommodationType: 'Hotel',
        providerName: this.name,
        providerCode: this.code,
        providerLogo: this.logoUrl,
        distanceToCenterKm: 1.0,
        vibeScore: 90,
      },
    ];
  }

  async getHotelDetails(hotelId) {
    return {
      hotelId,
      provider: this.name,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: 'Free cancellation up to 48 hours prior',
      breakfastIncluded: true,
    };
  }

  generateBookingLink(hotel, searchParams) {
    const dest = encodeURIComponent(searchParams.destination || 'Dubai');
    const checkIn = this.formatDate(searchParams.checkIn);
    const checkOut = this.formatDate(searchParams.checkOut);
    const guests = searchParams.guests?.adults || searchParams.guests || 2;
    return `https://www.makemytrip.com/hotels/hotel-listing/?city=${dest}&checkin=${checkIn}&checkout=${checkOut}&roomStay=${guests}`;
  }
}

module.exports = new MakeMyTripProvider();
