const TripPilotAgent = require('../services/TripPilotAgent');
const ApiResponse = require('../utils/apiResponse');

class AiController {
  /**
   * POST /api/ai/session
   * Start or retrieve an AI travel copilot planning session.
   */
  async createOrGetSession(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const sessionId = req.body.sessionId || null;
      const session = await TripPilotAgent.conversationManager.createOrGetSession(userId, sessionId);
      return ApiResponse.success(res, { session }, 'AI planning session initialized');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/session/:id/message
   * Send natural language prompt to AI travel copilot session.
   */
  async handleMessage(req, res, next) {
    try {
      const sessionId = req.params.id;
      const { message } = req.body;
      const userId = req.user ? req.user._id : null;

      if (!message || !message.trim()) {
        return ApiResponse.error(res, 'Message text is required', 400);
      }

      const { session, orchestratorResult } = await TripPilotAgent.processInteraction(
        sessionId,
        message,
        userId
      );

      return ApiResponse.success(
        res,
        {
          session,
          result: orchestratorResult,
        },
        'Message processed by AI copilot'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/travel/plan
   * Directly synthesize a trip plan from natural language prompt or parameters.
   */
  async planTrip(req, res, next) {
    try {
      const { prompt, destination, origin, durationDays, budget, forceSynthesis } = req.body;
      const userId = req.user ? req.user._id : null;

      const inputPrompt =
        prompt ||
        `Plan a ${durationDays || 5}-day trip to ${destination || 'Dubai'} from ${
          origin || 'Ahmedabad'
        }${budget ? ` under ${budget}` : ''}`;

      const result = await TripPilotAgent.tripPlanner.orchestrateTripPlanning({
        prompt: inputPrompt,
        userId,
        forceSynthesis: forceSynthesis || false,
      });

      return ApiResponse.success(res, result, 'Trip blueprint generated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AiController();
