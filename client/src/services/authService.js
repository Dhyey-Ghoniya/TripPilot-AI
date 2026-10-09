import api from './api';

export const authService = {
  async register(data) {
    return await api.post('/auth/register', data);
  },

  async login(credentials) {
    return await api.post('/auth/login', credentials);
  },

  async logout() {
    return await api.post('/auth/logout');
  },

  async getCurrentUser() {
    return await api.get('/auth/me');
  },

  async updateProfile(profileData) {
    return await api.put('/auth/profile', profileData);
  },

  async changePassword(passwordData) {
    return await api.put('/auth/change-password', passwordData);
  },
};

export default authService;
