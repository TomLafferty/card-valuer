/**
 * COPY THIS FILE TO config.ts AND FILL IN YOUR KEYS.
 * config.ts is gitignored — never commit real API keys.
 *
 *   cp src/constants/config.example.ts src/constants/config.ts
 */

// PokeTrace API — https://poketrace.com/developers
export const POKETRACE_API_BASE = 'https://api.poketrace.com/v1';
export const POKETRACE_API_KEY = ''; // X-API-Key header

export const SCAN_INTERVAL_MS = 600;
export const DEDUP_WINDOW_MS = 8000;
export const MAX_SESSION_HISTORY = 20;

// Fallback condition price multipliers (applied when per-condition price unavailable)
export const CONDITION_MULTIPLIERS: Record<string, number> = {
  NM: 1.0,
  LP: 0.8,
  MP: 0.64,
  HP: 0.4,
  DMG: 0.25,
};

export const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;

// eBay Browse API — https://developer.ebay.com (optional, demo mode used when empty)
export const EBAY_APP_ID = '';
export const EBAY_API_BASE = 'https://api.ebay.com/buy/browse/v1';
export const EBAY_DEMO_MODE = true; // set false once EBAY_APP_ID is filled
