import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  Platform,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useScannerContext } from '../context/ScannerContext';
import ScannerOverlay from '../components/ScannerOverlay';
import SlabScannerOverlay from '../components/SlabScannerOverlay';
import CardListItem from '../components/CardListItem';
import SlabListItem from '../components/SlabListItem';
import { parseCertBarcode, lookupSlabCard } from '../services/slabService';
import { ScannedCard, ScannedSlab } from '../types';
import PixelBorder from '../components/PixelBorder';

interface ScannerScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

type ScanMode = 'cards' | 'slabs';

const ScannerScreen: React.FC<ScannerScreenProps> = ({ navigation }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('cards');
  const [slabs, setSlabs] = useState<ScannedSlab[]>([]);
  const [slabProcessing, setSlabProcessing] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  const {
    cards,
    isScanning,
    isProcessing,
    cameraRef,
    startScanning,
    stopScanning,
    updateCondition,
    removeCard,
    saveSession,
  } = useScannerContext();

  // Flash the last detected card name
  useEffect(() => {
    if (cards.length > 0 && scanMode === 'cards') {
      setLastDetected(cards[0].card.name);
      const timer = setTimeout(() => setLastDetected(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [cards, scanMode]);

  const handleToggleScan = useCallback(() => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

  const handleSaveSession = useCallback(() => {
    if (cards.length === 0) {
      Alert.alert('No Cards', 'Scan some cards before saving a session.');
      return;
    }
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Save Session',
        'Enter a name for this session:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: async (name?: string) => doSaveSession(name ?? '') },
        ],
        'plain-text',
        `Session ${new Date().toLocaleDateString()}`
      );
    } else {
      setSessionNameInput(`Session ${new Date().toLocaleDateString()}`);
      setSaveModalVisible(true);
    }
  }, [cards.length]);

  const doSaveSession = async (name: string) => {
    try {
      await saveSession(name);
      Alert.alert('Session Saved', `"${name || 'Session'}" saved.`, [
        { text: 'View History', onPress: () => navigation.navigate('History') },
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save session.');
    }
  };

  // Barcode scanner for slab mode — useCodeScanner runs natively, no JS polling
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'code-128', 'code-39', 'ean-13'],
    onCodeScanned: useCallback(
      async (codes) => {
        if (scanMode !== 'slabs') return;
        if (slabProcessing) return;
        const code = codes[0];
        if (!code?.value || code.value === lastScannedBarcode) return;

        setLastScannedBarcode(code.value);
        setSlabProcessing(true);

        const parsed = parseCertBarcode(code.value);
        if (!parsed) {
          setSlabProcessing(false);
          setTimeout(() => setLastScannedBarcode(null), 3000);
          return;
        }

        try {
          const slab = await lookupSlabCard(parsed.certNumber, parsed.grader);
          setSlabs((prev) => [slab, ...prev]);
          setLastDetected(`${parsed.grader} #${parsed.certNumber}`);
          setTimeout(() => setLastDetected(null), 2500);
        } catch (err) {
          console.warn('Slab lookup error:', err);
        } finally {
          setSlabProcessing(false);
          setTimeout(() => setLastScannedBarcode(null), 4000);
        }
      },
      [scanMode, slabProcessing, lastScannedBarcode]
    ),
  });

  const handleRemoveSlab = useCallback((id: string) => {
    setSlabs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // --- Permission states ---
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          To scan Pokemon cards, please grant camera access.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No camera device found.</Text>
      </View>
    );
  }

  const previewCards = cards.slice(0, 3);
  const previewSlabs = slabs.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Full-screen camera — photo:true enables takeSnapshot */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        codeScanner={scanMode === 'slabs' ? codeScanner : undefined}
      />

      {/* Cards mode overlay */}
      {scanMode === 'cards' && (
        <ScannerOverlay
          isScanning={isScanning}
          isProcessing={isProcessing}
          cardCount={cards.length}
          lastDetected={lastDetected}
          onToggleScan={handleToggleScan}
          onSaveSession={handleSaveSession}
        />
      )}

      {/* Slabs mode overlay */}
      {scanMode === 'slabs' && (
        <SlabScannerOverlay
          isProcessing={slabProcessing}
          slabCount={slabs.length}
          lastDetected={lastDetected}
        />
      )}

      {/* Mode toggle */}
      <View style={styles.modeToggleContainer}>
        <Pressable
          style={[styles.modeChip, scanMode === 'cards' && styles.modeChipActive]}
          onPress={() => setScanMode('cards')}
        >
          <Text style={[styles.modeChipText, scanMode === 'cards' && styles.modeChipTextActive]}>
            CARDS
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeChip, scanMode === 'slabs' && styles.modeChipActive]}
          onPress={() => setScanMode('slabs')}
        >
          <Text style={[styles.modeChipText, scanMode === 'slabs' && styles.modeChipTextActive]}>
            SLABS
          </Text>
        </Pressable>
      </View>

      {/* Pixel border — sits on top edge of bottom panel */}
      <View style={styles.pixelBorderRow}>
        <PixelBorder />
      </View>

      {/* Slide-up bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.bottomPanelHeader}>
          {scanMode === 'cards' ? (
            <>
              <Text style={styles.panelTitle}>Recently Scanned</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Session')}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All {cards.length} Cards →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.panelTitle}>Scanned Slabs</Text>
              <Text style={styles.slabCount}>{slabs.length} total</Text>
            </>
          )}
        </View>

        {scanMode === 'cards' ? (
          previewCards.length === 0 ? (
            <View style={styles.emptyPreview}>
              <Text style={styles.emptyPreviewText}>
                Press "Scan" and point camera at a card
              </Text>
            </View>
          ) : (
            <FlatList
              data={previewCards}
              renderItem={({ item }: { item: ScannedCard }) => (
                <CardListItem
                  item={item}
                  onConditionChange={updateCondition}
                  onRemove={removeCard}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.previewList}
            />
          )
        ) : previewSlabs.length === 0 ? (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>
              Point camera at a slab barcode to scan
            </Text>
          </View>
        ) : (
          <FlatList
            data={previewSlabs}
            renderItem={({ item }: { item: ScannedSlab }) => (
              <SlabListItem item={item} onRemove={handleRemoveSlab} />
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.previewList}
          />
        )}
      </View>

      {/* Android save modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Save Session</Text>
            <Text style={styles.modalSubtitle}>Enter a name for this session:</Text>
            <TextInput
              style={styles.modalInput}
              value={sessionNameInput}
              onChangeText={setSessionNameInput}
              placeholder="Session name..."
              placeholderTextColor="#555"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={async () => {
                  setSaveModalVisible(false);
                  await doSaveSession(sessionNameInput);
                }}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  camera: { ...StyleSheet.absoluteFillObject },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  permissionButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  modeToggleContainer: {
    position: 'absolute',
    bottom: 290,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  modeChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26,26,26,0.9)',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    minWidth: 90,
    alignItems: 'center',
  },
  modeChipActive: { backgroundColor: '#E53935', borderColor: '#E53935' },
  modeChipText: { color: '#888', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  modeChipTextActive: { color: '#ffffff' },
  pixelBorderRow: {
    position: 'absolute',
    bottom: 280,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  bottomPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  panelTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  viewAllButton: { paddingVertical: 4, paddingHorizontal: 8 },
  viewAllText: { color: '#E53935', fontSize: 13, fontWeight: '600' },
  slabCount: { color: '#666', fontSize: 13 },
  previewList: { paddingBottom: 4 },
  emptyPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  emptyPreviewText: { color: '#555', fontSize: 13, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 24,
    width: '80%',
    maxWidth: 360,
  },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  modalSubtitle: { color: '#888', fontSize: 13, marginBottom: 14 },
  modalInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    marginBottom: 18,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  modalCancelText: { color: '#888', fontSize: 15, fontWeight: '600' },
  modalSaveButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});

export default ScannerScreen;
