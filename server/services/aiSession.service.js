const AiSession = require('../models/AiSession');
const travelOrchestrator = require('./travelOrchestrator.service');
const { v4: uuidv4 } = require('crypto');

class AiSessionService {
  /**
   * Create or retrieve an AI travel copilot session.
   */
  async createOrGetSession(userId = null, customSessionId = null) {
    let session = null;

    if (customSessionId) {
      session = await AiSession.findOne({ sessionId: customSessionId });
    }

    if (!session) {
      const sessionId = customSessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      session = new AiSession({
        userId: userId || null,
        sessionId,
        messages: [
          {
            sender: 'assistant',
            content: 'Hello! I am your TripPilot AI Travel Copilot. Where would you like to travel, and for how many days?',
            timestamp: new Date(),
          },
        ],
        extractedParams: {},
        missingFields: ['destination', 'duration'],
        status: 'active',
      });
      await session.save();
    }

    return session;
  }

  /**
   * Send a user message to an active AI planning session.
   * Evaluates prompt, updates conversation, and generates trip if complete.
   */
  async handleUserMessage(sessionId, messageText, userId = null) {
    let session = await AiSession.findOne({ sessionId });
    if (!session) {
      session = await this.createOrGetSession(userId, sessionId);
    }

    // Add user message to session transcript
    session.messages.push({
      sender: 'user',
      content: messageText,
      timestamp: new Date(),
    });

    // Determine effective active trip ID
    const effectiveTripId = session.tripId || (sessionId && String(sessionId).length === 24 ? sessionId : null);

    // Run TravelOrchestrator with accumulated session params & active trip ID
    const orchestratorResult = await travelOrchestrator.orchestrateTripPlanning({
      prompt: messageText,
      userId: userId || session.userId,
      tripId: effectiveTripId,
      sessionParams: session.extractedParams || {},
      forceSynthesis: false,
    });

    // Update session state
    session.extractedParams = orchestratorResult.extractedParams;
    session.missingFields = orchestratorResult.missingFields || [];

    if (orchestratorResult.status === 'completed' && orchestratorResult.trip) {
      session.status = 'completed';
      session.tripId = orchestratorResult.trip._id;
    }

    // Add AI copilot response message
    session.messages.push({
      sender: 'assistant',
      content: orchestratorResult.copilotMessage,
      timestamp: new Date(),
      metadata: {
        destinationContext: orchestratorResult.destinationContext,
        trip: orchestratorResult.trip,
        itinerary: orchestratorResult.itinerary,
        structuredData: orchestratorResult.structuredData,
        isComplete: orchestratorResult.isComplete,
      },
    });

    await session.save();

    return {
      session,
      orchestratorResult,
    };
  }
}

module.exports = new AiSessionService();
