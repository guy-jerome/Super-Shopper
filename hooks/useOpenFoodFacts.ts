import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

export type FoodSuggestion = {
  name: string;
  brand?: string;
  quantity?: string;
  imageUrl?: string;
};

const BASE = 'https://us.openfoodfacts.org';
const HEADERS = { 'User-Agent': 'SuperShopper/1.0 (personal shopping app)' };
const FIELDS = 'product_name,product_name_en,brands,quantity,image_front_thumb_url';
const FILTER = 'filter_by=countries_tags%3Aen%3Aunited-states';

// search.openfoodfacts.org (Typesense) is fast (~1s) but has no CORS headers.
// On native there's no CORS so we hit it directly.
// On web (dev) we route through an Expo Router API route at /api/food-search
// which proxies the request server-side, bypassing browser CORS enforcement.
function buildSearchUrl(q: string): { url: string; responseKey: 'hits' } {
  const params = `q=${encodeURIComponent(q)}&page_size=5&fields=${FIELDS}&${FILTER}`;
  if (Platform.OS !== 'web') {
    return {
      url: `https://search.openfoodfacts.org/search?${params}`,
      responseKey: 'hits',
    };
  }
  return {
    url: `/api/food-search?${params}`,
    responseKey: 'hits',
  };
}

// Module-level cache: survives re-renders and re-mounts for the app session
const queryCache = new Map<string, FoodSuggestion[]>();

export async function lookupBarcode(barcode: string): Promise<FoodSuggestion | null> {
  try {
    const res = await fetch(
      `${BASE}/api/v0/product/${barcode}.json?fields=${FIELDS}&lc=en`,
      { headers: HEADERS },
    );
    const data = await res.json();
    const productName = data.product?.product_name_en || data.product?.product_name;
    if (data.status !== 1 || !productName) return null;
    const p = data.product;
    return {
      name: productName.trim(),
      brand: p.brands?.split(',')[0]?.trim() || undefined,
      quantity: p.quantity?.trim() || undefined,
      imageUrl: p.image_front_thumb_url || undefined,
    };
  } catch {
    return null;
  }
}

export function useOpenFoodFacts(query: string) {
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async (q: string) => {
    // Serve from cache instantly, then skip the network call
    const cached = queryCache.get(q);
    if (cached) {
      setSuggestions(cached);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    try {
      const { url, responseKey } = buildSearchUrl(q);

      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: HEADERS,
      });
      if (!res.ok) {
        console.error('[FoodSearch] HTTP error:', res.status, res.url);
        setSuggestions([]);
        return;
      }
      const data = await res.json();

      const seen = new Set<string>();
      const results: FoodSuggestion[] = [];
      for (const p of data[responseKey] ?? []) {
        const name = (p.product_name_en || p.product_name)?.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          name,
          brand: (Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(',')[0])?.trim() || undefined,
          quantity: p.quantity?.trim() || undefined,
          imageUrl: p.image_front_thumb_url || undefined,
        });
      }
      queryCache.set(q, results);
      setSuggestions(results);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[FoodSearch] fetch error:', err?.message ?? err);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerSearch = useCallback(() => {
    const q = query.trim();
    if (q.length < 2) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    doFetch(q);
  }, [query, doFetch]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }
    // Skip the loading flash if we already have a cached result
    if (!queryCache.has(q)) setIsLoading(true);
    timerRef.current = setTimeout(() => doFetch(q), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doFetch]);

  return { suggestions, isLoading, triggerSearch };
}
