const aiSessionService = require('./aiSession.service');
const aiExtractor = require('./aiExtractor.service');
const destinationResolver = require('./destinationResolver.service');
const travelOrchestrator = require('./travelOrchestrator.service');
const aiTools = require('./aiTools.service');
const financeService = require('./finance.service');
const mapService = require('./map.service');
const weatherService = require('./weather.service');

/**
 * Core Agent that unifies all TripPilot conversational intelligence.
 * Implements the architecture specified in Phase 3 & 4.
 */
class TripPilotAgent {
  constructor() {
    this.intentEngine = aiExtractor;
    this.conversationManager = aiSessionService;
    this.destinationResolver = destinationResolver;
    
    // Tools
    this.flightTool = aiTools.searchFlights;
    this.hotelTool = aiTools.searchHotels;
    this.activityTool = aiTools.searchActivities;
    this.mapsTool = mapService;
    this.weatherTool = weatherService;
    this.budgetOptimizer = financeService;
    
    // Engines
    this.itineraryEngine = aiTools.createItinerary;
    this.tripPlanner = travelOrchestrator;
  }

  /**
   * Main entry point for conversational interaction.
   * Processes natural language, maintains memory, and manipulates the Trip object.
   */
  async processInteraction(sessionId, messageText, userId = null) {
    console.log(`[TripPilotAgent] Processing input for session ${sessionId}: "${messageText}"`);
    
    // Defer to conversation manager which orchestrates the context and intent resolution
    const response = await this.conversationManager.handleUserMessage(sessionId, messageText, userId);
    
    return response;
  }
}

module.exports = new TripPilotAgent();
