const AiSession = require('../models/AiSession');
const travelOrchestrator = require('./travelOrchestrator.service');
const aiExtractor = require('./aiExtractor.service');

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
            content: 'Hi! Where would you like to travel?',
            timestamp: new Date(),
          },
        ],
        extractedParams: {},
        draftRequirements: {},
        lastAskedField: 'destination',
        missingFields: ['destination', 'origin', 'duration', 'dates', 'budget'],
        status: 'active',
      });
      await session.save();
    }

    return session;
  }

  /**
   * Send a user message to an active AI planning session.
   * Evaluates prompt, updates conversational draft requirements, and generates trip when ready.
   */
  async handleUserMessage(sessionId, messageText, userId = null) {
    let session = await AiSession.findOne({ sessionId });
    if (!session) {
      session = await this.createOrGetSession(userId, sessionId);
    }

    // Append user message to transcript
    session.messages.push({
      sender: 'user',
      content: messageText,
      timestamp: new Date(),
    });

    const effectiveTripId = session.tripId || (sessionId && String(sessionId).length === 24 ? sessionId : null);

    // Merge previous session params & draft requirements
    const accumulatedParams = {
      ...(session.draftRequirements || {}),
      ...(session.extractedParams || {}),
    };

    // Extract parameters & intent using Module 2 context awareness
    const extraction = aiExtractor.extractParameters(
      messageText,
      accumulatedParams,
      session.lastAskedField
    );

    // ─────────────────────────────────────────────────────────────────
    // 1. HANDLE START OVER
    // ─────────────────────────────────────────────────────────────────
    if (extraction.intent === 'START_OVER') {
      session.draftRequirements = {};
      session.extractedParams = {};
      session.lastAskedField = 'destination';
      session.missingFields = ['destination', 'origin', 'duration', 'dates', 'budget'];
      session.status = 'active';
      session.tripId = null;

      session.messages.push({
        sender: 'assistant',
        content: extraction.copilotMessage,
        timestamp: new Date(),
      });
      await session.save();

      return {
        session,
        orchestratorResult: {
          status: 'reset',
          isComplete: false,
          action: 'START_OVER',
          copilotMessage: extraction.copilotMessage,
          draftRequirements: {},
        },
      };
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. HANDLE EXISTING CREATED TRIP COMMANDS (Module 1 features)
    // ─────────────────────────────────────────────────────────────────
    const lowerMsg = (messageText || '').toLowerCase();
    const isExistingTripCmd =
      effectiveTripId &&
      (lowerMsg.includes('cheaper') ||
        lowerMsg.includes('add ') ||
        lowerMsg.includes('remove') ||
        lowerMsg.includes('hotel') ||
        lowerMsg.includes('restaurant') ||
        lowerMsg.includes('flight') ||
        lowerMsg.includes('checklist') ||
        lowerMsg.includes('visa') ||
        lowerMsg.includes('pack') ||
        lowerMsg.includes('road trip'));

    if (isExistingTripCmd) {
      const orchestratorResult = await travelOrchestrator.orchestrateTripPlanning({
        prompt: messageText,
        userId: userId || session.userId,
        tripId: effectiveTripId,
        sessionParams: accumulatedParams,
        forceSynthesis: false,
      });

      session.messages.push({
        sender: 'assistant',
        content: orchestratorResult.copilotMessage,
        timestamp: new Date(),
        metadata: {
          trip: orchestratorResult.trip,
          itinerary: orchestratorResult.itinerary,
          structuredData: orchestratorResult.structuredData,
          isComplete: orchestratorResult.isComplete,
        },
      });
      await session.save();

      return { session, orchestratorResult };
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. MULTI-TURN REQUIREMENT COLLECTION & TRIP GENERATION
    // ─────────────────────────────────────────────────────────────────
    // Update stored draft requirements
    session.draftRequirements = extraction.params;
    session.extractedParams = extraction.params;
    session.missingFields = extraction.missingFields;
    session.lastAskedField = extraction.lastAskedField;

    let orchestratorResult = null;

    if (extraction.isReadyToPlan) {
      // Create trip blueprint when requirements are sufficient or user requested proceed
      orchestratorResult = await travelOrchestrator.orchestrateTripPlanning({
        prompt: messageText,
        userId: userId || session.userId,
        tripId: null,
        sessionParams: extraction.params,
        forceSynthesis: true,
      });

      if (orchestratorResult.status === 'completed' && orchestratorResult.trip) {
        session.status = 'completed';
        session.tripId = orchestratorResult.trip._id;
      }

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
    } else {
      // Ask next conversational follow-up question
      orchestratorResult = {
        status: 'collecting_requirements',
        isComplete: false,
        action: 'ASK_FOLLOW_UP',
        copilotMessage: extraction.copilotMessage,
        draftRequirements: extraction.params,
        missingFields: extraction.missingFields,
        lastAskedField: extraction.lastAskedField,
      };

      session.messages.push({
        sender: 'assistant',
        content: extraction.copilotMessage,
        timestamp: new Date(),
        metadata: {
          draftRequirements: extraction.params,
          missingFields: extraction.missingFields,
          isComplete: false,
        },
      });
    }

    await session.save();

    return {
      session,
      orchestratorResult,
    };
  }
}

module.exports = new AiSessionService();
