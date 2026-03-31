/**
 * COPY THIS FILE TO config.ts AND FILL IN YOUR KEYS.
 * config.ts is gitignored to protect secrets.
 *
 *   cp src/constants/config.example.ts src/constants/config.ts
 */

export const POKEMON_TCG_API_BASE = 'https://api.scrydex.com/pokemon/v1';
export const GOOGLE_VISION_API_BASE = 'https://vision.googleapis.com/v1';

// Get both from scrydex.com → Dashboard
export const POKEMON_TCG_API_KEY = '';
export const SCRYDEX_TEAM_ID = '';

// Google Cloud Vision — only needed if you re-enable cloud OCR (not required by default)
export const GOOGLE_CLOUD_VISION_API_KEY = '';

export const SCAN_INTERVAL_MS = 600;
export const DEDUP_WINDOW_MS = 8000;
export const MAX_SESSION_HISTORY = 20;

export const CONDITION_MULTIPLIERS: Record<string, number> = {
  NM: 1.0,
  LP: 0.8,
  MP: 0.64,
  HP: 0.4,
  DMG: 0.25,
};

export const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const;

// eBay Browse API — https://developer.ebay.com
export const EBAY_APP_ID = '';
export const EBAY_API_BASE = 'https://api.ebay.com/buy/browse/v1';
export const EBAY_DEMO_MODE = true; // set false once EBAY_APP_ID is filled
