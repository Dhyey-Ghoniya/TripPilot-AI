const G8TRIP_IMAGE_ROOT = 'https://apnobaatimages.blob.core.windows.net';

// Public destination images observed on G8Trip's homepage. Keep this list limited
// to destinations whose displayed names match the image filenames.
const G8TRIP_DESTINATION_PHOTOS = {
  phuket: `${G8TRIP_IMAGE_ROOT}/travel-places-images/phuket.webp`,
  'sri lanka': `${G8TRIP_IMAGE_ROOT}/travel-places-images/sri_lanka.webp`,
  vietnam: `${G8TRIP_IMAGE_ROOT}/travel-places-images/vietnam.webp`,
  barcelona: `${G8TRIP_IMAGE_ROOT}/apnibaatimages/barcelona.webp`,
  rome: `${G8TRIP_IMAGE_ROOT}/travel-places-images/rome.webp`,
  japan: `${G8TRIP_IMAGE_ROOT}/travel-places-images/japan.webp`,
};

export const getG8TripDestinationPhoto = (destination = '') => {
  const normalized = destination.trim().toLowerCase().replace(/\s+/g, ' ');
  return G8TRIP_DESTINATION_PHOTOS[normalized] || null;
};
