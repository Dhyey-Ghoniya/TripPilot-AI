const ALLOWED_CURRENCIES = new Set(['INR', 'USD', 'EUR']);

const cleanString = (value) => {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= 80 ? cleaned : null;
};

function normalizeLlmParams(params = {}) {
  const normalized = {};
  for (const key of ['destination', 'origin', 'travelMonth']) {
    const value = cleanString(params[key]);
    if (value) normalized[key] = value;
  }

  for (const [key, min, max] of [['durationDays', 1, 60], ['travelersCount', 1, 50]]) {
    const value = Number(params[key]);
    if (Number.isInteger(value) && value >= min && value <= max) normalized[key] = value;
  }

  const budget = Number(params.budget);
  if (Number.isFinite(budget) && budget > 0) normalized.budget = budget;

  const currency = typeof params.currency === 'string' ? params.currency.trim().toUpperCase() : '';
  if (ALLOWED_CURRENCIES.has(currency)) normalized.currency = currency;

  if (Array.isArray(params.interests)) {
    normalized.interests = params.interests
      .map(cleanString)
      .filter(Boolean)
      .slice(0, 12);
  }
  return normalized;
}

function mergeAndRecompute(extracted, llmTurn) {
  const params = { ...extracted.params, ...normalizeLlmParams(llmTurn.params) };
  const missingFields = [];
  if (!params.destination) missingFields.push('destination');
  if (!params.origin) missingFields.push('origin');
  if (!params.durationDays) missingFields.push('duration');
  if (!params.travelMonth && !params.travelDates) missingFields.push('dates');
  if (!params.budget && !params.travelersCount) missingFields.push('budget');

  const isReadyToPlan = Boolean(
    params.destination && params.origin && params.durationDays &&
    (params.travelMonth || params.travelDates) && (params.budget || params.travelersCount)
  );
  const lastAskedField = missingFields[0] || null;
  const copilotMessage = isReadyToPlan
    ? `Great. I'll plan a ${params.durationDays}-day ${params.destination} trip from ${params.origin}${params.travelersCount ? ` for ${params.travelersCount} people` : ''}${params.travelMonth ? ` in ${params.travelMonth}` : ''}${params.budget ? `, targeting ${params.currency || 'INR'} ${Number(params.budget).toLocaleString('en-IN')}` : ''}. I'll organize the route, itinerary, transportation, accommodation options, and estimated expenses.`
    : extracted.copilotMessage;

  return {
    ...extracted,
    intent: llmTurn.intent === 'ANSWER_FOLLOW_UP' ? 'ANSWER_FOLLOW_UP' : extracted.intent,
    params,
    missingFields,
    lastAskedField,
    isReadyToPlan,
    copilotMessage: !isReadyToPlan && llmTurn.reply?.includes('?') && (llmTurn.reply.match(/\?/g) || []).length === 1
      ? llmTurn.reply
      : copilotMessage,
  };
}

module.exports = { normalizeLlmParams, mergeAndRecompute };
