import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'yalla-nsafer:fx:';
// Free, no-key, broad-coverage endpoint (includes SAR/AED/QAR/KWD/BHD/OMR/EGP,
// which ECB-based feeds like Frankfurter don't carry). Rates refresh daily
// upstream, which is a traveler-currency-converter's normal cadence.
const API_URL = (base: string) => `https://open.er-api.com/v6/latest/${base}`;

export type ExchangeRates = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
  stale: boolean;
};

async function readCache(base: string): Promise<ExchangeRates | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + base);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rates: Record<string, number>; fetchedAt: number };
    return { base, rates: parsed.rates, fetchedAt: parsed.fetchedAt, stale: true };
  } catch {
    return null;
  }
}

async function writeCache(base: string, rates: Record<string, number>, fetchedAt: number) {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + base, JSON.stringify({ rates, fetchedAt }));
  } catch {
    // best-effort cache, fine if it fails
  }
}

/**
 * Fetches live exchange rates for `base` and falls back to the last
 * successfully cached rates for that base (marked `stale: true`) if the
 * network call fails. Returns null only when there is neither a live
 * result nor any cache to fall back to.
 */
export async function fetchExchangeRates(base: string): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(API_URL(base));
    const data = await response.json();
    if (data?.result === 'success' && data?.rates) {
      const fetchedAt = Date.now();
      await writeCache(base, data.rates, fetchedAt);
      return { base, rates: data.rates, fetchedAt, stale: false };
    }
    return await readCache(base);
  } catch {
    return await readCache(base);
  }
}
