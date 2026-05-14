const CACHE_KEY = 'exchange-rate-cache';

interface RateCache {
  date: string;
  pairs: Record<string, number>;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function loadCache(): RateCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RateCache;
      if (parsed.date === today()) return parsed;
    }
  } catch {
    // ignore
  }
  return { date: today(), pairs: {} };
}

function saveCache(cache: RateCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const key = `${from}_${to}`;
  const cache = loadCache();
  if (cache.pairs[key] !== undefined) return cache.pairs[key];

  const response = await fetch(`https://api.frankfurter.dev/v2/rate/${from}/${to}`);
  if (!response.ok) throw new Error('No se pudo obtener el tipo de cambio');

  const data = (await response.json()) as { rate: number };
  const rate = data.rate;
  if (rate === undefined) throw new Error(`Tasa no disponible para ${from}→${to}`);

  cache.pairs[key] = rate;
  saveCache(cache);
  return rate;
}
