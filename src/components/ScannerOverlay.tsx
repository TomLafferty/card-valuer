import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const FRAME_WIDTH = 220;
const FRAME_HEIGHT = 308; // Portrait — matches Pokemon card ratio (63mm × 88mm ≈ 5:7)
const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;

interface ScannerOverlayProps {
  isScanning: boolean;
  isProcessing: boolean;
  cardCount: number;
  lastDetected: string | null;
  onToggleScan: () => void;
  onSaveSession: () => void;
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  isScanning,
  isProcessing,
  cardCount,
  lastDetected,
  onToggleScan,
  onSaveSession,
}) => {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const scanLineOpacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isScanning) {
      scanLineOpacity.setValue(1);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, {
            toValue: FRAME_HEIGHT - 2,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current = loop;
      loop.start();
    } else {
      animationRef.current?.stop();
      Animated.timing(scanLineOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      scanLineY.setValue(0);
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [isScanning, scanLineY, scanLineOpacity]);

  const statusText = isProcessing
    ? 'Processing...'
    : lastDetected
    ? `Found: ${lastDetected}`
    : isScanning
    ? 'Scanning...'
    : 'Tap to scan';

  const statusColor = lastDetected ? '#4CAF50' : isProcessing ? '#FFC107' : '#ffffff';

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dark vignette around the scan frame */}
      <View style={styles.vignetteTop} />
      <View style={styles.vignetteMiddleRow} pointerEvents="box-none">
        <View style={styles.vignetteSide} />

        {/* Scan frame */}
        <View style={styles.frame}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                opacity: scanLineOpacity,
                transform: [{ translateY: scanLineY }],
              },
            ]}
          />
        </View>

        <View style={styles.vignetteSide} />
      </View>
      <View style={styles.vignetteBottom} />

      {/* Status text */}
      <View style={styles.statusContainer} pointerEvents="none">
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <Pressable
          style={[styles.actionButton, isScanning ? styles.stopButton : styles.startButton]}
          onPress={onToggleScan}
          accessibilityLabel={isScanning ? 'Stop scanning' : 'Start scanning'}
        >
          <Text style={styles.actionButtonText}>
            {isScanning ? '⏹ Stop' : '▶ Scan'}
          </Text>
        </Pressable>

        <View style={styles.badgeContainer} pointerEvents="none">
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cardCount}</Text>
          </View>
          <Text style={styles.badgeLabel}>cards</Text>
        </View>

        <Pressable
          style={[styles.actionButton, styles.saveButton]}
          onPress={onSaveSession}
          disabled={cardCount === 0}
          accessibilityLabel="Save session"
        >
          <Text style={[styles.actionButtonText, cardCount === 0 && styles.disabledText]}>
            💾 Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDE_WIDTH = (SCREEN_WIDTH - FRAME_WIDTH) / 2;
const VIGNETTE_TOP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.30);
const FRAME_BOTTOM = VIGNETTE_TOP_HEIGHT + FRAME_HEIGHT;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: VIGNETTE_TOP_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  vignetteMiddleRow: {
    position: 'absolute',
    flexDirection: 'row',
    top: VIGNETTE_TOP_HEIGHT,
    left: 0,
    right: 0,
    height: FRAME_HEIGHT,
  },
  vignetteSide: {
    width: SIDE_WIDTH,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  vignetteBottom: {
    position: 'absolute',
    top: FRAME_BOTTOM,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: '#E53935',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContainer: {
    position: 'absolute',
    top: FRAME_BOTTOM + 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  actionButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 100,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#E53935',
  },
  stopButton: {
    backgroundColor: '#555',
  },
  saveButton: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  disabledText: {
    color: '#555',
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#E53935',
    borderRadius: 16,
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  badgeLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
});

export default ScannerOverlay;
