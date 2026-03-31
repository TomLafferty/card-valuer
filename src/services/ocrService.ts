/**
 * On-device OCR using @react-native-ml-kit/text-recognition
 *
 * iOS  → Apple Vision framework (native, no internet, ~80-150ms)
 * Android → Google ML Kit (on-device model, ~100-200ms)
 *
 * Falls back to demo mode when imagePath is empty (Expo Go / dev without build).
 */
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { OcrResult } from '../types';

// Words that commonly appear on Pokemon cards but are NOT the card name
const IGNORE_LINES = new Set([
  'basic', 'stage 1', 'stage 2', 'vmax', 'vstar', 'ex', 'gx', 'v',
  'pokémon', 'pokemon', 'trainer', 'supporter', 'item', 'stadium',
  'energy', 'special energy', 'prism star', 'restored',
  'weakness', 'resistance', 'retreat cost', 'evolves from',
  'put this card', 'discard', 'draw', 'attach', 'search',
  'illustrated by', 'illus', '©', 'nintendo', 'gamefreak', 'creatures',
]);

// Lines that are purely noise
const NOISE_PATTERN = /^[\d\s\.\,\!\?\-\/\\]+$/;

/**
 * Given a file path from react-native-vision-camera takeSnapshot,
 * returns parsed card identifiers.
 */
export async function extractCardInfo(imagePath: string): Promise<OcrResult> {
  // Demo mode: no image path means we're in Expo Go without a real build
  if (!imagePath) {
    return {
      cardName: 'Charizard',
      cardNumber: '4',
      setTotal: '102',
      rawText: 'DEMO MODE — build the app with: npx expo run:ios',
    };
  }

  // Ensure file:// prefix
  const uri = imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`;

  try {
    const result = await TextRecognition.recognize(uri);

    // Build full raw text from all blocks
    const rawText = result.blocks.map((b) => b.text).join('\n');

    if (!rawText.trim()) {
      return { cardName: null, cardNumber: null, setTotal: null, rawText: '' };
    }

    // --- Extract card number (e.g. "58/102", "SWSH001") ---
    // Standard numbered card: digits / digits
    const numberMatch = rawText.match(/\b(\d{1,3})\/(\d{1,3})\b/);
    const cardNumber = numberMatch ? numberMatch[1] : null;
    const setTotal = numberMatch ? numberMatch[2] : null;

    // Promo / secret rare patterns like "SWSH001" or "SM001"
    const promoMatch = !numberMatch
      ? rawText.match(/\b([A-Z]{2,4}\d{3})\b/)
      : null;
    const promoNumber = promoMatch ? promoMatch[1] : null;

    // --- Extract card name ---
    // Strategy: collect all text lines, score them, pick the best candidate.
    // The card name is typically:
    //   • One of the first 3 lines of the tallest/largest text block
    //   • Not a short noise word
    //   • Not a numeric-only line
    //   • Not in the ignore set

    const lines: string[] = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 2);

    let cardName: string | null = null;

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Skip pure noise
      if (NOISE_PATTERN.test(line)) continue;

      // Skip card-number patterns
      if (/^\d{1,3}\/\d{1,3}$/.test(line)) continue;

      // Skip HP lines like "HP 120" or "120 HP"
      if (/^(hp\s*\d+|\d+\s*hp)$/i.test(line)) continue;

      // Skip ignore-list words
      if (IGNORE_LINES.has(lower)) continue;

      // Skip very short lines (single letters/symbols)
      if (line.length < 3) continue;

      // Skip lines that are clearly set/copyright info
      if (/^\d{4}/.test(line)) continue; // year lines

      cardName = line;
      break;
    }

    return {
      cardName,
      cardNumber: cardNumber ?? promoNumber,
      setTotal,
      rawText,
    };
  } catch (err) {
    console.error('ML Kit OCR error:', err);
    return { cardName: null, cardNumber: null, setTotal: null, rawText: '' };
  }
}
