import api from './api';

const photoCache = new Map();

const activityPhotoService = {
  async findPhoto({ activity, location = '', destination = '', tripId = '', activityKey = '' }) {
    const key = [tripId, activityKey, activity, location, destination].join('|').toLowerCase();
    if (photoCache.has(key)) return photoCache.get(key);

    const response = await api.get('/images/activity-photo', {
      params: { activity, location, destination, tripId },
    });
    const photo = response?.data?.photo || null;
    if (photo) photoCache.set(key, photo);
    return photo;
  },
};

export default activityPhotoService;
