import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Animated,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard } from '../../components';
import { Mix } from '../../data/mockData';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAudioContext } from '../../contexts/AudioContext';
import { usePlaylists, Playlist } from '../../contexts/PlaylistContext';

const MODE_STORAGE_KEY = '@remix_user_mode';

interface LibraryScreenProps {
  navigation: any;
  route?: any;
}

type ListenerTab = 'liked' | 'playlists' | 'downloads';
type CreatorTab = 'uploads' | 'playlists' | 'drafts';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { setQueue, setCurrentMix } = useAudioContext();
  const { playlists, loading: playlistsLoading, fetchPlaylists, deletePlaylist } = usePlaylists();
  const [isCreatorMode, setIsCreatorMode] = useState(false);

  // Listener tabs
  const [activeListenerTab, setActiveListenerTab] = useState<ListenerTab>('liked');
  // Creator tabs
  const [activeCreatorTab, setActiveCreatorTab] = useState<CreatorTab>('uploads');

  const [refreshing, setRefreshing] = useState(false);
  const contentFade = useRef(new Animated.Value(1)).current;

  // Liked songs state
  const [likedMixes, setLikedMixes] = useState<Mix[]>([]);
  const [isLoadingLiked, setIsLoadingLiked] = useState(true);

  // Creator uploads state
  const [myUploads, setMyUploads] = useState<Mix[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);

  // Downloads state (real data se aayega)
  const downloadedMixes: Mix[] = [];

  // Mode load karo
  useEffect(() => {
    loadMode();
  }, []);

  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
      setIsCreatorMode(savedMode === 'creator');
    } catch (err) {
      console.log('Error loading mode:', err);
    }
  };

  // Jab screen focus ho toh data refresh karo
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMode();
      if (isCreatorMode) {
        fetchMyUploads();
      } else {
        fetchLikedSongs();
      }
      fetchPlaylists();
    });
    return unsubscribe;
  }, [navigation, user, isCreatorMode]);

  // Initial load
  useEffect(() => {
    if (isCreatorMode) {
      fetchMyUploads();
    } else {
      fetchLikedSongs();
    }
    fetchPlaylists();
  }, [isCreatorMode]);

  // ========== LISTENER: Liked Songs ==========
  const fetchLikedSongs = async () => {
    console.log('[LibraryScreen] fetchLikedSongs called, user:', user?.id || 'null');
    setIsLoadingLiked(true);

    try {
      if (!user) {
        setLikedMixes([]);
        setIsLoadingLiked(false);
        return;
      }

      const { data: likesData, error: likesError } = await supabase
        .from('user_likes')
        .select('song_id')
        .eq('user_id', user.id);

      if (likesError || !likesData || likesData.length === 0) {
        setLikedMixes([]);
        setIsLoadingLiked(false);
        return;
      }

      const songIds = likesData.map((like: any) => like.song_id);

      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .in('id', songIds);

      if (songsError || !songsData || songsData.length === 0) {
        setLikedMixes([]);
      } else {
        const formatted: Mix[] = songsData.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: {
            id: song.uploaded_by || 'unknown',
            name: song.artist,
            handle: '@' + song.artist.toLowerCase().replace(/\s+/g, ''),
            avatar: 'https://picsum.photos/seed/' + song.artist + '/200/200',
            bio: '',
            followers: 0,
            mixes: 0,
            isVerified: false,
            totalEarnings: 0,
            genre: song.genre || 'Electronic',
            isFollowing: false,
          },
          coverImage: song.cover_image || 'https://picsum.photos/seed/' + song.id + '/400/400',
          duration: song.duration || 0,
          plays: song.plays_count || 0,
          likes: song.likes_count || 0,
          isLiked: true,
          isDownloaded: song.is_downloaded || false,
          genre: song.genre || 'Electronic',
          uploadedAt: song.created_at,
          isExclusive: song.is_exclusive || false,
          audioUrl: song.audio_url || '',
          description: song.description || '',
        }));
        setLikedMixes(formatted);
      }
    } catch (err) {
      setLikedMixes([]);
    } finally {
      setIsLoadingLiked(false);
    }
  };

  // ========== CREATOR: My Uploads ==========
  const fetchMyUploads = async () => {
    console.log('[LibraryScreen] fetchMyUploads called, user:', user?.id || 'null');
    setIsLoadingUploads(true);

    try {
      if (!user) {
        setMyUploads([]);
        setIsLoadingUploads(false);
        return;
      }

      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setMyUploads([]);
      } else {
        const formatted: Mix[] = data.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: {
            id: user.id,
            name: song.artist,
            handle: '@' + song.artist.toLowerCase().replace(/\s+/g, ''),
            avatar: 'https://picsum.photos/seed/' + user.id + '/200/200',
            bio: '',
            followers: 0,
            mixes: 0,
            isVerified: false,
            totalEarnings: 0,
            genre: song.genre || 'Electronic',
            isFollowing: false,
          },
          coverImage: song.cover_image || 'https://picsum.photos/seed/' + song.id + '/400/400',
          duration: song.duration || 0,
          plays: song.plays_count || 0,
          likes: song.likes_count || 0,
          isLiked: false,
          isDownloaded: song.is_downloaded || false,
          genre: song.genre || 'Electronic',
          uploadedAt: song.created_at,
          isExclusive: song.is_exclusive || false,
          audioUrl: song.audio_url || '',
          description: song.description || '',
        }));
        setMyUploads(formatted);
      }
    } catch (err) {
      setMyUploads([]);
    } finally {
      setIsLoadingUploads(false);
    }
  };

  // Jab koi song play ho — queue set karo with current list
  const handlePlaySong = useCallback((mix: Mix) => {
    haptics.light();
    const currentList = isCreatorMode ? myUploads : likedMixes;
    const queueList = currentList.length > 0 ? currentList : [mix];
    setQueue(queueList);
    setCurrentMix(mix);
    navigation.navigate('Player', { mix });
  }, [isCreatorMode, myUploads, likedMixes, navigation, setQueue, setCurrentMix]);

  // ========== PLAYLIST OPERATIONS ==========

  const handleCreatePlaylist = useCallback(() => {
    haptics.light();
    navigation.navigate('Playlist', { isNewPlaylist: true });
  }, [navigation]);

  const handleOpenPlaylist = useCallback((playlist: Playlist) => {
    haptics.light();
    navigation.navigate('Playlist', { playlist });
  }, [navigation]);

  const handleDeletePlaylist = useCallback((playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlist.id);
            haptics.success();
          },
        },
      ]
    );
  }, [deletePlaylist]);

  // ========== Listener Tabs ==========
  const listenerTabs: { key: ListenerTab; label: string; icon: string; count: number }[] = [
    { key: 'liked', label: 'Liked', icon: 'heart', count: likedMixes.length },
    { key: 'playlists', label: 'Playlists', icon: 'list', count: playlists.length },
    { key: 'downloads', label: 'Downloads', icon: 'download', count: downloadedMixes.length },
  ];

  // ========== Creator Tabs ==========
  const creatorTabs: { key: CreatorTab; label: string; icon: string; count: number }[] = [
    { key: 'uploads', label: 'My Uploads', icon: 'cloud-upload', count: myUploads.length },
    { key: 'playlists', label: 'Playlists', icon: 'list', count: playlists.length },
    { key: 'drafts', label: 'Drafts', icon: 'document-text', count: 0 },
  ];

  const switchListenerTab = useCallback((tab: ListenerTab) => {
    haptics.selection();
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setActiveListenerTab(tab);
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const switchCreatorTab = useCallback((tab: CreatorTab) => {
    haptics.selection();
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setActiveCreatorTab(tab);
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
    if (isCreatorMode) {
      fetchMyUploads().then(() => {
        fetchPlaylists();
        setRefreshing(false);
      });
    } else {
      fetchLikedSongs().then(() => {
        fetchPlaylists();
        setRefreshing(false);
      });
    }
  }, [isCreatorMode]);

  // Format number helper
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // ========== PLAYLIST COMPONENT ==========
  const PlaylistItem = ({ playlist }: { playlist: Playlist }) => (
    <TouchableOpacity
      style={styles.playlistCard}
      onPress={() => handleOpenPlaylist(playlist)}
      onLongPress={() => handleDeletePlaylist(playlist)}
    >
      <View style={styles.playlistImageContainer}>
        <View style={styles.playlistImage}>
          {playlist.cover_image ? (
            <Image source={{ uri: playlist.cover_image }} style={styles.playlistCoverImage} />
          ) : (
            <Ionicons name="musical-notes" size={24} color={Colors.primary} />
          )}
        </View>
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</Text>
        <Text style={styles.playlistMeta}>
          {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  // ========== LISTENER MODE RENDER ==========
  const renderListenerContent = () => (
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
        {activeListenerTab === 'liked' && (
          <View style={styles.content}>
            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.filterButton} onPress={() => haptics.selection()}>
                <Ionicons name="swap-vertical" size={16} color={Colors.textSecondary} />
                <Text style={styles.filterText}>Recently Added</Text>
              </TouchableOpacity>
            </View>

            {isLoadingLiked ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Loading liked songs...</Text>
              </View>
            ) : likedMixes.length > 0 ? (
              likedMixes.map((mix) => (
                <MixCard
                  key={mix.id}
                  variant="horizontal"
                  mix={mix}
                  onPress={() => handlePlaySong(mix)}
                  onPlay={() => handlePlaySong(mix)}
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

        {activeListenerTab === 'playlists' && (
          <View style={styles.content}>
            {/* Create Playlist Button */}
            <TouchableOpacity style={styles.createPlaylistButton} onPress={handleCreatePlaylist}>
              <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
              <Text style={styles.createPlaylistText}>Create New Playlist</Text>
            </TouchableOpacity>

            {playlistsLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="list-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Loading playlists...</Text>
              </View>
            ) : playlists.length > 0 ? (
              playlists.map((playlist) => (
                <PlaylistItem key={playlist.id} playlist={playlist} />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="list-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptyText}>
                  Create playlists to organize your favorite mixes
                </Text>
              </View>
            )}
          </View>
        )}

        {activeListenerTab === 'downloads' && (
          <View style={styles.content}>
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
                  onPress={() => handlePlaySong(mix)}
                  onPlay={() => handlePlaySong(mix)}
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
  );

  // ========== CREATOR MODE RENDER ==========
  const renderCreatorContent = () => (
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
        {activeCreatorTab === 'uploads' && (
          <View style={styles.content}>
            {isLoadingUploads ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cloud-upload-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Loading your uploads...</Text>
              </View>
            ) : myUploads.length > 0 ? (
              <>
                {/* Upload Summary */}
                <View style={styles.uploadSummary}>
                  <View style={styles.uploadSummaryItem}>
                    <Text style={styles.uploadSummaryValue}>{formatNumber(myUploads.length)}</Text>
                    <Text style={styles.uploadSummaryLabel}>Total Uploads</Text>
                  </View>
                  <View style={styles.uploadSummaryDivider} />
                  <View style={styles.uploadSummaryItem}>
                    <Text style={styles.uploadSummaryValue}>
                      {formatNumber(myUploads.reduce((sum, m) => sum + m.plays, 0))}
                    </Text>
                    <Text style={styles.uploadSummaryLabel}>Total Plays</Text>
                  </View>
                  <View style={styles.uploadSummaryDivider} />
                  <View style={styles.uploadSummaryItem}>
                    <Text style={styles.uploadSummaryValue}>
                      {formatNumber(myUploads.reduce((sum, m) => sum + m.likes, 0))}
                    </Text>
                    <Text style={styles.uploadSummaryLabel}>Total Likes</Text>
                  </View>
                </View>

                {myUploads.map((mix) => (
                  <MixCard
                    key={mix.id}
                    variant="horizontal"
                    mix={mix}
                    onPress={() => navigation.navigate('Player', { mix })}
                    onPlay={() => navigation.navigate('Player', { mix })}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="cloud-upload-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No uploads yet</Text>
                <Text style={styles.emptyText}>
                  Share your first mix with the world!
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => { haptics.light(); navigation.navigate('Upload'); }}
                >
                  <Ionicons name="add" size={18} color={Colors.white} />
                  <Text style={styles.uploadButtonText}>Upload Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeCreatorTab === 'playlists' && (
          <View style={styles.content}>
            {/* Create Playlist Button */}
            <TouchableOpacity style={styles.createPlaylistButton} onPress={handleCreatePlaylist}>
              <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
              <Text style={styles.createPlaylistText}>Create New Playlist</Text>
            </TouchableOpacity>

            {playlistsLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="list-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Loading playlists...</Text>
              </View>
            ) : playlists.length > 0 ? (
              playlists.map((playlist) => (
                <PlaylistItem key={playlist.id} playlist={playlist} />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="list-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No playlists yet</Text>
                <Text style={styles.emptyText}>
                  Create playlists to organize your uploads
                </Text>
              </View>
            )}
          </View>
        )}

        {activeCreatorTab === 'drafts' && (
          <View style={styles.content}>
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No drafts</Text>
              <Text style={styles.emptyText}>
                Uploads that are being reviewed will appear here
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );

  const currentTabs = isCreatorMode ? creatorTabs : listenerTabs;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isCreatorMode ? 'My Music' : 'Your Library'}
        </Text>
        <View style={styles.headerActions}>
          {isCreatorMode && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => { haptics.light(); navigation.navigate('Upload'); }}
            >
              <Ionicons name="add" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {currentTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              (isCreatorMode ? activeCreatorTab === tab.key : activeListenerTab === tab.key) && styles.tabActive,
            ]}
            onPress={() => {
              if (isCreatorMode) {
                switchCreatorTab(tab.key as CreatorTab);
              } else {
                switchListenerTab(tab.key as ListenerTab);
              }
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={
                (isCreatorMode ? activeCreatorTab === tab.key : activeListenerTab === tab.key)
                  ? Colors.white
                  : Colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabText,
                (isCreatorMode ? activeCreatorTab === tab.key : activeListenerTab === tab.key) && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  (isCreatorMode ? activeCreatorTab === tab.key : activeListenerTab === tab.key) && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    (isCreatorMode ? activeCreatorTab === tab.key : activeListenerTab === tab.key) && styles.tabBadgeTextActive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isCreatorMode ? renderCreatorContent() : renderListenerContent()}
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
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
    flex: 1,
  },
  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
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
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 3,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    color: Colors.textSecondary,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  // Create Playlist Button
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  createPlaylistText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Playlist
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  playlistImageContainer: {
    marginRight: Spacing.md,
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playlistCoverImage: {
    width: '100%',
    height: '100%',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  playlistMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  // Storage
  storageCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
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
    height: 6,
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  // Upload Button
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  uploadButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  // Creator Upload Summary
  uploadSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  uploadSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  uploadSummaryValue: {
    ...Typography.h3,
    color: Colors.primary,
  },
  uploadSummaryLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  uploadSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});
