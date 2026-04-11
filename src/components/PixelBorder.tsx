import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SW } = Dimensions.get('window');

const PIXEL = 6;   // visible block size
const GAP = 1;     // gap between blocks
const STEP = PIXEL + GAP;

// Same Pokemon palette as the intro animation
const BASE = ['#3B6EE8', '#FFCB05', '#224B9E', '#CC0000', '#CC0000', '#1A3BAA'];

interface PixelBorderProps {
  /** Total height of the strip including padding. Defaults to PIXEL + 4. */
  height?: number;
  /** Override screen width if you want a narrower border. */
  width?: number;
  /** Shift the color cycle so adjacent borders on the same screen look varied. */
  colorOffset?: number;
}

const PixelBorder: React.FC<PixelBorderProps> = ({
  height = PIXEL + 4,
  width = SW,
  colorOffset = 0,
}) => {
  const blocks = useMemo(() => {
    const count = Math.ceil(width / STEP) + 1;
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      color: BASE[(i + colorOffset) % BASE.length],
    }));
  }, [width, colorOffset]);

  return (
    <View style={[styles.strip, { height, width }]}>
      {blocks.map(({ key, color }) => (
        <View
          key={key}
          style={[styles.pixel, { backgroundColor: color }]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    gap: GAP,
    paddingHorizontal: GAP,
  },
  pixel: {
    width: PIXEL,
    height: PIXEL,
    flexShrink: 0,
  },
});

export default PixelBorder;
