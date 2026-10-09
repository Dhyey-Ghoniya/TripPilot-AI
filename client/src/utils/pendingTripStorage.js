/**
 * Pending Trip Session Storage Utility
 * Preserves unauthenticated chatbot context, extracted requirements, and active trips
 * across user authentication (login & registration).
 */

const STORAGE_KEY = 'trippilot_pending_session';

export const savePendingTripSession = (sessionData) => {
  try {
    if (!sessionData) return;
    const payload = {
      ...sessionData,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[PendingTripStorage] Save error:', err.message);
  }
};

export const getPendingTripSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    
    // Expire pending session if older than 24 hours
    if (Date.now() - (data.timestamp || 0) > 24 * 60 * 60 * 1000) {
      clearPendingTripSession();
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[PendingTripStorage] Get error:', err.message);
    return null;
  }
};

export const clearPendingTripSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[PendingTripStorage] Clear error:', err.message);
  }
};
