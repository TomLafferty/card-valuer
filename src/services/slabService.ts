import { SlabGrader, ScannedSlab, PokeTraceGradedPrice } from '../types';
import { POKETRACE_API_BASE, POKETRACE_API_KEY } from '../constants/config';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

/**
 * Attempt to identify the grader and cert number from a scanned barcode value.
 *
 * PSA:  typically 8 pure digits, e.g. "12345678"
 * CGC:  typically contains dashes, e.g. "1234567890" or "123-456-789-0"
 * BGS:  similar to PSA but often prefixed, Beckett uses numeric IDs
 * SGC:  numeric, sometimes shorter
 * TAG:  numeric
 */
export function parseCertBarcode(
  barcodeValue: string
): { grader: SlabGrader; certNumber: string } | null {
  if (!barcodeValue || barcodeValue.trim().length === 0) return null;

  const trimmed = barcodeValue.trim();

  if (/^\d{4,}-\d/.test(trimmed) || /\d-\d{4,}-\d/.test(trimmed)) {
    const certNumber = trimmed.replace(/[^0-9]/g, '');
    return { grader: 'CGC', certNumber };
  }

  if (/^TAG\d+/i.test(trimmed)) {
    const certNumber = trimmed.replace(/^TAG/i, '').replace(/\D/g, '');
    return { grader: 'TAG', certNumber };
  }

  if (/^BGS\d+/i.test(trimmed)) {
    const certNumber = trimmed.replace(/^BGS/i, '').replace(/\D/g, '');
    return { grader: 'BGS', certNumber };
  }

  if (/^SGC\d+/i.test(trimmed)) {
    const certNumber = trimmed.replace(/^SGC/i, '').replace(/\D/g, '');
    return { grader: 'SGC', certNumber };
  }

  if (/^\d{6,12}$/.test(trimmed)) {
    return { grader: 'PSA', certNumber: trimmed };
  }

  if (/[a-zA-Z]/.test(trimmed)) return null;

  if (/^\d+$/.test(trimmed)) {
    return { grader: 'PSA', certNumber: trimmed };
  }

  return null;
}

/**
 * Looks up graded price data from PokeTrace for a given cert/grader.
 * PokeTrace stores graded prices inline in card price data with keys like "PSA_10".
 * This does a best-effort name search and extracts the matching grader's top grade price.
 */
async function fetchGradedPrice(
  certNumber: string,
  grader: SlabGrader
): Promise<{ cardName: string | null; grade: string | null; gradedPrice: PokeTraceGradedPrice | null }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (POKETRACE_API_KEY) headers['X-API-Key'] = POKETRACE_API_KEY;

    // PokeTrace has no cert-number lookup — search by cert as a keyword (best effort)
    const params = new URLSearchParams({ search: certNumber, market: 'US', limit: '1' });
    const response = await fetch(`${POKETRACE_API_BASE}/cards?${params}`, { headers });

    if (!response.ok) return { cardName: null, grade: null, gradedPrice: null };

    const data = await response.json();
    const card = data.data?.[0];
    if (!card) return { cardName: null, grade: null, gradedPrice: null };

    const ebayPrices = card.prices?.ebay ?? {};
    const graderPrefix = grader.toUpperCase() + '_';

    // Find all keys for this grader (e.g. PSA_10, PSA_9)
    const gradeEntries = Object.entries(ebayPrices)
      .filter(([key]) => key.startsWith(graderPrefix))
      .map(([key, price]) => ({
        grade: key.slice(graderPrefix.length),
        price: price as { avg: number; low: number; high: number; saleCount?: number },
      }))
      .sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade));

    if (gradeEntries.length === 0) {
      return { cardName: card.name ?? null, grade: null, gradedPrice: null };
    }

    const top = gradeEntries[0];
    const gradedPrice: PokeTraceGradedPrice = {
      avg: top.price.avg,
      low: top.price.low,
      high: top.price.high,
      saleCount: top.price.saleCount,
      grader: grader,
      grade: top.grade,
    };

    return { cardName: card.name ?? null, grade: top.grade, gradedPrice };
  } catch (err) {
    console.warn('PokeTrace graded lookup failed:', err);
    return { cardName: null, grade: null, gradedPrice: null };
  }
}

export async function lookupSlabCard(
  certNumber: string,
  grader: SlabGrader
): Promise<ScannedSlab> {
  const { cardName, grade, gradedPrice } = await fetchGradedPrice(certNumber, grader);

  return {
    id: generateId(),
    scanTimestamp: Date.now(),
    certNumber,
    grader,
    cardName,
    grade,
    card: null,
    gradedPrice,
  };
}
