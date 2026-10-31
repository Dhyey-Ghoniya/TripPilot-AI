import api from './api';

const affiliateLinksService = {
  getTourLinks: async (destination) => api.get('/affiliates/tours', { params: { destination } }),
  getTourRedirectUrl: (provider, destination) => {
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    return `${base}/affiliates/tours/redirect?provider=${encodeURIComponent(provider)}&destination=${encodeURIComponent(destination)}`;
  },
  getHotelRedirectUrl: (destination) => {
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    return `${base}/affiliates/hotels/redirect?destination=${encodeURIComponent(destination)}`;
  },
};

export default affiliateLinksService;
