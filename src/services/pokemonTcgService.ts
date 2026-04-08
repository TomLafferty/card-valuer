import { POKETRACE_API_BASE, POKETRACE_API_KEY } from '../constants/config';
import { PokemonCard, PokeTracePrices } from '../types';

interface PokeTraceCard {
  id: string;
  name: string;
  cardNumber: string;
  set: { slug: string; name: string };
  variant?: string;
  rarity?: string;
  market?: string;
  currency?: string;
  prices?: Record<string, Record<string, { avg: number; low: number; high: number; saleCount?: number }>>;
  lastUpdated?: string;
}

interface PokeTraceListResponse {
  data: PokeTraceCard[];
  pagination?: { hasMore: boolean; nextCursor?: string; count: number };
}

interface PokeTraceSingleResponse {
  data: PokeTraceCard;
}

const cache = new Map<string, PokemonCard[]>();
const singleCache = new Map<string, PokemonCard | null>();

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (POKETRACE_API_KEY) {
    headers['X-API-Key'] = POKETRACE_API_KEY;
  }
  return headers;
}

function toPokemonCard(raw: PokeTraceCard): PokemonCard {
  // cardNumber may be "004/102" — extract just the card number portion
  const numberParts = raw.cardNumber?.split('/');
  const number = numberParts?.[0]?.replace(/^0+/, '') || raw.cardNumber || '';

  const prices: PokeTracePrices = {};
  if (raw.prices?.ebay) prices.ebay = raw.prices.ebay;
  if (raw.prices?.tcgplayer) prices.tcgplayer = raw.prices.tcgplayer;
  if (raw.prices?.cardmarket) prices.cardmarket = raw.prices.cardmarket;

  return {
    id: raw.id,
    name: raw.name,
    number,
    set: {
      id: raw.set.slug,
      name: raw.set.name,
    },
    rarity: raw.rarity,
    images: { small: '', large: '' },
    prices,
  };
}

async function pokeTraceGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`PokeTrace API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function searchCard(name: string, number?: string): Promise<PokemonCard[]> {
  const cacheKey = `search:${name}:${number ?? ''}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const params = new URLSearchParams({ search: name, market: 'US', limit: '10' });
  const url = `${POKETRACE_API_BASE}/cards?${params}`;

  try {
    const data = await pokeTraceGet<PokeTraceListResponse>(url);
    let cards = (data.data ?? []).map(toPokemonCard);

    // Filter by card number if provided
    if (number && cards.length > 1) {
      const filtered = cards.filter((c) => c.number === number || c.number === number.replace(/^0+/, ''));
      if (filtered.length > 0) cards = filtered;
    }

    cache.set(cacheKey, cards);
    return cards;
  } catch (error) {
    console.error('searchCard error:', error);
    return [];
  }
}

export async function getCardById(id: string): Promise<PokemonCard | null> {
  if (singleCache.has(id)) return singleCache.get(id)!;

  try {
    const data = await pokeTraceGet<PokeTraceSingleResponse>(
      `${POKETRACE_API_BASE}/cards/${id}`
    );
    const card = data.data ? toPokemonCard(data.data) : null;
    singleCache.set(id, card);
    return card;
  } catch (error) {
    console.error('getCardById error:', error);
    singleCache.set(id, null);
    return null;
  }
}

export async function searchByNumber(number: string, setTotal: string): Promise<PokemonCard[]> {
  const cacheKey = `byNumber:${number}:${setTotal}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  // PokeTrace searches by name — use number as search term and filter by matching set size
  try {
    const params = new URLSearchParams({ search: number, market: 'US', limit: '20' });
    const data = await pokeTraceGet<PokeTraceListResponse>(
      `${POKETRACE_API_BASE}/cards?${params}`
    );
    const cards = (data.data ?? []).map(toPokemonCard);
    cache.set(cacheKey, cards);
    return cards;
  } catch (error) {
    console.error('searchByNumber error:', error);
    return [];
  }
}

export function clearCache(): void {
  cache.clear();
  singleCache.clear();
}
