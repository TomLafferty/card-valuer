import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

// Barcodes are landscape — wider than tall
const FRAME_WIDTH = 290;
const FRAME_HEIGHT = 110;
const CORNER_SIZE = 18;
const CORNER_THICKNESS = 3;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDE_WIDTH = (SCREEN_WIDTH - FRAME_WIDTH) / 2;

// Vertically position the barcode zone at ~38% down — above center,
// leaving room for the bottom panel and mode toggle
const FRAME_TOP = Math.round(SCREEN_HEIGHT * 0.32);
const FRAME_BOTTOM = FRAME_TOP + FRAME_HEIGHT;

interface SlabScannerOverlayProps {
  isProcessing: boolean;
  slabCount: number;
  lastDetected: string | null;
}

const SlabScannerOverlay: React.FC<SlabScannerOverlayProps> = ({
  isProcessing,
  slabCount,
  lastDetected,
}) => {
  const scanLineX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Horizontal scan line — sweeps left to right (suits barcode scanning)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineX, {
          toValue: FRAME_WIDTH - 2,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current = loop;
    loop.start();
    return () => animationRef.current?.stop();
  }, [scanLineX]);

  const statusText = isProcessing
    ? 'Looking up slab...'
    : lastDetected
    ? `Found: ${lastDetected}`
    : 'Align barcode in frame';

  const statusColor = lastDetected ? '#4CAF50' : isProcessing ? '#FFC107' : '#aaaaaa';

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Vignette — top */}
      <View style={styles.vignetteTop} />

      {/* Vignette — middle row (sides only, frame is clear) */}
      <View style={styles.vignetteMiddleRow}>
        <View style={styles.vignetteSide} />

        {/* Scan frame */}
        <View style={styles.frame}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Horizontal scan line */}
          {!isProcessing && (
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateX: scanLineX }] },
              ]}
            />
          )}

          {/* Processing spinner inside frame */}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="#FFC107" size="small" />
            </View>
          )}
        </View>

        <View style={styles.vignetteSide} />
      </View>

      {/* Vignette — bottom */}
      <View style={styles.vignetteBottom} />

      {/* Label above frame */}
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>SLAB BARCODE</Text>
      </View>

      {/* Status text below frame */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>

      {/* Slab count badge — top right */}
      <View style={styles.countBadge}>
        <Text style={styles.countNumber}>{slabCount}</Text>
        <Text style={styles.countLabel}>slabs</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: FRAME_TOP,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  vignetteMiddleRow: {
    position: 'absolute',
    top: FRAME_TOP,
    left: 0,
    right: 0,
    height: FRAME_HEIGHT,
    flexDirection: 'row',
  },
  vignetteSide: {
    width: SIDE_WIDTH,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  vignetteBottom: {
    position: 'absolute',
    top: FRAME_BOTTOM,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#ffffff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 3,
  },
  scanLine: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: '#E53935',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  processingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    top: FRAME_TOP - 26,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  labelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statusContainer: {
    position: 'absolute',
    top: FRAME_BOTTOM + 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  countBadge: {
    position: 'absolute',
    top: 56,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,26,0.85)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  countNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  countLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SlabScannerOverlay;
