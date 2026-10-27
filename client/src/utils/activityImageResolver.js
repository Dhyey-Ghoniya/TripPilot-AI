/** Normalize planner destination text for labels and photo search queries. */
export function cleanDestinationName(destStr = '') {
  if (!destStr) return '';
  const cleaned = destStr
    .replace(/^plan\s*\d*\s*days?\s*in\s*/i, '')
    .replace(/^plan\s*a\s*trip\s*to\s*/i, '')
    .replace(/\b(plan|\d+\s*days|days|day|trip|in|to|a|the)\b/gi, '')
    .replace(/[\d.]+/g, '')
    .replace(/[,!]/g, '')
    .trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
}