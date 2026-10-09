/**
 * Natural Language Parser & Extractor for travel prompts.
 * Dynamically extracts destination, origin, duration, travelers, budget, interests, and constraints.
 * ZERO hardcoded destination list dependencies.
 */

class AiExtractorService {
  /**
   * Extract parameters from a natural language prompt string.
   * @param {string} promptText - User query, e.g., "Plan a 5-day trip to Tokyo from Ahmedabad for 2 people."
   * @param {object} [currentSessionParams] - Accumulated parameters from previous chat turns
   * @returns {object} Extracted parameters, missing fields, and AI response suggestion
   */
  extractParameters(promptText, currentSessionParams = {}) {
    const text = (promptText || '').trim();
    const lowerText = text.toLowerCase();

    // Start with existing session state or defaults
    const params = {
      destination: currentSessionParams.destination || '',
      origin: currentSessionParams.origin || '',
      durationDays: currentSessionParams.durationDays || null,
      travelersCount: currentSessionParams.travelersCount || null,
      travelersType: currentSessionParams.travelersType || 'couple',
      budget: currentSessionParams.budget || null,
      currency: currentSessionParams.currency || 'INR',
      budgetRange: currentSessionParams.budgetRange || 'Moderate',
      travelStyle: currentSessionParams.travelStyle || 'balanced',
      interests: currentSessionParams.interests || [],
      preferredTransport: currentSessionParams.preferredTransport || [],
      accommodationPreference: currentSessionParams.accommodationPreference || [],
    };

    // ─────────────────────────────────────────────────────────────────
    // 1. EXTRACT DURATION (e.g. "5 days", "5-day", "1 week", "7 days", "10-day")
    // ─────────────────────────────────────────────────────────────────
    const dayMatch = text.match(/(\d+)\s*(-|\s*)day/i) || text.match(/(\d+)\s*days/i);
    if (dayMatch) {
      params.durationDays = parseInt(dayMatch[1], 10);
    } else if (lowerText.includes('weekend')) {
      params.durationDays = 3;
    } else if (lowerText.includes('a week') || lowerText.includes('1 week')) {
      params.durationDays = 7;
    } else if (lowerText.includes('2 weeks') || lowerText.includes('fortnight')) {
      params.durationDays = 14;
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. EXTRACT TRAVELERS COUNT & TYPE
    // ─────────────────────────────────────────────────────────────────
    const travelerMatch =
      text.match(/for\s*(\d+)\s*(people|person|travelers|pax|adults)?/i) ||
      text.match(/(\d+)\s*(people|person|travelers|pax|adults)/i);
    if (travelerMatch) {
      params.travelersCount = parseInt(travelerMatch[1], 10);
      if (params.travelersCount === 1) params.travelersType = 'solo';
      else if (params.travelersCount === 2) params.travelersType = 'couple';
      else if (params.travelersCount > 2) params.travelersType = 'friends';
    } else if (lowerText.includes('solo') || lowerText.includes('myself')) {
      params.travelersCount = 1;
      params.travelersType = 'solo';
    } else if (lowerText.includes('family')) {
      params.travelersCount = params.travelersCount || 4;
      params.travelersType = 'family';
    } else if (lowerText.includes('couple') || lowerText.includes('honeymoon')) {
      params.travelersCount = 2;
      params.travelersType = 'couple';
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. EXTRACT ORIGIN (e.g. "from Ahmedabad", "from Mumbai", "from Delhi", "from AMD")
    // ─────────────────────────────────────────────────────────────────
    const originMatch = text.match(/from\s+([A-Za-z\s]+?)(?=\s+to|\s+for|\s+under|\s+with|\s+in|\.|$)/i);
    if (originMatch) {
      params.origin = originMatch[1].trim();
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. DYNAMIC DESTINATION EXTRACTION (Zero hardcoded names list)
    // ─────────────────────────────────────────────────────────────────
    let extractedDest = '';

    // Pattern A: "Road trip from [Origin] to [Destination]"
    const roadTripMatch = text.match(/road\s+trip\s+from\s+[A-Za-z\s]+\s+to\s+([A-Za-z\s]+?)(?=\s+for|\s+under|\s+with|\.|$)/i);
    // Pattern B: "Plan a trip to [Destination]" / "Plan a [N]-day trip to [Destination]" / "Plan a honeymoon in [Destination]"
    const planTripToMatch = text.match(/(?:plan|create|build|make)\s+(?:a\s+)?(?:\d+-day\s+)?(?:trip|honeymoon|vacation|getaway|itinerary)?\s+(?:to|in)\s+([A-Za-z\s]+?)(?=\s+from|\s+for|\s+under|\s+with|\.|$)/i);
    // Pattern C: "Take me to [Destination]" / "Give me a trip to [Destination]"
    const takeMeToMatch = text.match(/(?:take\s+me|give\s+me\s+a\s+trip)\s+to\s+([A-Za-z\s]+?)(?=\s+for|\s+from|\s+under|\s+with|\.|$)/i);
    // Pattern D: "I want to visit/explore [Destination]"
    const wantToVisitMatch = text.match(/(?:want\s+to\s+visit|want\s+to\s+explore|explore)\s+([A-Za-z\s]+?)(?=\s+for|\s+from|\s+under|\s+in|\.|$)/i);
    // Pattern E: Generic "to [Destination]"
    const genericToMatch = text.match(/\bto\s+([A-Za-z\s]+?)(?=\s+from|\s+for|\s+under|\s+with|\s+in|\.|$)/i);

    if (roadTripMatch) {
      extractedDest = roadTripMatch[1];
    } else if (planTripToMatch) {
      extractedDest = planTripToMatch[1];
    } else if (takeMeToMatch) {
      extractedDest = takeMeToMatch[1];
    } else if (wantToVisitMatch) {
      extractedDest = wantToVisitMatch[1];
    } else if (genericToMatch) {
      extractedDest = genericToMatch[1];
    }

    if (extractedDest) {
      // Clean noise words
      extractedDest = extractedDest
        .replace(/\b(for|from|under|with|days|day|trip|in|a|the|people|person|pax|lakh|budget)\b/gi, '')
        .trim();

      if (extractedDest.length >= 2) {
        params.destination = extractedDest.charAt(0).toUpperCase() + extractedDest.slice(1);
      }
    }

    // Single-word prompt fallback (e.g. user types simply "Tokyo" or "Manali")
    if (!params.destination && text.split(/\s+/).length <= 3 && !lowerText.includes('plan')) {
      const cleanWord = text.replace(/[^A-Za-z\s]/g, '').trim();
      if (cleanWord.length >= 2) {
        params.destination = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. EXTRACT BUDGET & CURRENCY
    // ─────────────────────────────────────────────────────────────────
    const lakhMatch = text.match(/(?:under|budget|around|max)?\s*(?:₹|inr|rs\.?)?\s*([\d.]+)\s*(?:lakh|lac|l)/i);
    const inrMatch = text.match(/(?:under|budget|around|max)?\s*(?:₹|inr|rs\.?)\s*([\d,]+)/i);
    const usdMatch = text.match(/(?:under|budget|around|max)?\s*\$\s*([\d,]+)/i);
    const rawNumberBudget = text.match(/(?:under|budget|max|below)\s*([\d,]+)/i);

    if (lakhMatch) {
      params.budget = Math.round(parseFloat(lakhMatch[1]) * 100000);
      params.currency = 'INR';
    } else if (inrMatch) {
      params.budget = parseInt(inrMatch[1].replace(/,/g, ''), 10);
      params.currency = 'INR';
    } else if (usdMatch) {
      params.budget = parseInt(usdMatch[1].replace(/,/g, ''), 10);
      params.currency = 'USD';
    } else if (rawNumberBudget) {
      params.budget = parseInt(rawNumberBudget[1].replace(/,/g, ''), 10);
      params.currency = 'INR';
    }

    if (lowerText.includes('luxury') || lowerText.includes('5 star') || lowerText.includes('premium')) {
      params.budgetRange = 'Luxury';
      params.travelStyle = 'luxury';
    } else if (lowerText.includes('budget') || lowerText.includes('cheap') || lowerText.includes('backpacker')) {
      params.budgetRange = 'Budget';
      params.travelStyle = 'budget-backpacker';
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. EXTRACT INTERESTS
    // ─────────────────────────────────────────────────────────────────
    const interestKeywords = [
      'beach',
      'adventure',
      'nature',
      'mountains',
      'food',
      'history',
      'culture',
      'shopping',
      'nightlife',
      'photography',
      'relaxation',
      'trekking',
      'hiking',
    ];

    interestKeywords.forEach((kw) => {
      if (lowerText.includes(kw) && !params.interests.includes(kw)) {
        params.interests.push(kw.charAt(0).toUpperCase() + kw.slice(1));
      }
    });

    // Determine missing mandatory parameters
    const missingFields = [];
    if (!params.destination) missingFields.push('destination');
    if (!params.durationDays) missingFields.push('duration');

    // Craft copilot question if critical info is missing
    let copilotMessage = '';
    if (missingFields.length > 0) {
      if (missingFields.includes('destination') && missingFields.includes('duration')) {
        copilotMessage = 'Where would you like to travel, and for how many days?';
      } else if (missingFields.includes('destination')) {
        copilotMessage = 'Which destination would you like to explore?';
      } else if (missingFields.includes('duration')) {
        copilotMessage = `Awesome! How many days are you planning to stay in ${params.destination}?`;
      }
    } else {
      copilotMessage = `I've prepared a complete ${params.durationDays}-day trip blueprint to ${params.destination}${
        params.origin ? ` from ${params.origin}` : ''
      } for ${params.travelersCount || 2} traveler(s)!`;
    }

    return {
      params,
      missingFields,
      isComplete: missingFields.length === 0,
      copilotMessage,
    };
  }
}

module.exports = new AiExtractorService();
