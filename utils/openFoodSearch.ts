import type { FoodSuggestion } from "../hooks/useOpenFoodFacts";

type OpenFoodFactsBrand = string | string[] | undefined;

export type OpenFoodFactsHit = {
  product_name?: string;
  product_name_en?: string;
  brands?: OpenFoodFactsBrand;
  quantity?: string;
  image_front_thumb_url?: string;
  countries_tags?: string[];
};

type RankedSuggestion = FoodSuggestion & {
  score: number;
  isUnitedStatesProduct: boolean;
};

const UNITED_STATES_TAG = "en:united-states";
const MAX_RESULTS = 5;

type RankOptions = {
  maxResults?: number;
};

function normalizeSearchText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function getPrimaryBrand(brands: OpenFoodFactsBrand): string | undefined {
  if (Array.isArray(brands)) {
    return brands[0]?.trim() || undefined;
  }
  return brands?.split(",")[0]?.trim() || undefined;
}

function isUnitedStatesProduct(countriesTags?: string[]): boolean {
  return countriesTags?.includes(UNITED_STATES_TAG) ?? false;
}

function countExactTokenMatches(
  resultTokens: string[],
  queryTokens: string[],
): number {
  return queryTokens.filter((token) => resultTokens.includes(token)).length;
}

function countPrefixTokenMatches(
  resultTokens: string[],
  queryTokens: string[],
): number {
  return queryTokens.filter((token) =>
    resultTokens.some((resultToken) => resultToken.startsWith(token)),
  ).length;
}

function scoreHit(
  hit: OpenFoodFactsHit,
  query: string,
): RankedSuggestion | null {
  const name = (hit.product_name_en || hit.product_name)?.trim();
  if (!name) return null;

  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(name);
  if (!normalizedQuery || !normalizedName) return null;

  const queryTokens = tokenize(query);
  const nameTokens = tokenize(name);
  const brand = getPrimaryBrand(hit.brands);
  const normalizedBrand = normalizeSearchText(brand);
  const exactTokenMatches = countExactTokenMatches(nameTokens, queryTokens);
  const prefixTokenMatches = countPrefixTokenMatches(nameTokens, queryTokens);
  const containsFullQuery = normalizedName.includes(normalizedQuery);
  const startsWithFullQuery = normalizedName.startsWith(normalizedQuery);
  const allTokensPresent = queryTokens.every((token) =>
    normalizedName.includes(token),
  );
  const brandContainsQuery = normalizedBrand.includes(normalizedQuery);
  const usProduct = isUnitedStatesProduct(hit.countries_tags);

  let score = 0;

  if (normalizedName === normalizedQuery) score += 400;
  if (startsWithFullQuery) score += 220;
  if (containsFullQuery) score += 120;
  if (allTokensPresent) score += 100;

  score += exactTokenMatches * 45;
  score += Math.max(0, prefixTokenMatches - exactTokenMatches) * 18;

  if (brandContainsQuery) score += 20;
  if (usProduct) {
    score += 90;
  } else {
    score -= 140;
  }

  if (
    queryTokens.length > 1 &&
    exactTokenMatches < Math.ceil(queryTokens.length / 2)
  ) {
    score -= 120;
  }

  if (
    !containsFullQuery &&
    exactTokenMatches === 0 &&
    prefixTokenMatches === 0
  ) {
    score -= 200;
  }

  if (nameTokens.length === 1 && queryTokens.length > 1) {
    score -= 40;
  }

  return {
    name,
    brand,
    quantity: hit.quantity?.trim() || undefined,
    imageUrl: hit.image_front_thumb_url || undefined,
    score,
    isUnitedStatesProduct: usProduct,
  };
}

function getMinimumScore(query: string): number {
  const queryTokens = tokenize(query);
  return queryTokens.length > 1 ? 110 : 50;
}

export function mergeFoodSuggestions(
  existing: FoodSuggestion[],
  incoming: FoodSuggestion[],
): FoodSuggestion[] {
  const seen = new Set<string>();
  const merged: FoodSuggestion[] = [];

  for (const suggestion of [...existing, ...incoming]) {
    const dedupeKey = `${normalizeSearchText(suggestion.name)}|${normalizeSearchText(suggestion.brand)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    merged.push(suggestion);
  }

  return merged;
}

export function rankOpenFoodFactsResults(
  hits: OpenFoodFactsHit[],
  query: string,
  options: RankOptions = {},
): FoodSuggestion[] {
  const maxResults = options.maxResults ?? MAX_RESULTS;
  const minimumScore = getMinimumScore(query);
  const seen = new Set<string>();

  const ranked = hits
    .map((hit) => scoreHit(hit, query))
    .filter((hit): hit is RankedSuggestion => Boolean(hit))
    .filter((hit) => hit.score >= minimumScore)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.isUnitedStatesProduct !== right.isUnitedStatesProduct) {
        return (
          Number(right.isUnitedStatesProduct) -
          Number(left.isUnitedStatesProduct)
        );
      }
      return left.name.localeCompare(right.name);
    });

  const usFirst = ranked.some((hit) => hit.isUnitedStatesProduct)
    ? ranked.filter((hit) => hit.isUnitedStatesProduct)
    : ranked;

  const results: FoodSuggestion[] = [];
  for (const hit of usFirst) {
    const dedupeKey = `${normalizeSearchText(hit.name)}|${normalizeSearchText(hit.brand)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    results.push({
      name: hit.name,
      brand: hit.brand,
      quantity: hit.quantity,
      imageUrl: hit.imageUrl,
    });
    if (results.length === maxResults) break;
  }

  return results;
}
