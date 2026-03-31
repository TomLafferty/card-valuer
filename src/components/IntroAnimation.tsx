import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Animated, Dimensions, StyleSheet, Text } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

const BLOCK_SIZE = 26;       // outer cell size (includes gap)
const INNER_SIZE = 24;       // visible block (1px gap each side)
const RING_DELAY_MS = 38;    // ms between each diamond ring appearing
const HOLD_MS = 520;         // pause once diamond fills screen
const FADE_MS = 380;         // fade-to-black duration

// Grid dimensions — add extra cols/rows to guarantee full screen coverage
const COLS = Math.ceil(SW / BLOCK_SIZE) + 2;
const ROWS = Math.ceil(SH / BLOCK_SIZE) + 2;

// Center of grid
const CC = Math.floor(COLS / 2);
const CR = Math.floor(ROWS / 2);

// Maximum Manhattan distance needed to cover every corner
const MAX_DIST = Math.ceil(Math.abs(0 - CR) + Math.abs(0 - CC)) + 2;

// Pokemon color palette — cycles by ring distance
// Heavier blue weighting: blue → yellow → blue → red → blue → navy, repeat
const RING_COLORS: string[] = [];
const BASE = ['#3B6EE8', '#FFCB05', '#224B9E', '#CC0000', '#CC0000', '#1A3BAA'];
for (let i = 0; i <= MAX_DIST; i++) {
  RING_COLORS.push(BASE[i % BASE.length]);
}

interface Block {
  key: string;
  x: number;
  y: number;
  dist: number;
  color: string;
}

// Offset so grid is visually centered on screen
const GRID_OFFSET_X = (SW - COLS * BLOCK_SIZE) / 2;
const GRID_OFFSET_Y = (SH - ROWS * BLOCK_SIZE) / 2;

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [visibleRing, setVisibleRing] = useState(-1);
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Build block grid once
  const blocks = useMemo<Block[]>(() => {
    const result: Block[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dist = Math.abs(r - CR) + Math.abs(c - CC);
        if (dist > MAX_DIST) continue;
        result.push({
          key: `${r}-${c}`,
          x: GRID_OFFSET_X + c * BLOCK_SIZE + 1,
          y: GRID_OFFSET_Y + r * BLOCK_SIZE + 1,
          dist,
          color: RING_COLORS[dist] ?? '#FFCB05',
        });
      }
    }
    return result;
  }, []);

  useEffect(() => {
    let ring = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const advance = () => {
      setVisibleRing(ring);
      ring++;
      if (ring <= MAX_DIST) {
        timeoutId = setTimeout(advance, RING_DELAY_MS);
      } else {
        // Diamond full — hold, then fade out
        timeoutId = setTimeout(() => {
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: FADE_MS,
            useNativeDriver: true,
          }).start(() => onComplete());
        }, HOLD_MS);
      }
    };

    timeoutId = setTimeout(advance, 80);
    return () => clearTimeout(timeoutId);
  }, [onComplete, screenOpacity]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {blocks.map((block) =>
        block.dist <= visibleRing ? (
          <View
            key={block.key}
            style={[
              styles.block,
              {
                left: block.x,
                top: block.y,
                backgroundColor: block.color,
              },
            ]}
          />
        ) : null
      )}

      {/* App title — fades in once the diamond reaches the edge */}
      {visibleRing >= MAX_DIST - 4 && (
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={styles.titleTop}>CARD</Text>
          <Text style={styles.titleBottom}>VALUER</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
  },
  block: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTop: {
    fontFamily: undefined,  // system font — bold + letter-spacing = retro block feel
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 14,
    color: '#0a0a0a',
    textShadowColor: '#FFCB05',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  titleBottom: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 10,
    color: '#0a0a0a',
    textShadowColor: '#CC0000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginTop: -8,
  },
});

export default IntroAnimation;
