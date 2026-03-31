import { CardCondition, EbayComps, EbaySoldListing } from '../types';
import { EBAY_APP_ID, EBAY_API_BASE, EBAY_DEMO_MODE } from '../constants/config';

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface CacheEntry {
  data: EbayComps;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

function makeCacheKey(cardName: string, setName: string, condition: CardCondition): string {
  return `${cardName}|${setName}|${condition}`.toLowerCase();
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function generateMockListings(
  cardName: string,
  setName: string,
  condition: CardCondition,
  basePrice: number
): EbaySoldListing[] {
  const conditionLabels: Record<string, string> = {
    NM: 'Near Mint',
    LP: 'Lightly Played',
    MP: 'Moderately Played',
    HP: 'Heavily Played',
    DMG: 'Damaged',
  };

  const conditionLabel = conditionLabels[condition] ?? condition;

  const suffixes = [
    'PSA Raw',
    'Ungraded',
    'Pack Fresh',
    'Raw Ungraded',
    'Direct',
  ];

  const listings: EbaySoldListing[] = [];

  for (let i = 0; i < 5; i++) {
    const priceFactor = randomBetween(0.8, 1.2);
    const soldPrice = Math.round(basePrice * priceFactor * 100) / 100;
    const daysAgo = Math.floor(randomBetween(1, 30));
    const suffix = suffixes[i % suffixes.length];

    listings.push({
      title: `Pokemon ${cardName} ${setName} ${conditionLabel} ${suffix}`,
      soldPrice,
      soldDate: formatDate(daysAgo),
      condition: conditionLabel,
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(
        `${cardName} pokemon ${setName}`
      )}&LH_Sold=1&LH_Complete=1`,
    });
  }

  return listings;
}

async function fetchRealEbayComps(
  cardName: string,
  setName: string
): Promise<EbaySoldListing[]> {
  const query = encodeURIComponent(`${cardName} pokemon ${setName}`);
  const url = `${EBAY_API_BASE}/item_summary/search?q=${query}&filter=buyingOptions:{FIXED_PRICE},conditions:{USED}&limit=5`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${EBAY_APP_ID}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.status}`);
  }

  const data = await response.json();
  const items = data.itemSummaries ?? [];

  return items.map((item: any) => ({
    title: item.title ?? '',
    soldPrice: parseFloat(item.price?.value ?? '0'),
    soldDate: item.itemEndDate ? item.itemEndDate.split('T')[0] : formatDate(7),
    condition: item.condition ?? 'Used',
    url: item.itemWebUrl ?? '',
  }));
}

export async function getEbayComps(
  cardName: string,
  setName: string,
  condition: CardCondition
): Promise<EbayComps> {
  const key = makeCacheKey(cardName, setName, condition);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  let listings: EbaySoldListing[];

  if (EBAY_DEMO_MODE || !EBAY_APP_ID) {
    const basePrice = 12.5;
    listings = generateMockListings(cardName, setName, condition, basePrice);
  } else {
    try {
      listings = await fetchRealEbayComps(cardName, setName);
    } catch (err) {
      console.warn('eBay API fetch failed, falling back to mock data:', err);
      listings = generateMockListings(cardName, setName, condition, 12.5);
    }
  }

  const averageSold =
    listings.length > 0
      ? Math.round(
          (listings.reduce((sum, l) => sum + l.soldPrice, 0) / listings.length) * 100
        ) / 100
      : 0;

  const result: EbayComps = {
    averageSold,
    recentListings: listings,
    fetchedAt: now,
  };

  cache.set(key, { data: result, cachedAt: now });

  return result;
}

export function clearEbayCache(): void {
  cache.clear();
}
