import api from './api';

export const aiService = {
  /**
   * Start or get an AI planning session
   */
  async createOrGetSession(sessionId = null) {
    return await api.post('/ai/session', { sessionId });
  },

  /**
   * Send natural language prompt to AI copilot session
   */
  async sendMessage(sessionId, message) {
    return await api.post(`/ai/session/${sessionId}/message`, { message });
  },

  /**
   * Synthesize trip directly
   */
  async planTrip(payload) {
    return await api.post('/travel/plan', payload);
  },
};

export default aiService;
