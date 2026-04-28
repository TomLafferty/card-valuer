import { PokemonCard, CardCondition, PokeTracePrice } from '../types';
import { CONDITION_MULTIPLIERS } from '../constants/config';

// Map our UI condition names to PokeTrace API condition keys
const CONDITION_TO_POKETRACE: Record<CardCondition, string> = {
  NM: 'NEAR_MINT',
  LP: 'LIGHTLY_PLAYED',
  MP: 'MODERATELY_PLAYED',
  HP: 'HEAVILY_PLAYED',
  DMG: 'DAMAGED',
};

function getNMPrice(card: PokemonCard): number | null {
  const nm = card.prices?.tcgplayer?.['NEAR_MINT']?.avg
    ?? card.prices?.ebay?.['NEAR_MINT']?.avg
    ?? null;
  return nm;
}

export function getPriceForCondition(
  card: PokemonCard,
  condition: CardCondition
): number | null {
  const conditionKey = CONDITION_TO_POKETRACE[condition];
  const prices = card.prices;
  if (!prices) return null;

  // Prefer TCGPlayer, fall back to eBay
  const directPrice =
    prices.tcgplayer?.[conditionKey]?.avg ??
    prices.ebay?.[conditionKey]?.avg ??
    null;

  if (directPrice != null) {
    return Math.round(directPrice * 100) / 100;
  }

  // Fallback: apply multiplier to NM price
  const nmPrice = getNMPrice(card);
  if (nmPrice === null) return null;

  const multiplier = CONDITION_MULTIPLIERS[condition] ?? 1.0;
  return Math.round(nmPrice * multiplier * 100) / 100;
}

export function getBestPrice(card: PokemonCard): number | null {
  return getNMPrice(card);
}

export function getPriceTrend(card: PokemonCard, condition: CardCondition): number | null {
  const conditionKey = CONDITION_TO_POKETRACE[condition];
  const entry = card.prices?.tcgplayer?.[conditionKey] ?? card.prices?.ebay?.[conditionKey];
  if (!entry?.avg || !entry?.avg7d) return null;
  // Positive = price risen vs 7-day average, negative = fallen
  return Math.round((entry.avg - entry.avg7d) * 100) / 100;
}

export function getAffiliateTCGUrl(card: PokemonCard): string {
  const encodedName = encodeURIComponent(card.name);
  return `https://www.tcgplayer.com/search/pokemon/product?q=${encodedName}`;
}

/**
 * Extract graded prices grouped by grader from a card's eBay price data.
 * PokeTrace stores graded prices inline with keys like "PSA_10", "CGC_9", "BGS_9.5".
 */
export function getGradedPricesByGrader(
  card: PokemonCard
): Record<string, Array<{ grade: string; price: PokeTracePrice }>> {
  const ebayPrices = card.prices?.ebay ?? {};
  const result: Record<string, Array<{ grade: string; price: PokeTracePrice }>> = {};

  for (const [key, price] of Object.entries(ebayPrices)) {
    // Grade keys contain an underscore: PSA_10, CGC_9, BGS_9.5
    if (!key.includes('_')) continue;
    const underscoreIdx = key.indexOf('_');
    const grader = key.slice(0, underscoreIdx).toUpperCase();
    const grade = key.slice(underscoreIdx + 1);
    if (!result[grader]) result[grader] = [];
    result[grader].push({ grade, price });
  }

  // Sort each grader's grades descending
  for (const grader of Object.keys(result)) {
    result[grader].sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade));
  }

  return result;
}
