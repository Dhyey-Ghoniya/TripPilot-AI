import api from './api';

export const destinationService = {
  async getDestinations(params = {}) {
    return await api.get('/destinations', { params });
  },

  async getFeaturedDestinations(limit = 6) {
    return await api.get('/destinations', { params: { featured: 'true', limit } });
  },

  async getDestinationBySlug(slug) {
    return await api.get(`/destinations/slug/${slug}`);
  },

  async getDestinationById(id) {
    return await api.get(`/destinations/${id}`);
  },

  async createDestination(data) {
    return await api.post('/destinations', data);
  },

  async updateDestination(id, data) {
    return await api.put(`/destinations/${id}`, data);
  },

  async deleteDestination(id) {
    return await api.delete(`/destinations/${id}`);
  },

  async toggleStatus(id, isActive) {
    return await api.patch(`/destinations/${id}/status`, { isActive });
  },

  async toggleFeatured(id, isFeatured) {
    return await api.patch(`/destinations/${id}/featured`, { isFeatured });
  },
};

export default destinationService;
