import { POKEMON_TCG_API_BASE, POKEMON_TCG_API_KEY, SCRYDEX_TEAM_ID } from '../constants/config';
import { PokemonCard } from '../types';

interface ScrydexApiResponse {
  data: PokemonCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

interface ScrydexSingleResponse {
  data: PokemonCard;
}

const cache = new Map<string, PokemonCard[]>();
const singleCache = new Map<string, PokemonCard | null>();

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = POKEMON_TCG_API_KEY;
  }
  if (SCRYDEX_TEAM_ID) {
    headers['X-Team-ID'] = SCRYDEX_TEAM_ID;
  }
  return headers;
}

function buildUrl(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ include: 'prices', ...params }).toString();
  return `${POKEMON_TCG_API_BASE}${path}?${qs}`;
}

async function scrydexGet<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`Scrydex API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function searchCard(name: string, number?: string): Promise<PokemonCard[]> {
  const cacheKey = `search:${name}:${number ?? ''}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  let query = `name:"${name}"`;
  if (number) query += ` number:"${number}"`;

  try {
    const data = await scrydexGet<ScrydexApiResponse>(
      buildUrl('/cards', { q: query, pageSize: '10' })
    );
    const cards = data.data ?? [];
    cache.set(cacheKey, cards);
    return cards;
  } catch (error) {
    console.error('searchCard error:', error);

    // Fallback: name only
    if (number) {
      try {
        const fallback = await scrydexGet<ScrydexApiResponse>(
          buildUrl('/cards', { q: `name:"${name}"`, pageSize: '10' })
        );
        const cards = fallback.data ?? [];
        cache.set(cacheKey, cards);
        return cards;
      } catch (fallbackError) {
        console.error('searchCard fallback error:', fallbackError);
      }
    }
    return [];
  }
}

export async function getCardById(id: string): Promise<PokemonCard | null> {
  if (singleCache.has(id)) return singleCache.get(id)!;

  try {
    const data = await scrydexGet<ScrydexSingleResponse>(
      buildUrl(`/cards/${id}`, {})
    );
    const card = data.data ?? null;
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

  try {
    const data = await scrydexGet<ScrydexApiResponse>(
      buildUrl('/cards', { q: `number:"${number}"`, pageSize: '20' })
    );
    const allCards = data.data ?? [];
    const filtered = allCards.filter(
      (card) =>
        String(card.set.printedTotal) === setTotal ||
        String(card.set.total) === setTotal
    );
    const results = filtered.length > 0 ? filtered : allCards;
    cache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('searchByNumber error:', error);
    return [];
  }
}

export function clearCache(): void {
  cache.clear();
  singleCache.clear();
}
