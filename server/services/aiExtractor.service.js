/**
 * Natural Language Parser & Extractor for travel prompts (Module 2 Enhanced).
 * Context-aware multi-turn parameter extraction, intent recognition, & conversational flow orchestration.
 * ZERO hardcoded destination list dependencies.
 */

class AiExtractorService {
  /**
   * Extract parameters & detect user intent based on current prompt and session state.
   * @param {string} promptText - User query, e.g. "I want to visit Japan", "Seven days", "₹1,00,000 for 2 people"
   * @param {object} [currentSessionParams={}] - Accumulated parameters from previous chat turns
   * @param {string} [lastAskedField=null] - The field AI assistant last asked the user about
   * @returns {object} Extracted parameters, missing fields, detected intent, next question, & readiness status
   */
  extractParameters(promptText = '', currentSessionParams = {}, lastAskedField = null) {
    const text = (promptText || '').trim();
    const lowerText = text.toLowerCase();

    // Deep clone session params to accumulate state
    const params = {
      destination: currentSessionParams.destination || '',
      additionalCities: currentSessionParams.additionalCities || [],
      origin: currentSessionParams.origin || '',
      durationDays: currentSessionParams.durationDays || null,
      travelersCount: currentSessionParams.travelersCount || null,
      travelersType: currentSessionParams.travelersType || 'couple',
      budget: currentSessionParams.budget || null,
      currency: currentSessionParams.currency || 'INR',
      travelMonth: currentSessionParams.travelMonth || '',
      travelDates: currentSessionParams.travelDates || '',
      budgetRange: currentSessionParams.budgetRange || 'Moderate',
      travelStyle: currentSessionParams.travelStyle || 'balanced',
      interests: currentSessionParams.interests ? [...currentSessionParams.interests] : [],
      preferredTransport: currentSessionParams.preferredTransport ? [...currentSessionParams.preferredTransport] : [],
      accommodationPreference: currentSessionParams.accommodationPreference ? [...currentSessionParams.accommodationPreference] : [],
    };

    // ─────────────────────────────────────────────────────────────────
    // 0. INTENT RECOGNITION
    // ─────────────────────────────────────────────────────────────────
    let intent = 'START_TRIP_PLANNING';

    // 0a. Check for START_OVER
    if (
      lowerText === 'start over' ||
      lowerText === 'reset' ||
      lowerText === 'clear' ||
      lowerText === 'start fresh' ||
      lowerText.includes('reset trip planning') ||
      lowerText.includes('clear requirements')
    ) {
      return {
        intent: 'START_OVER',
        params: {
          destination: '',
          additionalCities: [],
          origin: '',
          durationDays: null,
          travelersCount: null,
          travelersType: 'couple',
          budget: null,
          currency: 'INR',
          travelMonth: '',
          travelDates: '',
          budgetRange: 'Moderate',
          travelStyle: 'balanced',
          interests: [],
          preferredTransport: [],
          accommodationPreference: [],
        },
        missingFields: ['destination'],
        lastAskedField: 'destination',
        isReadyToPlan: false,
        copilotMessage: 'Sure, let\'s start fresh! Where would you like to travel next?',
      };
    }

    // 0b. Check for PROCEED_WITH_DEFAULTS ("You decide", "Surprise me", "Go ahead", "Generate trip now")
    const isProceedRequested =
      lowerText.includes('you decide') ||
      lowerText.includes('surprise me') ||
      lowerText.includes('suggest one') ||
      lowerText.includes('use defaults') ||
      lowerText.includes('go ahead') ||
      lowerText.includes('generate trip') ||
      lowerText.includes('plan it now') ||
      lowerText.includes('create trip now') ||
      lowerText.includes('up to you');

    if (isProceedRequested) {
      intent = 'PROCEED_WITH_DEFAULTS';
    }

    // 0c. Check for GENERAL_QUESTION ("What is the best time to visit...", "Is Japan safe?", "What are top sights...")
    const isGeneralQuestion =
      (lowerText.startsWith('what is') ||
        lowerText.startsWith('what are') ||
        lowerText.startsWith('how is') ||
        lowerText.startsWith('is ') ||
        lowerText.startsWith('can i ') ||
        lowerText.startsWith('tell me about')) &&
      !lowerText.includes('plan') &&
      !lowerText.includes('trip') &&
      !lowerText.includes('days') &&
      !lastAskedField;

    if (isGeneralQuestion) {
      intent = 'GENERAL_QUESTION';
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. CONTEXTUAL FOLLOW-UP EXTRACTION (Based on lastAskedField)
    // ─────────────────────────────────────────────────────────────────
    if (lastAskedField && !isProceedRequested && intent !== 'GENERAL_QUESTION') {
      intent = 'ANSWER_FOLLOW_UP';

      if (lastAskedField === 'destination') {
        const cleanDest = text.replace(/^(i want to visit|take me to|plan a trip to|going to|visit)\s+/i, '').replace(/[\.\,\!]/g, '').trim();
        if (cleanDest) {
          params.destination = cleanDest.charAt(0).toUpperCase() + cleanDest.slice(1);
        }
      } else if (lastAskedField === 'origin') {
        const cleanOrigin = text.replace(/^(from|travelling from|flying from|starting from|i am from|living in)\s+/i, '').replace(/[\.\,\!]/g, '').trim();
        if (cleanOrigin) {
          params.origin = cleanOrigin.charAt(0).toUpperCase() + cleanOrigin.slice(1);
        }
      } else if (lastAskedField === 'duration') {
        const dayNumMatch = text.match(/(\d+)/);
        if (dayNumMatch) {
          params.durationDays = parseInt(dayNumMatch[1], 10);
        } else if (lowerText.includes('week')) {
          params.durationDays = 7;
        } else if (lowerText.includes('weekend')) {
          params.durationDays = 3;
        }
      } else if (lastAskedField === 'dates') {
        const monthMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i);
        if (monthMatch) {
          params.travelMonth = monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase();
        }
        params.travelDates = text;
      } else if (lastAskedField === 'budget') {
        const lakhMatch = text.match(/(?:under|budget|around|max)?\s*(?:₹|inr|rs\.?)?\s*([\d.]+)\s*(?:lakh|lac|l)/i);
        const inrMatch = text.match(/(?:under|budget|around|max)?\s*(?:₹|inr|rs\.?)\s*([\d,]+)/i);
        const usdMatch = text.match(/(?:under|budget|around|max)?\s*\$\s*([\d,]+)/i);
        const rawNum = text.match(/([\d,]{4,})/);

        if (lakhMatch) {
          params.budget = Math.round(parseFloat(lakhMatch[1]) * 100000);
          params.currency = 'INR';
        } else if (inrMatch) {
          params.budget = parseInt(inrMatch[1].replace(/,/g, ''), 10);
          params.currency = 'INR';
        } else if (usdMatch) {
          params.budget = parseInt(usdMatch[1].replace(/,/g, ''), 10);
          params.currency = 'USD';
        } else if (rawNum) {
          params.budget = parseInt(rawNum[1].replace(/,/g, ''), 10);
          params.currency = 'INR';
        }

        const paxMatch = text.match(/(\d+)\s*(people|person|travelers|pax|adults)?/i) || text.match(/for\s*(\d+)/i);
        if (paxMatch) {
          params.travelersCount = parseInt(paxMatch[1], 10);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. GENERAL PARAMETER EXTRACTION (For full or updating prompts)
    // ─────────────────────────────────────────────────────────────────
    // Duration (e.g., "7 days", "seven days", "10-day")
    const dayMatch = text.match(/(\d+)\s*(-|\s*)day/i) || text.match(/(\d+)\s*days/i);
    const wordDayMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const wordDayMatch = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(-|\s*)days?\b/i);

    if (dayMatch) {
      params.durationDays = parseInt(dayMatch[1], 10);
    } else if (wordDayMatch) {
      params.durationDays = wordDayMap[wordDayMatch[1].toLowerCase()];
    } else if (lowerText.includes('weekend') && !params.durationDays) {
      params.durationDays = 3;
    } else if ((lowerText.includes('a week') || lowerText.includes('1 week')) && !params.durationDays) {
      params.durationDays = 7;
    }

    // Travelers (Strict parsing so budgets like 50000 are NEVER parsed as travelers)
    const explicitPaxMatch = text.match(/(\d+)\s*(people|person|travelers|pax|adults|guests)/i) || text.match(/for\s*(\d+)\s*(people|person|travelers|pax|adults|guests)/i);
    const genericForPaxMatch = text.match(/for\s*(\d+)\b(?![\d,]*\s*(?:k|lakh|lac|l|inr|rs|₹|usd|\$|per|budget))/i);
    const wordPaxMatch = text.match(/for\s*(one|two|three|four|five)\s*(people|person|travelers|pax|adults)?/i);

    if (explicitPaxMatch) {
      const cnt = parseInt(explicitPaxMatch[1], 10);
      if (cnt <= 50) params.travelersCount = cnt;
    } else if (genericForPaxMatch) {
      const cnt = parseInt(genericForPaxMatch[1], 10);
      if (cnt <= 50) params.travelersCount = cnt;
    } else if (wordPaxMatch) {
      params.travelersCount = wordDayMap[wordPaxMatch[1].toLowerCase()];
    } else if (lowerText.includes('solo') || lowerText.includes('myself')) {
      params.travelersCount = 1;
      params.travelersType = 'solo';
    } else if (lowerText.includes('couple') || lowerText.includes('honeymoon')) {
      params.travelersCount = 2;
      params.travelersType = 'couple';
    } else if (lowerText.includes('family')) {
      params.travelersCount = params.travelersCount || 4;
      params.travelersType = 'family';
    }

    if (params.travelersCount && params.travelersCount > 50) {
      params.travelersCount = 2; // Default fallback if larger number leaked
    }

    if (params.travelersCount === 1) params.travelersType = 'solo';
    else if (params.travelersCount === 2) params.travelersType = 'couple';
    else if (params.travelersCount > 2) params.travelersType = 'group';

    // Origin (e.g. "from Ahmedabad", "from Mumbai", "from Ahmedabad, India")
    const originMatch = text.match(/from\s+([A-Za-z\s,\-\']+?)(?=\s+to|\s+for|\s+under|\s+with|\s+in|\.|$)/i);
    if (originMatch) {
      params.origin = originMatch[1].replace(/,$/g, '').trim();
    }

    // Destination Extraction
    let extractedDest = '';
    const roadTripMatch = text.match(/road\s+trip\s+from\s+[A-Za-z\s,\-\']+\s+to\s+([A-Za-z\s,\-\']+?)(?=\s+for|\s+under|\s+with|\.|$)/i);
    const planTripToMatch = text.match(/(?:plan|create|build|make)\s+(?:a\s+)?(?:\d+-day\s+)?(?:trip|honeymoon|vacation|getaway|itinerary)?\s*(?:to|in)?\s*([A-Za-z\s,\-\']+?)(?=\s+from|\s+for|\s+under|\s+with|\.|$)/i);
    const visitMatch = text.match(/(?:want\s+to\s+visit|want\s+to\s+explore|visit|explore)\s+([A-Za-z\s,\-\']+?)(?=\s+from|\s+for|\s+under|\s+in|\.|$)/i);
    const genericToMatch = text.match(/\bto\s+([A-Za-z\s,\-\']+?)(?=\s+from|\s+for|\s+under|\s+with|\s+in|\.|$)/i);

    if (roadTripMatch) extractedDest = roadTripMatch[1];
    else if (planTripToMatch) extractedDest = planTripToMatch[1];
    else if (visitMatch) extractedDest = visitMatch[1];
    else if (genericToMatch) extractedDest = genericToMatch[1];

    if (extractedDest) {
      extractedDest = extractedDest
        .replace(/\b(plan|\d+\s*days|days|day|trip|in|to|a|the|people|person|pax|lakh|budget)\b/gi, '')
        .replace(/[\d\.]+/g, '')
        .replace(/,$/g, '')
        .trim();
      if (extractedDest.length >= 2) {
        params.destination = extractedDest.charAt(0).toUpperCase() + extractedDest.slice(1);
      }
    }

    // Budget & Currency
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

    // Month / Dates
    const monthMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
    if (monthMatch) {
      params.travelMonth = monthMatch[1].charAt(0).toUpperCase() + monthMatch[1].slice(1).toLowerCase();
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. DETERMINE MISSING FIELDS & CONVERSATIONAL STEPPING
    // ─────────────────────────────────────────────────────────────────
    const missingFields = [];
    if (!params.destination) missingFields.push('destination');
    if (!params.origin) missingFields.push('origin');
    if (!params.durationDays) missingFields.push('duration');
    if (!params.travelMonth && !params.travelDates) missingFields.push('dates');
    if (!params.budget && !params.travelersCount) missingFields.push('budget');

    // Decide if ready to generate complete trip:
    // Ready when user explicitly provided all required details, or asked to proceed, or completed step-by-step sequence
    let isReadyToPlan = false;

    if (isProceedRequested && params.destination) {
      params.durationDays = params.durationDays || 5;
      params.origin = params.origin || 'Ahmedabad';
      params.travelersCount = params.travelersCount || 2;
      params.budget = params.budget || 75000;
      isReadyToPlan = true;
    } else if (params.destination && params.origin && params.durationDays && (params.travelMonth || params.travelDates) && (params.budget || params.travelersCount)) {
      isReadyToPlan = true;
    } else if (params.destination && params.origin && params.durationDays && text.length > 50 && (lowerText.includes('plan') || lowerText.includes('budget') || lowerText.includes('people'))) {
      isReadyToPlan = true;
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. CRAFT NATURAL COPILOT QUESTION / ACKNOWLEDGEMENT
    // ─────────────────────────────────────────────────────────────────
    let nextAskedField = null;
    let copilotMessage = '';

    if (isReadyToPlan) {
      const budgetStr = params.budget ? `, targeting ₹${params.budget.toLocaleString('en-IN')}` : '';
      const monthStr = params.travelMonth ? ` in ${params.travelMonth}` : '';
      const paxStr = params.travelersCount ? ` for ${params.travelersCount} people` : '';
      const originStr = params.origin ? ` from ${params.origin}` : '';

      copilotMessage = `Great. I'll plan a ${params.durationDays}-day ${params.destination} trip${originStr}${paxStr}${monthStr}${budgetStr}. I'll organize the route, itinerary, transportation, accommodation options, and estimated expenses.`;
    } else {
      // Step-by-step missing field questions
      if (!params.destination) {
        nextAskedField = 'destination';
        copilotMessage = 'Hi! Where would you like to travel?';
      } else if (!params.origin) {
        nextAskedField = 'origin';
        copilotMessage = `Wonderful! Where will you be travelling from?`;
      } else if (!params.durationDays) {
        nextAskedField = 'duration';
        copilotMessage = `How many days would you like to spend in ${params.destination}?`;
      } else if (!params.travelMonth && !params.travelDates) {
        nextAskedField = 'dates';
        copilotMessage = 'Do you have any travel dates in mind?';
      } else if (!params.budget && !params.travelersCount) {
        nextAskedField = 'budget';
        copilotMessage = 'No problem. Would you like to set a budget, or should I suggest one?';
      } else {
        isReadyToPlan = true;
        const budgetStr = params.budget ? `, targeting ₹${params.budget.toLocaleString('en-IN')}` : '';
        copilotMessage = `Great. I'll plan a ${params.durationDays}-day ${params.destination} trip from ${params.origin || 'Ahmedabad'}${budgetStr}. I'll organize the route, itinerary, transportation, accommodation options, and estimated expenses.`;
      }
    }

    return {
      intent,
      params,
      missingFields,
      lastAskedField: nextAskedField,
      isReadyToPlan,
      copilotMessage,
    };
  }
}

module.exports = new AiExtractorService();
