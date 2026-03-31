import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PokemonCard, ScrydexGradedPrice } from '../types';

interface GradedPricesPanelProps {
  card: PokemonCard;
  visible: boolean;
}

const GRADER_ORDER = ['PSA', 'CGC', 'BGS'];

const GradedPricesPanel: React.FC<GradedPricesPanelProps> = ({ card, visible }) => {
  if (!visible || !card.prices?.graded) {
    return null;
  }

  const graded = card.prices.graded;
  const availableGraders = GRADER_ORDER.filter((g) => {
    const key = g.toLowerCase();
    return graded[key] && Object.keys(graded[key]).length > 0;
  });

  // Also include any graders not in our predefined order
  const allGraderKeys = Object.keys(graded);
  const extraGraders = allGraderKeys.filter(
    (k) => !GRADER_ORDER.map((g) => g.toLowerCase()).includes(k) && Object.keys(graded[k]).length > 0
  );

  const allGraders = [
    ...availableGraders.map((g) => g.toLowerCase()),
    ...extraGraders,
  ];

  if (allGraders.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Graded Prices</Text>
        <Text style={styles.noData}>No graded price data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Graded Prices</Text>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {allGraders.map((graderKey) => {
          const graderData = graded[graderKey];
          if (!graderData) return null;

          const gradeKeys = Object.keys(graderData).sort(
            (a, b) => parseFloat(b) - parseFloat(a)
          );

          return (
            <View key={graderKey} style={styles.graderSection}>
              <Text style={styles.graderHeader}>{graderKey.toUpperCase()}</Text>
              {gradeKeys.map((gradeKey) => {
                const priceData: ScrydexGradedPrice = graderData[gradeKey];
                return (
                  <View key={gradeKey} style={styles.gradeRow}>
                    <Text style={styles.gradeLabel}>Grade {priceData.grade || gradeKey}</Text>
                    <Text style={styles.gradePrice}>
                      {priceData.market != null
                        ? `$${priceData.market.toFixed(2)}`
                        : 'N/A'}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  scrollView: {
    maxHeight: 200,
  },
  graderSection: {
    marginBottom: 10,
  },
  graderHeader: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gradeLabel: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
  gradePrice: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  noData: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default GradedPricesPanel;
