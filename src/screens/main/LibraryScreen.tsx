import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard } from '../../components';
import { mockMixes, mockPlaylists } from '../../data/mockData';
import { haptics } from '../../utils/haptics';

interface LibraryScreenProps {
  navigation: any;
}

type LibraryTab = 'liked' | 'playlists' | 'downloads';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('liked');
  const [refreshing, setRefreshing] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  const likedMixes = mockMixes.filter(m => m.isLiked);
  const downloadedMixes = mockMixes.filter(m => m.isDownloaded);

  const tabs: { key: LibraryTab; label: string; icon: string; count: number }[] = [
    { key: 'liked', label: 'Liked', icon: 'heart', count: likedMixes.length },
    { key: 'playlists', label: 'Playlists', icon: 'list', count: mockPlaylists.length },
    { key: 'downloads', label: 'Downloads', icon: 'download', count: downloadedMixes.length },
  ];

  const switchTab = useCallback((tab: LibraryTab) => {
    haptics.selection();
    // Fade out, switch, fade in
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    haptics.light();
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => haptics.selection()}
          >
            <Ionicons name="add" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => switchTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[{ flex: 1 }, { opacity: contentFade }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {activeTab === 'liked' && (
            <View style={styles.content}>
              {/* Sort & Filter */}
              <View style={styles.filterRow}>
                <TouchableOpacity style={styles.filterButton} onPress={() => haptics.selection()}>
                  <Ionicons name="swap-vertical" size={16} color={Colors.textSecondary} />
                  <Text style={styles.filterText}>Recently Added</Text>
                </TouchableOpacity>
              </View>

              {likedMixes.length > 0 ? (
                likedMixes.map((mix) => (
                  <MixCard
                    key={mix.id}
                    variant="horizontal"
                    mix={mix}
                    onPress={() => navigation.navigate('Player', { mix })}
                    onPlay={() => navigation.navigate('Player', { mix })}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="heart-outline" size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No liked mixes yet</Text>
                  <Text style={styles.emptyText}>
                    Tap the heart icon on any mix to save it here
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'playlists' && (
            <View style={styles.content}>
              {mockPlaylists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.playlistCard}
                  onPress={() => { haptics.selection(); navigation.navigate('Playlist', { playlist }); }}
                >
                  <View style={styles.playlistImageContainer}>
                    <View style={[styles.playlistImage, { backgroundColor: Colors.primary + '30' }]}>
                      <Ionicons name="musical-notes" size={24} color={Colors.primary} />
                    </View>
                  </View>
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName}>{playlist.name}</Text>
                    <Text style={styles.playlistMeta}>
                      {playlist.mixCount} mixes · {playlist.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'downloads' && (
            <View style={styles.content}>
              {/* Storage Info */}
              <View style={styles.storageCard}>
                <View style={styles.storageHeader}>
                  <Ionicons name="phone-portrait-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.storageText}>2.4 GB used</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '24%' }]} />
                </View>
              </View>

              {downloadedMixes.length > 0 ? (
                downloadedMixes.map((mix) => (
                  <MixCard
                    key={mix.id}
                    variant="horizontal"
                    mix={mix}
                    onPress={() => navigation.navigate('Player', { mix })}
                    onPlay={() => navigation.navigate('Player', { mix })}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="download-outline" size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No downloads yet</Text>
                  <Text style={styles.emptyText}>
                    Download mixes to listen offline
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl + 40,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: Colors.white + '30',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  filterText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  playlistImageContainer: {
    marginRight: Spacing.md,
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  playlistMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  storageCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  storageText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 2,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
