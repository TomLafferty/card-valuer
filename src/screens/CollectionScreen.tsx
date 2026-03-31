import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { loadSessions } from '../utils/storage';
import { ScanSession, ScannedCard } from '../types';

const CollectionScreen: React.FC = () => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await loadSessions();
      setSessions(loaded);
    } catch (err) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyTitle}>Start scanning to build your collection</Text>
        <Text style={styles.emptySubtitle}>
          Your portfolio stats will appear here once you save a session.
        </Text>
      </View>
    );
  }

  // Compute stats
  const totalSessions = sessions.length;
  const allCards: ScannedCard[] = sessions.flatMap((s) => s.cards);
  const totalCards = allCards.length;
  const totalValue = sessions.reduce((sum, s) => sum + (s.totalValue ?? 0), 0);
  const averageCardValue = totalCards > 0 ? totalValue / totalCards : 0;

  // Top 5 cards by priceAtCondition — deduplicated by card.id
  const seenCardIds = new Set<string>();
  const topCards: ScannedCard[] = allCards
    .filter((sc) => {
      if (sc.priceAtCondition === null) return false;
      if (seenCardIds.has(sc.card.id)) return false;
      seenCardIds.add(sc.card.id);
      return true;
    })
    .sort((a, b) => (b.priceAtCondition ?? 0) - (a.priceAtCondition ?? 0))
    .slice(0, 5);

  // Value by set
  const valueBySetMap: Record<string, { value: number; count: number }> = {};
  for (const sc of allCards) {
    const setName = sc.card.set.name;
    if (!valueBySetMap[setName]) {
      valueBySetMap[setName] = { value: 0, count: 0 };
    }
    valueBySetMap[setName].value += sc.priceAtCondition ?? 0;
    valueBySetMap[setName].count += 1;
  }
  const valueBySetEntries = Object.entries(valueBySetMap).sort(
    (a, b) => b[1].value - a[1].value
  );

  // Recent sessions — last 3
  const recentSessions = [...sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Collection</Text>
        <Text style={styles.totalValue}>${totalValue.toFixed(2)}</Text>
        <Text style={styles.totalValueLabel}>Total Collection Value</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalCards}</Text>
          <Text style={styles.statLabel}>Total Cards</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>${averageCardValue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Avg Value</Text>
        </View>
      </View>

      {/* Top Cards section */}
      {topCards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Cards</Text>
          <FlatList
            data={topCards}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.topCardsContent}
            renderItem={({ item }) => (
              <View style={styles.topCardItem}>
                <Image
                  source={{ uri: item.card.images.small }}
                  style={styles.topCardImage}
                  contentFit="contain"
                  accessibilityLabel={`${item.card.name} card image`}
                />
                <Text style={styles.topCardName} numberOfLines={2}>
                  {item.card.name}
                </Text>
                <Text style={styles.topCardPrice}>
                  {item.priceAtCondition !== null
                    ? `$${item.priceAtCondition.toFixed(2)}`
                    : 'N/A'}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Value by Set section */}
      {valueBySetEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Value by Set</Text>
          {valueBySetEntries.map(([setName, { value, count }]) => (
            <View key={setName} style={styles.setRow}>
              <View style={styles.setInfo}>
                <Text style={styles.setName} numberOfLines={1}>
                  {setName}
                </Text>
                <Text style={styles.setCount}>{count} card{count !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.setValue}>${value.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Sessions section */}
      {recentSessions.length > 0 && (
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {recentSessions.map((session) => (
            <View key={session.id} style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName} numberOfLines={1}>
                  {session.name}
                </Text>
                <Text style={styles.sessionDate}>{formatDate(session.updatedAt)}</Text>
              </View>
              <View style={styles.sessionRight}>
                <Text style={styles.sessionValue}>${session.totalValue.toFixed(2)}</Text>
                <Text style={styles.sessionCards}>{session.cards.length} cards</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  totalValue: {
    color: '#4CAF50',
    fontSize: 40,
    fontWeight: '800',
  },
  totalValueLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#2a2a2a',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  lastSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  topCardsContent: {
    paddingRight: 8,
  },
  topCardItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 90,
    alignItems: 'center',
  },
  topCardImage: {
    width: 62,
    height: 87,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
    marginBottom: 6,
  },
  topCardName: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 3,
    lineHeight: 13,
  },
  topCardPrice: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  setInfo: {
    flex: 1,
    marginRight: 12,
  },
  setName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  setCount: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  setValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  sessionDate: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  sessionCards: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
});

export default CollectionScreen;
