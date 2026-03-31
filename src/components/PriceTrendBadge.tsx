import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface PriceTrendBadgeProps {
  trend: number | null;
  style?: ViewStyle;
}

const PriceTrendBadge: React.FC<PriceTrendBadgeProps> = ({ trend, style }) => {
  if (trend === null) {
    return null;
  }

  if (trend === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.flat}>— flat</Text>
      </View>
    );
  }

  if (trend > 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.up}>▲ ${trend.toFixed(2)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.down}>▼ ${Math.abs(trend).toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  up: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '600',
  },
  down: {
    color: '#E53935',
    fontSize: 10,
    fontWeight: '600',
  },
  flat: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default PriceTrendBadge;
