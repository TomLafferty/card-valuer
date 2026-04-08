export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

// PokeTrace condition keys used in API responses
export type PokeTraceConditionKey =
  | 'NEAR_MINT'
  | 'LIGHTLY_PLAYED'
  | 'MODERATELY_PLAYED'
  | 'HEAVILY_PLAYED'
  | 'DAMAGED';

export interface PokeTracePrice {
  avg: number;
  low: number;
  high: number;
  saleCount?: number;
}

// prices.ebay / prices.tcgplayer / prices.cardmarket
// Keys are either condition keys (NEAR_MINT) or grade keys (PSA_10, CGC_9)
export interface PokeTracePrices {
  ebay?: Record<string, PokeTracePrice>;
  tcgplayer?: Record<string, PokeTracePrice>;
  cardmarket?: Record<string, PokeTracePrice>;
}

// Normalised graded price extracted from PokeTrace (e.g. PSA_10 entry)
export interface PokeTraceGradedPrice {
  avg: number;
  low: number;
  high: number;
  saleCount?: number;
  grader: string; // PSA, CGC, BGS, SGC, etc.
  grade: string;  // 10, 9.5, 9, etc.
}

export interface PokemonCard {
  id: string;
  name: string;
  number: string;
  set: {
    id: string;
    name: string;
    series?: string;
    printedTotal?: number;
    total?: number;
    releaseDate?: string;
    images?: { symbol?: string; logo?: string };
  };
  rarity?: string;
  images?: { small?: string; large?: string };
  prices?: PokeTracePrices;
}

export interface ScannedCard {
  id: string;
  scanTimestamp: number;
  card: PokemonCard;
  condition: CardCondition;
  quantity: number;
  priceAtCondition: number | null;
  rawOcrText?: string;
}

export interface ScanSession {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  cards: ScannedCard[];
  totalValue: number;
}

export interface OcrResult {
  cardName: string | null;
  cardNumber: string | null;
  setTotal: string | null;
  rawText: string;
}

// Slab types
export type SlabGrader = 'PSA' | 'CGC' | 'BGS' | 'SGC' | 'TAG';

export interface ScannedSlab {
  id: string;
  scanTimestamp: number;
  certNumber: string;
  grader: SlabGrader;
  cardName: string | null;
  grade: string | null;
  card: PokemonCard | null;
  gradedPrice: PokeTraceGradedPrice | null;
}

// eBay types
export interface EbaySoldListing {
  title: string;
  soldPrice: number;
  soldDate: string;
  condition: string;
  url: string;
}

export interface EbayComps {
  averageSold: number;
  recentListings: EbaySoldListing[];
  fetchedAt: number;
}

// Collection stats
export interface CollectionStats {
  totalCards: number;
  totalSessions: number;
  totalValue: number;
  averageCardValue: number;
  topCards: ScannedCard[];
  valueBySet: Record<string, number>;
  recentActivity: ScanSession[];
}
