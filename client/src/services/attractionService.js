import api from './api';

export const attractionService = {
  getAttractions: async (params = {}) => {
    const response = await api.get('/attractions', { params });
    return response.data;
  },

  getAttractionBySlug: async (slug) => {
    const response = await api.get(`/attractions/slug/${slug}`);
    return response.data;
  },

  getAttractionById: async (id) => {
    const response = await api.get(`/attractions/${id}`);
    return response.data;
  },

  getAttractionsByDestination: async (destinationId, params = {}) => {
    const response = await api.get(`/destinations/${destinationId}/attractions`, { params });
    return response.data;
  },

  getNearbyAttractions: async (latitude, longitude, radius = 25) => {
    const response = await api.get('/attractions/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },

  createAttraction: async (attractionData) => {
    const response = await api.post('/attractions', attractionData);
    return response.data;
  },

  updateAttraction: async (id, attractionData) => {
    const response = await api.put(`/attractions/${id}`, attractionData);
    return response.data;
  },

  deleteAttraction: async (id) => {
    const response = await api.delete(`/attractions/${id}`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`/attractions/${id}/status`);
    return response.data;
  },

  toggleFeatured: async (id) => {
    const response = await api.patch(`/attractions/${id}/featured`);
    return response.data;
  },
};

export default attractionService;
