import { useState, useRef, useCallback } from 'react';
import { Camera } from 'react-native-vision-camera';
import { ScannedCard, CardCondition, ScanSession } from '../types';
import { extractCardInfo } from '../services/ocrService';
import { searchCard, searchByNumber } from '../services/pokemonTcgService';
import { getPriceForCondition } from '../services/pricingService';
import { DedupBuffer } from '../utils/dedupBuffer';
import { saveSessions, loadSessions } from '../utils/storage';
import { SCAN_INTERVAL_MS } from '../constants/config';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

const dedupBuffer = new DedupBuffer();

export interface UseScannerReturn {
  cards: ScannedCard[];
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
  cameraRef: React.RefObject<Camera | null>;
  startScanning: () => void;
  stopScanning: () => void;
  addCard: (card: ScannedCard) => void;
  updateCondition: (id: string, condition: CardCondition) => void;
  removeCard: (id: string) => void;
  clearCards: () => void;
  saveSession: (name: string) => Promise<ScanSession>;
}

export function useScanner(): UseScannerReturn {
  const [cards, setCards] = useState<ScannedCard[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<Camera>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  const processFrame = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (!cameraRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setError(null);

    try {
      // takeSnapshot is non-blocking and ~5-10x faster than takePicture.
      // It returns a file path directly usable by ML Kit — no base64 encoding.
      const snapshot = await cameraRef.current.takeSnapshot({
        quality: 60,
      });

      if (!snapshot?.path) return;

      const ocrResult = await extractCardInfo(snapshot.path);

      if (!ocrResult.cardName && !ocrResult.cardNumber) return;

      const dedupKey = `${ocrResult.cardName ?? ''}:${ocrResult.cardNumber ?? ''}`;
      if (dedupBuffer.has(dedupKey)) return;

      let matchedCards: import('../types').PokemonCard[] = [];

      if (ocrResult.cardName && ocrResult.cardNumber) {
        matchedCards = await searchCard(ocrResult.cardName, ocrResult.cardNumber);
      } else if (ocrResult.cardName) {
        matchedCards = await searchCard(ocrResult.cardName);
      } else if (ocrResult.cardNumber && ocrResult.setTotal) {
        matchedCards = await searchByNumber(ocrResult.cardNumber, ocrResult.setTotal);
      }

      if (matchedCards.length === 0) return;

      const pokemonCard = matchedCards[0];
      const defaultCondition: CardCondition = 'NM';
      const price = getPriceForCondition(pokemonCard, defaultCondition);

      const scannedCard: ScannedCard = {
        id: generateId(),
        scanTimestamp: Date.now(),
        card: pokemonCard,
        condition: defaultCondition,
        quantity: 1,
        priceAtCondition: price,
        rawOcrText: ocrResult.rawText,
      };

      dedupBuffer.add(dedupKey);
      setCards((prev) => [scannedCard, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan error occurred';
      setError(message);
      console.error('processFrame error:', err);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, []);

  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) return;
    setIsScanning(true);
    setError(null);
    scanIntervalRef.current = setInterval(processFrame, SCAN_INTERVAL_MS);
  }, [processFrame]);

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
    isProcessingRef.current = false;
    setIsProcessing(false);
  }, []);

  const addCard = useCallback((card: ScannedCard) => {
    setCards((prev) => [card, ...prev]);
  }, []);

  const updateCondition = useCallback((id: string, condition: CardCondition) => {
    setCards((prev) =>
      prev.map((scannedCard) => {
        if (scannedCard.id !== id) return scannedCard;
        const newPrice = getPriceForCondition(scannedCard.card, condition);
        return { ...scannedCard, condition, priceAtCondition: newPrice };
      })
    );
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearCards = useCallback(() => {
    setCards([]);
    dedupBuffer.clear();
  }, []);

  const saveSession = useCallback(
    async (name: string): Promise<ScanSession> => {
      const totalValue = cards.reduce((sum, c) => {
        if (c.priceAtCondition !== null) {
          return sum + c.priceAtCondition * c.quantity;
        }
        return sum;
      }, 0);

      const session: ScanSession = {
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: name.trim() || `Session ${new Date().toLocaleDateString()}`,
        cards: [...cards],
        totalValue: Math.round(totalValue * 100) / 100,
      };

      const existing = await loadSessions();
      const updated = [session, ...existing];
      await saveSessions(updated);

      return session;
    },
    [cards]
  );

  return {
    cards,
    isScanning,
    isProcessing,
    error,
    cameraRef,
    startScanning,
    stopScanning,
    addCard,
    updateCondition,
    removeCard,
    clearCards,
    saveSession,
  };
}
