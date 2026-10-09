import api from './api';

const adminService = {
  // 1. Dashboard Stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // 2. Provider Status
  getProviderStatus: async () => {
    const response = await api.get('/admin/providers');
    return response.data;
  },

  // 3. User Management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/status`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // 4. Travel Collections
  getCollections: async () => {
    const response = await api.get('/admin/collections');
    return response.data;
  },

  createCollection: async (payload) => {
    const response = await api.post('/admin/collections', payload);
    return response.data;
  },

  updateCollection: async (id, payload) => {
    const response = await api.put(`/admin/collections/${id}`, payload);
    return response.data;
  },

  deleteCollection: async (id) => {
    const response = await api.delete(`/admin/collections/${id}`);
    return response.data;
  },

  // 5. Reported Content
  getReports: async (params = {}) => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },

  submitReport: async (payload) => {
    const response = await api.post('/admin/reports/submit', payload);
    return response.data;
  },

  updateReportStatus: async (id, payload) => {
    const response = await api.patch(`/admin/reports/${id}`, payload);
    return response.data;
  },

  // 6. System Configuration
  getSystemConfig: async () => {
    const response = await api.get('/admin/config');
    return response.data;
  },

  updateSystemConfig: async (payload) => {
    const response = await api.put('/admin/config', payload);
    return response.data;
  },
};

export default adminService;
