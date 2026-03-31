import axios from 'axios';
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

// Always request prices alongside card data
const BASE_PARAMS = { include: 'prices' };

export async function searchCard(name: string, number?: string): Promise<PokemonCard[]> {
  const cacheKey = `search:${name}:${number ?? ''}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  let query = `name:"${name}"`;
  if (number) {
    query += ` number:"${number}"`;
  }

  try {
    const response = await axios.get<ScrydexApiResponse>(`${POKEMON_TCG_API_BASE}/cards`, {
      params: { ...BASE_PARAMS, q: query, pageSize: 10 },
      headers: buildHeaders(),
    });

    const cards = response.data.data ?? [];
    cache.set(cacheKey, cards);
    return cards;
  } catch (error) {
    console.error('searchCard error:', error);

    // Fallback: drop number, search by name only
    if (number) {
      try {
        const fallbackResponse = await axios.get<ScrydexApiResponse>(
          `${POKEMON_TCG_API_BASE}/cards`,
          {
            params: { ...BASE_PARAMS, q: `name:"${name}"`, pageSize: 10 },
            headers: buildHeaders(),
          }
        );
        const fallbackCards = fallbackResponse.data.data ?? [];
        cache.set(cacheKey, fallbackCards);
        return fallbackCards;
      } catch (fallbackError) {
        console.error('searchCard fallback error:', fallbackError);
        return [];
      }
    }

    return [];
  }
}

export async function getCardById(id: string): Promise<PokemonCard | null> {
  if (singleCache.has(id)) {
    return singleCache.get(id)!;
  }

  try {
    const response = await axios.get<ScrydexSingleResponse>(
      `${POKEMON_TCG_API_BASE}/cards/${id}`,
      {
        params: BASE_PARAMS,
        headers: buildHeaders(),
      }
    );
    const card = response.data.data ?? null;
    singleCache.set(id, card);
    return card;
  } catch (error) {
    console.error('getCardById error:', error);
    singleCache.set(id, null);
    return null;
  }
}

export async function searchByNumber(
  number: string,
  setTotal: string
): Promise<PokemonCard[]> {
  const cacheKey = `byNumber:${number}:${setTotal}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const response = await axios.get<ScrydexApiResponse>(`${POKEMON_TCG_API_BASE}/cards`, {
      params: { ...BASE_PARAMS, q: `number:"${number}"`, pageSize: 20 },
      headers: buildHeaders(),
    });

    const allCards = response.data.data ?? [];

    // Narrow by set total when possible
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
