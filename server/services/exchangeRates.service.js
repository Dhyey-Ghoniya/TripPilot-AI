const ECB_RATES_URL = 'https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?lastNObservations=1&format=csvdata';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const parseCsvLine = (line) => {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { values.push(value); value = ''; }
    else value += char;
  }
  values.push(value);
  return values;
};

const parseEcbRatesCsv = (csv) => {
  const lines = String(csv || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('ECB exchange rates response contained no observations.');
  const headers = parseCsvLine(lines[0]);
  const currencyColumn = headers.indexOf('CURRENCY');
  const valueColumn = headers.indexOf('OBS_VALUE');
  const dateColumn = headers.indexOf('TIME_PERIOD');
  if ([currencyColumn, valueColumn, dateColumn].some((column) => column < 0)) {
    throw new Error('ECB exchange rates response had an unexpected CSV format.');
  }

  const rates = { EUR: 1 };
  let date = null;
  for (const line of lines.slice(1)) {
    const fields = parseCsvLine(line);
    const code = fields[currencyColumn];
    const value = Number(fields[valueColumn]);
    const observationDate = fields[dateColumn];
    if (/^[A-Z]{3}$/.test(code) && Number.isFinite(value) && value > 0) rates[code] = value;
    if (observationDate && (!date || observationDate > date)) date = observationDate;
  }
  if (Object.keys(rates).length < 2 || !date) throw new Error('ECB exchange rates response contained no usable rates.');
  return { rates, date };
};

const createExchangeRatesService = ({ fetchImpl = global.fetch, now = () => Date.now(), ttlMs = TWELVE_HOURS_MS } = {}) => {
  let cache = null;
  return {
    async getRates() {
      if (cache && now() - cache.fetchedAt < ttlMs) return { rates: { ...cache.rates }, date: cache.date };
      if (typeof fetchImpl !== 'function') throw new Error('Exchange rate fetching is unavailable.');
      const response = await fetchImpl(ECB_RATES_URL, {
        headers: { Accept: 'text/csv' },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error(`ECB exchange rate request failed with HTTP ${response.status}.`);
      const parsed = parseEcbRatesCsv(await response.text());
      cache = { ...parsed, fetchedAt: now() };
      return { rates: { ...cache.rates }, date: cache.date };
    },
  };
};

const service = createExchangeRatesService();
module.exports = { ECB_RATES_URL, parseEcbRatesCsv, createExchangeRatesService, getRates: () => service.getRates() };
