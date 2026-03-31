import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ScanSession, ScannedCard } from '../types';
import { loadSessions, saveSessions } from '../utils/storage';
import CardListItem from '../components/CardListItem';

interface SessionRowProps {
  session: ScanSession;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const SessionRow: React.FC<SessionRowProps> = ({
  session,
  isExpanded,
  onToggle,
  onDelete,
}) => {
  const dateStr = new Date(session.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderNestedCard = ({ item }: { item: ScannedCard }) => (
    <CardListItem
      item={item}
      onConditionChange={() => {}}
      onRemove={() => {}}
    />
  );

  return (
    <View style={styles.sessionCard}>
      <TouchableOpacity
        style={styles.sessionHeader}
        onPress={() => onToggle(session.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName} numberOfLines={1}>
            {session.name}
          </Text>
          <Text style={styles.sessionDate}>{dateStr}</Text>
          <View style={styles.sessionMeta}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{session.cards.length} cards</Text>
            </View>
            <Text style={styles.sessionValue}>${session.totalValue.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.sessionActions}>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
          <TouchableOpacity
            style={styles.deleteSessionButton}
            onPress={() => onDelete(session.id)}
            hitSlop={8}
          >
            <Text style={styles.deleteSessionText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && session.cards.length > 0 && (
        <View style={styles.expandedCards}>
          <FlatList
            data={session.cards}
            renderItem={renderNestedCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {isExpanded && session.cards.length === 0 && (
        <View style={styles.emptySessionCards}>
          <Text style={styles.emptySessionText}>No cards in this session</Text>
        </View>
      )}
    </View>
  );
};

const HistoryScreen: React.FC = () => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadSessions();
      setSessions(loaded);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (!session) return;

      Alert.alert(
        'Delete Session',
        `Are you sure you want to delete "${session.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const updated = sessions.filter((s) => s.id !== id);
              setSessions(updated);
              if (expandedId === id) setExpandedId(null);
              try {
                await saveSessions(updated);
              } catch (err) {
                Alert.alert('Error', 'Failed to delete session.');
                await fetchSessions();
              }
            },
          },
        ]
      );
    },
    [sessions, expandedId, fetchSessions]
  );

  const renderSession = ({ item }: { item: ScanSession }) => (
    <SessionRow
      session={item}
      isExpanded={expandedId === item.id}
      onToggle={handleToggleExpand}
      onDelete={handleDeleteSession}
    />
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptySubtitle}>Loading sessions...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyTitle}>No saved sessions yet</Text>
        <Text style={styles.emptySubtitle}>
          Scan some cards and save a session to see it here
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Scan History</Text>
        <Text style={styles.sessionCount}>
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </Text>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          sessions.length === 0 ? styles.emptyListContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
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
  sessionCount: {
    color: '#888',
    fontSize: 13,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyListContent: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  sessionDate: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaBadge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaBadgeText: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
  },
  sessionValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionActions: {
    alignItems: 'center',
    gap: 10,
  },
  expandIcon: {
    color: '#666',
    fontSize: 12,
  },
  deleteSessionButton: {
    padding: 4,
  },
  deleteSessionText: {
    fontSize: 18,
  },
  expandedCards: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 6,
    paddingBottom: 8,
  },
  emptySessionCards: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  emptySessionText: {
    color: '#555',
    fontSize: 13,
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
});

export default HistoryScreen;
