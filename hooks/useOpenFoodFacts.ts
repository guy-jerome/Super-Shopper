import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import {
  mergeFoodSuggestions,
  rankOpenFoodFactsResults,
  type OpenFoodFactsHit,
} from "../utils/openFoodSearch";

export type FoodSuggestion = {
  name: string;
  brand?: string;
  quantity?: string;
  imageUrl?: string;
};

const BASE = "https://us.openfoodfacts.org";
const HEADERS = { "User-Agent": "SuperShopper/1.0 (personal shopping app)" };
const FIELDS =
  "product_name,product_name_en,brands,quantity,image_front_thumb_url,countries_tags";
const FILTER = "filter_by=countries_tags%3Aen%3Aunited-states";
const PAGE_SIZE = 12;
const RESULTS_PER_PAGE = 5;
const MAX_AUTO_PAGES = 4;

type QueryCacheEntry = {
  suggestions: FoodSuggestion[];
  hasMore: boolean;
  nextPage: number;
};

// search.openfoodfacts.org (Typesense) is fast (~1s) but has no CORS headers.
// On native there's no CORS so we hit it directly.
// On web we route through the Expo Router API route at /api/food-search which
// proxies the Typesense request server-side, bypassing CORS enforcement.
function buildSearchUrl(
  q: string,
  page: number,
): { url: string; responseKey: "hits" } {
  const params = `q=${encodeURIComponent(q)}&page=${page}&page_size=${PAGE_SIZE}&fields=${FIELDS}&${FILTER}`;
  if (Platform.OS !== "web") {
    return {
      url: `https://search.openfoodfacts.org/search?${params}`,
      responseKey: "hits",
    };
  }
  return {
    url: `/api/food-search?${params}`,
    responseKey: "hits",
  };
}

// Module-level cache: survives re-renders and re-mounts for the app session
const queryCache = new Map<string, QueryCacheEntry>();

export async function lookupBarcode(
  barcode: string,
): Promise<FoodSuggestion | null> {
  try {
    const res = await fetch(
      `${BASE}/api/v0/product/${barcode}.json?fields=${FIELDS}&lc=en`,
      { headers: HEADERS },
    );
    const data = await res.json();
    const productName =
      data.product?.product_name_en || data.product?.product_name;
    if (data.status !== 1 || !productName) return null;
    const p = data.product;
    return {
      name: productName.trim(),
      brand: p.brands?.split(",")[0]?.trim() || undefined,
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextPageRef = useRef(1);
  const activeQueryRef = useRef("");
  const suggestionsRef = useRef<FoodSuggestion[]>([]);

  const fetchPage = useCallback(
    async (q: string, page: number, signal: AbortSignal) => {
      const { url, responseKey } = buildSearchUrl(q, page);
      const res = await fetch(url, {
        signal,
        headers: HEADERS,
      });
      if (!res.ok) {
        throw new Error(`[FoodSearch] HTTP error: ${res.status} ${res.url}`);
      }

      const data = await res.json();
      const hits = (data[responseKey] ?? []) as OpenFoodFactsHit[];
      return {
        hits,
        results: rankOpenFoodFactsResults(hits, q, {
          maxResults: RESULTS_PER_PAGE,
        }),
        pageHasMore: hits.length === PAGE_SIZE,
      };
    },
    [],
  );

  const doFetch = useCallback(
    async (q: string, page: number, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        let nextPage = page;
        let pageHasMore = false;
        let pagesFetched = 0;
        let nextSuggestions = append ? suggestionsRef.current : [];
        const targetCount = nextSuggestions.length + RESULTS_PER_PAGE;

        while (pagesFetched < MAX_AUTO_PAGES) {
          const { results, pageHasMore: hasAnotherPage } = await fetchPage(
            q,
            nextPage,
            controller.signal,
          );
          pageHasMore = hasAnotherPage;
          nextSuggestions = mergeFoodSuggestions(nextSuggestions, results);
          nextPage += 1;
          pagesFetched += 1;

          if (!pageHasMore || nextSuggestions.length >= targetCount) {
            break;
          }
        }

        if (activeQueryRef.current !== q) {
          return;
        }

        suggestionsRef.current = nextSuggestions;
        setSuggestions(nextSuggestions);
        queryCache.set(q, {
          suggestions: nextSuggestions,
          hasMore: pageHasMore,
          nextPage,
        });
        nextPageRef.current = nextPage;
        setHasMore(pageHasMore);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[FoodSearch] fetch error:", err?.message ?? err);
          if (!append) {
            setSuggestions([]);
            suggestionsRef.current = [];
            setHasMore(false);
          }
        }
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [fetchPage],
  );

  const triggerSearch = useCallback(() => {
    const q = query.trim();
    if (q.length < 2) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    activeQueryRef.current = q;
    nextPageRef.current = 1;
    doFetch(q, 1, false);
  }, [query, doFetch]);

  const loadMore = useCallback(() => {
    const q = query.trim();
    if (q.length < 2 || !hasMore || isLoading || isLoadingMore) return;
    activeQueryRef.current = q;
    doFetch(q, nextPageRef.current, true);
  }, [doFetch, hasMore, isLoading, isLoadingMore, query]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    activeQueryRef.current = q;

    if (q.length < 2) {
      setSuggestions([]);
      suggestionsRef.current = [];
      setIsLoading(false);
      setIsLoadingMore(false);
      setHasMore(false);
      nextPageRef.current = 1;
      return;
    }

    const cached = queryCache.get(q);
    if (cached) {
      setSuggestions(cached.suggestions);
      suggestionsRef.current = cached.suggestions;
      setHasMore(cached.hasMore);
      nextPageRef.current = cached.nextPage;
      setIsLoading(false);
      return;
    }

    suggestionsRef.current = [];
    setHasMore(false);
    nextPageRef.current = 1;
    setIsLoading(true);
    timerRef.current = setTimeout(() => doFetch(q, 1, false), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doFetch]);

  return {
    suggestions,
    isLoading,
    isLoadingMore,
    hasMore,
    triggerSearch,
    loadMore,
  };
}
