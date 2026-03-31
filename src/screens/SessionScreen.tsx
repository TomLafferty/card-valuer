import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useScannerContext } from '../context/ScannerContext';
import CardListItem from '../components/CardListItem';
import { exportSessionToCSV } from '../utils/csvExport';
import { ScannedCard, EbayComps } from '../types';
import { getEbayComps } from '../services/ebayService';

const SessionScreen: React.FC = () => {
  const { cards, updateCondition, removeCard, clearCards } = useScannerContext();

  const [ebayCardId, setEbayCardId] = useState<string | null>(null);
  const [ebayComps, setEbayComps] = useState<EbayComps | null>(null);
  const [ebayLoading, setEbayLoading] = useState(false);

  const totalValue = cards.reduce((sum, c) => {
    if (c.priceAtCondition !== null) {
      return sum + c.priceAtCondition * c.quantity;
    }
    return sum;
  }, 0);

  const handleExportCSV = useCallback(async () => {
    if (cards.length === 0) {
      Alert.alert('Empty Session', 'Add some cards before exporting.');
      return;
    }

    const tempSession = {
      id: 'export-temp',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: `Session ${new Date().toLocaleDateString()}`,
      cards,
      totalValue: Math.round(totalValue * 100) / 100,
    };

    try {
      await exportSessionToCSV(tempSession);
    } catch (err) {
      Alert.alert('Export Failed', 'Could not export CSV. Please try again.');
    }
  }, [cards, totalValue]);

  const handleClearAll = useCallback(() => {
    if (cards.length === 0) return;
    Alert.alert(
      'Clear All Cards',
      'Are you sure you want to remove all scanned cards? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearCards(),
        },
      ]
    );
  }, [cards.length, clearCards]);

  const handleViewEbayComps = useCallback(
    async (id: string) => {
      const scannedCard = cards.find((c) => c.id === id);
      if (!scannedCard) return;

      setEbayCardId(id);
      setEbayComps(null);
      setEbayLoading(true);

      try {
        const comps = await getEbayComps(
          scannedCard.card.name,
          scannedCard.card.set.name,
          scannedCard.condition
        );
        setEbayComps(comps);
      } catch (err) {
        Alert.alert('Error', 'Could not load eBay comps. Please try again.');
        setEbayCardId(null);
      } finally {
        setEbayLoading(false);
      }
    },
    [cards]
  );

  const handleCloseEbayModal = useCallback(() => {
    setEbayCardId(null);
    setEbayComps(null);
    setEbayLoading(false);
  }, []);

  const activeEbayCard = ebayCardId ? cards.find((c) => c.id === ebayCardId) : null;

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderCard = ({ item }: { item: ScannedCard }) => (
    <CardListItem
      item={item}
      onConditionChange={updateCondition}
      onRemove={removeCard}
      onViewEbayComps={handleViewEbayComps}
    />
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{cards.length}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.statValueGreen]}>
            ${totalValue.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📷</Text>
      <Text style={styles.emptyTitle}>No cards scanned yet</Text>
      <Text style={styles.emptySubtitle}>Start scanning to add cards</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={handleClearAll}
          style={[styles.toolbarButton, styles.clearButton]}
          disabled={cards.length === 0}
        >
          <Text style={[styles.toolbarButtonText, cards.length === 0 && styles.disabledText]}>
            Clear
          </Text>
        </TouchableOpacity>

        <Text style={styles.toolbarTitle}>Current Session</Text>

        <TouchableOpacity
          onPress={handleExportCSV}
          style={[styles.toolbarButton, styles.exportButton]}
          disabled={cards.length === 0}
        >
          <Text style={[styles.exportButtonText, cards.length === 0 && styles.disabledText]}>
            CSV ↗
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={cards.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* eBay Comps Modal */}
      <Modal
        visible={ebayCardId !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseEbayModal}
      >
        <View style={styles.ebayModalBackdrop}>
          <View style={styles.ebayModalContainer}>
            {/* Modal header */}
            <View style={styles.ebayModalHeader}>
              <View style={styles.ebayModalTitleBlock}>
                <Text style={styles.ebayModalTitle} numberOfLines={1}>
                  {activeEbayCard?.card.name ?? 'eBay Comps'}
                </Text>
                <Text style={styles.ebayModalSubtitle}>
                  {activeEbayCard?.card.set.name ?? ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseEbayModal}
                style={styles.ebayCloseButton}
                hitSlop={8}
              >
                <Text style={styles.ebayCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {ebayLoading ? (
              <View style={styles.ebayLoadingContainer}>
                <ActivityIndicator size="large" color="#E53935" />
                <Text style={styles.ebayLoadingText}>Loading eBay comps...</Text>
              </View>
            ) : ebayComps !== null ? (
              <ScrollView
                style={styles.ebayScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Average sold price */}
                <View style={styles.ebayAverageContainer}>
                  <Text style={styles.ebayAverageLabel}>Average Sold Price</Text>
                  <Text style={styles.ebayAveragePrice}>
                    ${ebayComps.averageSold.toFixed(2)}
                  </Text>
                </View>

                {/* Listings */}
                <Text style={styles.ebayListingsHeader}>
                  Recent Sales ({ebayComps.recentListings.length})
                </Text>
                {ebayComps.recentListings.map((listing, index) => (
                  <View key={index} style={styles.ebayListingRow}>
                    <View style={styles.ebayListingInfo}>
                      <Text style={styles.ebayListingTitle} numberOfLines={2}>
                        {listing.title}
                      </Text>
                      <Text style={styles.ebayListingMeta}>
                        {listing.condition} · {formatDate(listing.soldDate)}
                      </Text>
                    </View>
                    <Text style={styles.ebayListingPrice}>
                      ${listing.soldPrice.toFixed(2)}
                    </Text>
                  </View>
                ))}

                <Text style={styles.ebayDemoNote}>
                  {'\u24D8'} Demo data — add eBay credentials for live results
                </Text>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  toolbarTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  toolbarButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#2a1515',
    borderWidth: 1,
    borderColor: '#3a2020',
  },
  exportButton: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  toolbarButtonText: {
    color: '#E53935',
    fontWeight: '600',
    fontSize: 13,
  },
  exportButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 13,
  },
  disabledText: {
    color: '#444',
  },
  listHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
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
    fontSize: 24,
    fontWeight: '800',
  },
  statValueGreen: {
    color: '#4CAF50',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
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
  // eBay Modal styles
  ebayModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  ebayModalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  ebayModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  ebayModalTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  ebayModalTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  ebayModalSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  ebayCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ebayCloseText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '700',
  },
  ebayLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  ebayLoadingText: {
    color: '#666',
    fontSize: 13,
    marginTop: 12,
  },
  ebayScrollView: {
    paddingHorizontal: 20,
  },
  ebayAverageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginBottom: 16,
  },
  ebayAverageLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  ebayAveragePrice: {
    color: '#4CAF50',
    fontSize: 36,
    fontWeight: '800',
  },
  ebayListingsHeader: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  ebayListingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  ebayListingInfo: {
    flex: 1,
    marginRight: 12,
  },
  ebayListingTitle: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  ebayListingMeta: {
    color: '#555',
    fontSize: 11,
    marginTop: 3,
  },
  ebayListingPrice: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  ebayDemoNote: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
    fontStyle: 'italic',
  },
});

export default SessionScreen;
