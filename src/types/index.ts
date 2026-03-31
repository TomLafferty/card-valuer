export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';

// Scrydex API uses 'DM' for damaged — map to/from our UI 'DMG'
export type ScrydexCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'DM';

export interface PriceTrends {
  '1d'?: number;
  '7d'?: number;
  '14d'?: number;
  '30d'?: number;
  '90d'?: number;
  '180d'?: number;
}

export interface ScrydexRawPrice {
  low: number;
  market: number;
  currency: string;
  trends?: PriceTrends;
}

export type ScrydexRawPrices = Partial<Record<ScrydexCondition, ScrydexRawPrice>>;

export interface ScrydexGradedPrice {
  low: number;
  mid: number;
  high: number;
  market: number;
  currency: string;
  grade: string;
  company: string;
  is_perfect?: boolean;
  is_signed?: boolean;
  is_error?: boolean;
}

export interface ScrydexPrices {
  raw?: ScrydexRawPrices;
  graded?: Record<string, Record<string, ScrydexGradedPrice>>;
}

export interface PokemonCard {
  id: string;
  name: string;
  number: string;
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    releaseDate: string;
    images: { symbol: string; logo: string };
  };
  rarity?: string;
  images: { small: string; large: string };
  prices?: ScrydexPrices;
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
  gradedPrice: ScrydexGradedPrice | null;
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
