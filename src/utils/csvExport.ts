import {
  cacheDirectory,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ScanSession } from '../types';

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportSessionToCSV(session: ScanSession): Promise<void> {
  const headers = [
    'Card Name',
    'Set',
    'Number',
    'Condition',
    'Quantity',
    'Price Each',
    'Total Value',
  ];

  const rows = session.cards.map((scannedCard) => {
    const { card, condition, quantity, priceAtCondition } = scannedCard;
    const priceEach = priceAtCondition !== null ? priceAtCondition.toFixed(2) : '';
    const totalValue =
      priceAtCondition !== null ? (priceAtCondition * quantity).toFixed(2) : '';

    return [
      escapeCsvField(card.name),
      escapeCsvField(card.set.name),
      escapeCsvField(card.number),
      escapeCsvField(condition),
      escapeCsvField(quantity),
      escapeCsvField(priceEach),
      escapeCsvField(totalValue),
    ].join(',');
  });

  const csvContent = [headers.map(escapeCsvField).join(','), ...rows].join('\n');

  const safeSessionName = session.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeSessionName}_${Date.now()}.csv`;
  const filePath = `${cacheDirectory ?? ''}${fileName}`;

  await writeAsStringAsync(filePath, csvContent, {
    encoding: EncodingType.UTF8,
  });

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (!isSharingAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(filePath, {
    mimeType: 'text/csv',
    dialogTitle: `Export ${session.name}`,
    UTI: 'public.comma-separated-values-text',
  });
}
