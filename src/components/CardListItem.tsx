import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ScannedCard, CardCondition } from '../types';
import ConditionPicker from './ConditionPicker';
import PriceTrendBadge from './PriceTrendBadge';
import { getPriceTrend } from '../services/pricingService';

interface CardListItemProps {
  item: ScannedCard;
  onConditionChange: (id: string, condition: CardCondition) => void;
  onRemove: (id: string) => void;
  onViewEbayComps?: (id: string) => void;
}

const CardListItem: React.FC<CardListItemProps> = ({
  item,
  onConditionChange,
  onRemove,
  onViewEbayComps,
}) => {
  const { card, condition, priceAtCondition } = item;

  const formattedPrice =
    priceAtCondition !== null ? `$${priceAtCondition.toFixed(2)}` : 'N/A';

  const trend = getPriceTrend(card, condition);

  return (
    <View style={styles.container}>
      {/* Thumbnail */}
      <Image
        source={{ uri: card.images.small }}
        style={styles.thumbnail}
        contentFit="contain"
        accessibilityLabel={`${card.name} card image`}
      />

      {/* Middle: name, set info, condition picker */}
      <View style={styles.middleContainer}>
        <Text style={styles.cardName} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.setInfo} numberOfLines={1}>
          {card.set.name} · #{card.number}
        </Text>
        <View style={styles.conditionRow}>
          <ConditionPicker
            value={condition}
            onChange={(c) => onConditionChange(item.id, c)}
            compact
          />
        </View>
        {onViewEbayComps && (
          <Pressable
            onPress={() => onViewEbayComps(item.id)}
            style={styles.ebayButton}
            accessibilityLabel={`View eBay comps for ${card.name}`}
            hitSlop={6}
          >
            <Text style={styles.ebayButtonText}>eBay Comps</Text>
          </Pressable>
        )}
      </View>

      {/* Right: price + trend + delete */}
      <View style={styles.rightContainer}>
        <Text
          style={[styles.price, priceAtCondition === null && styles.priceNA]}
        >
          {formattedPrice}
        </Text>
        <PriceTrendBadge trend={trend} style={styles.trendBadge} />
        <Pressable
          onPress={() => onRemove(item.id)}
          style={styles.deleteButton}
          accessibilityLabel={`Remove ${card.name}`}
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
  thumbnail: {
    width: 50,
    height: 70,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
    flexShrink: 0,
  },
  middleContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  cardName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  setInfo: {
    color: '#888',
    fontSize: 11,
    marginBottom: 6,
  },
  conditionRow: {
    flexDirection: 'row',
  },
  ebayButton: {
    marginTop: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  ebayButtonText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 52,
    alignSelf: 'stretch',
    paddingVertical: 2,
  },
  price: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '700',
  },
  priceNA: {
    color: '#666',
  },
  trendBadge: {
    marginTop: 2,
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

export default CardListItem;
