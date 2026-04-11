import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PokemonCard } from '../types';
import { getGradedPricesByGrader } from '../services/pricingService';

interface GradedPricesPanelProps {
  card: PokemonCard;
  visible: boolean;
}

const GRADER_ORDER = ['PSA', 'CGC', 'BGS', 'SGC', 'TAG'];

const GradedPricesPanel: React.FC<GradedPricesPanelProps> = ({ card, visible }) => {
  if (!visible) return null;

  const gradedByGrader = getGradedPricesByGrader(card);
  const availableGraders = [
    ...GRADER_ORDER.filter((g) => gradedByGrader[g]?.length > 0),
    ...Object.keys(gradedByGrader).filter((g) => !GRADER_ORDER.includes(g)),
  ];

  if (availableGraders.length === 0) {
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
        {availableGraders.map((grader) => (
          <View key={grader} style={styles.graderSection}>
            <Text style={styles.graderHeader}>{grader}</Text>
            {gradedByGrader[grader].map(({ grade, price }) => (
              <View key={grade} style={styles.gradeRow}>
                <Text style={styles.gradeLabel}>Grade {grade}</Text>
                <Text style={styles.gradePrice}>
                  {price.avg != null ? `$${price.avg.toFixed(2)}` : 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        ))}
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
  scrollView: { maxHeight: 200 },
  graderSection: { marginBottom: 10 },
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
  gradeLabel: { color: '#ccc', fontSize: 12, fontWeight: '500' },
  gradePrice: { color: '#4CAF50', fontSize: 13, fontWeight: '700' },
  noData: { color: '#666', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});

export default GradedPricesPanel;
