import api from './api';

export const wishlistService = {
  async getWishlist() {
    return await api.get('/users/wishlist');
  },

  async addToWishlist(destinationId) {
    return await api.post(`/users/wishlist/${destinationId}`);
  },

  async removeFromWishlist(destinationId) {
    return await api.delete(`/users/wishlist/${destinationId}`);
  },

  async checkWishlistStatus(destinationId) {
    return await api.get(`/users/wishlist/status/${destinationId}`);
  },
};

export default wishlistService;
