import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScannedSlab, SlabGrader } from '../types';

interface SlabListItemProps {
  item: ScannedSlab;
  onRemove: (id: string) => void;
}

const GRADER_COLORS: Record<SlabGrader, string> = {
  PSA: '#1565C0',
  CGC: '#F9A825',
  BGS: '#E65100',
  SGC: '#555555',
  TAG: '#555555',
};

const GRADER_TEXT_COLORS: Record<SlabGrader, string> = {
  PSA: '#ffffff',
  CGC: '#000000',
  BGS: '#ffffff',
  SGC: '#ffffff',
  TAG: '#ffffff',
};

const SlabListItem: React.FC<SlabListItemProps> = ({ item, onRemove }) => {
  const { certNumber, grader, cardName, grade, gradedPrice } = item;

  const badgeColor = GRADER_COLORS[grader] ?? '#555555';
  const badgeTextColor = GRADER_TEXT_COLORS[grader] ?? '#ffffff';

  const formattedPrice =
    gradedPrice?.market != null
      ? `$${gradedPrice.market.toFixed(2)}`
      : null;

  return (
    <View style={styles.container}>
      {/* Left: grader badge */}
      <View style={[styles.graderBadge, { backgroundColor: badgeColor }]}>
        <Text style={[styles.graderText, { color: badgeTextColor }]}>
          {grader}
        </Text>
      </View>

      {/* Middle: cert number, card name, grade */}
      <View style={styles.middleContainer}>
        <Text style={styles.certNumber} numberOfLines={1}>
          #{certNumber}
        </Text>
        <Text style={styles.cardName} numberOfLines={1}>
          {cardName ?? 'Unknown Card'}
        </Text>
        {grade != null && (
          <Text style={styles.gradeLabel}>Grade {grade}</Text>
        )}
      </View>

      {/* Right: price + delete */}
      <View style={styles.rightContainer}>
        {formattedPrice != null ? (
          <Text style={styles.price}>{formattedPrice}</Text>
        ) : (
          <Text style={styles.pendingPrice}>Pending lookup</Text>
        )}
        <Pressable
          onPress={() => onRemove(item.id)}
          style={styles.deleteButton}
          accessibilityLabel={`Remove slab ${certNumber}`}
          hitSlop={8}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  graderBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  graderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  middleContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  certNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardName: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  gradeLabel: {
    color: '#888',
    fontSize: 11,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 68,
    alignSelf: 'stretch',
    paddingVertical: 2,
  },
  price: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '700',
  },
  pendingPrice: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: '#3a1515',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#E53935',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
});

export default SlabListItem;
