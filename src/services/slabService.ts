import { SlabGrader, ScannedSlab, ScrydexGradedPrice } from '../types';
import { POKEMON_TCG_API_BASE, POKEMON_TCG_API_KEY, SCRYDEX_TEAM_ID } from '../constants/config';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Attempt to identify the grader and cert number from a scanned barcode value.
 *
 * PSA:  typically 8 pure digits, e.g. "12345678"
 * CGC:  typically contains dashes, e.g. "1234567890" or "123-456-789-0"
 * BGS:  similar to PSA but often prefixed, Beckett uses numeric IDs
 * SGC:  numeric, sometimes shorter
 * TAG:  numeric
 *
 * Returns null if the value cannot be interpreted as any known format.
 */
export function parseCertBarcode(
  barcodeValue: string
): { grader: SlabGrader; certNumber: string } | null {
  if (!barcodeValue || barcodeValue.trim().length === 0) {
    return null;
  }

  const trimmed = barcodeValue.trim();

  // CGC barcodes often contain dashes in the format XXXXXXXXXX-X or similar
  if (/^\d{4,}-\d/.test(trimmed) || /\d-\d{4,}-\d/.test(trimmed)) {
    // Strip non-digit characters to get canonical cert number
    const certNumber = trimmed.replace(/[^0-9]/g, '');
    return { grader: 'CGC', certNumber };
  }

  // TAG uses "TAG" prefix or 9-digit numeric
  if (/^TAG\d+/i.test(trimmed)) {
    const certNumber = trimmed.replace(/^TAG/i, '').replace(/\D/g, '');
    return { grader: 'TAG', certNumber };
  }

  // BGS uses "BGS" prefix
  if (/^BGS\d+/i.test(trimmed)) {
    const certNumber = trimmed.replace(/^BGS/i, '').replace(/\D/g, '');
    return { grader: 'BGS', certNumber };
  }

  // SGC uses "SGC" prefix
  if (/^SGC\d+/i.test(trimmed)) {
    const certNumber = trimmed.replace(/^SGC/i, '').replace(/\D/g, '');
    return { grader: 'SGC', certNumber };
  }

  // PSA barcodes: pure digits, typically 8 digits
  if (/^\d{6,12}$/.test(trimmed)) {
    return { grader: 'PSA', certNumber: trimmed };
  }

  // Mixed alphanumeric — unknown format, return null
  if (/[a-zA-Z]/.test(trimmed)) {
    return null;
  }

  // Last resort: treat any digit sequence as PSA
  if (/^\d+$/.test(trimmed)) {
    return { grader: 'PSA', certNumber: trimmed };
  }

  return null;
}

/**
 * Attempts to find graded price data from Scrydex for a given grader/cert combo.
 * PSA has no free public cert lookup API, so this tries a best-effort search
 * against the Scrydex API and falls back gracefully.
 */
async function fetchGradedPriceFromScrydex(
  certNumber: string,
  grader: SlabGrader
): Promise<{ cardName: string | null; grade: string | null; gradedPrice: ScrydexGradedPrice | null }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (POKEMON_TCG_API_KEY) {
      headers['X-Api-Key'] = POKEMON_TCG_API_KEY;
    }
    if (SCRYDEX_TEAM_ID) {
      headers['X-Team-ID'] = SCRYDEX_TEAM_ID;
    }

    // Scrydex/Pokemon TCG API doesn't have a cert-number lookup endpoint for MVP.
    // We attempt a search using the cert number as a query — this is unlikely to
    // return useful results but keeps the door open if the API adds cert support.
    const url = `${POKEMON_TCG_API_BASE}/cards?q=cert:${encodeURIComponent(certNumber)}&pageSize=1`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      return { cardName: null, grade: null, gradedPrice: null };
    }

    const data = await response.json();
    const cards = data.data ?? [];

    if (cards.length === 0) {
      return { cardName: null, grade: null, gradedPrice: null };
    }

    const card = cards[0];
    const graderKey = grader.toLowerCase();
    const gradedPrices = card.prices?.graded?.[graderKey] ?? {};
    const gradeKeys = Object.keys(gradedPrices);

    if (gradeKeys.length === 0) {
      return { cardName: card.name ?? null, grade: null, gradedPrice: null };
    }

    // Pick the highest available grade
    gradeKeys.sort((a, b) => parseFloat(b) - parseFloat(a));
    const topGradeKey = gradeKeys[0];
    const gradedPrice: ScrydexGradedPrice = gradedPrices[topGradeKey];

    return {
      cardName: card.name ?? null,
      grade: topGradeKey,
      gradedPrice,
    };
  } catch (err) {
    console.warn('Scrydex graded lookup failed:', err);
    return { cardName: null, grade: null, gradedPrice: null };
  }
}

/**
 * Looks up a slab by cert number and grader. Always returns a ScannedSlab —
 * partial data is returned when lookups fail rather than throwing.
 */
export async function lookupSlabCard(
  certNumber: string,
  grader: SlabGrader
): Promise<ScannedSlab> {
  const id = generateId();
  const scanTimestamp = Date.now();

  const { cardName, grade, gradedPrice } = await fetchGradedPriceFromScrydex(
    certNumber,
    grader
  );

  return {
    id,
    scanTimestamp,
    certNumber,
    grader,
    cardName,
    grade,
    card: null, // Full PokemonCard lookup not supported in MVP cert flow
    gradedPrice,
  };
}
