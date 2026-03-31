import { PokemonCard, CardCondition, ScrydexCondition, ScrydexRawPrices } from '../types';
import { CONDITION_MULTIPLIERS } from '../constants/config';

// Map our UI condition names to Scrydex API condition keys
const CONDITION_TO_SCRYDEX: Record<CardCondition, ScrydexCondition> = {
  NM: 'NM',
  LP: 'LP',
  MP: 'MP',
  HP: 'HP',
  DMG: 'DM',
};

function getNMMarketPrice(raw: ScrydexRawPrices): number | null {
  return raw.NM?.market ?? null;
}

export function getPriceForCondition(
  card: PokemonCard,
  condition: CardCondition
): number | null {
  const raw = card.prices?.raw;
  if (!raw) return null;

  const scrydexCondition = CONDITION_TO_SCRYDEX[condition];

  // Use direct per-condition market price if available
  const directPrice = raw[scrydexCondition]?.market;
  if (directPrice != null) {
    return Math.round(directPrice * 100) / 100;
  }

  // Fallback: apply multiplier to NM market price
  const nmPrice = getNMMarketPrice(raw);
  if (nmPrice === null) return null;

  const multiplier = CONDITION_MULTIPLIERS[condition] ?? 1.0;
  return Math.round(nmPrice * multiplier * 100) / 100;
}

export function getBestPrice(card: PokemonCard): number | null {
  const raw = card.prices?.raw;
  if (!raw) return null;
  return getNMMarketPrice(raw);
}

export function getPriceTrend(card: PokemonCard, condition: CardCondition): number | null {
  const raw = card.prices?.raw;
  if (!raw) return null;
  const scrydexCondition = CONDITION_TO_SCRYDEX[condition];
  return raw[scrydexCondition]?.trends?.['7d'] ?? null;
}

export function getAffiliateTCGUrl(card: PokemonCard): string {
  const encodedName = encodeURIComponent(card.name);
  return `https://www.tcgplayer.com/search/pokemon/product?q=${encodedName}`;
}
