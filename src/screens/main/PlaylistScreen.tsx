/**
 * PlaylistScreen — Playlist detail + create/edit playlist screen
 *
 * KYUN zaruri hai:
 * - User apne playlists manage kar sake
 * - Songs ko playlists mein add/remove kar sake
 * - Playlist ka naam aur description change kar sake
 * - Playlist delete kar sake
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard } from '../../components';
import { Mix } from '../../data/mockData';
import { formatDurationText } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlaylists, Playlist } from '../../contexts/PlaylistContext';
import { useAudioContext } from '../../contexts/AudioContext';

interface PlaylistScreenProps {
  navigation: any;
  route: any;
}

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ navigation, route }) => {
  const playlist = route?.params?.playlist as Playlist | undefined;
  const isNewPlaylist = route?.params?.isNewPlaylist || false;
  const { user } = useAuth();
  const { 
    createPlaylist, 
    deletePlaylist, 
    updatePlaylist, 
    addSongToPlaylist, 
    removeSongFromPlaylist,
    getPlaylistSongs,
    playlists,
  } = usePlaylists();
  const { setQueue, setCurrentMix } = useAudioContext();
  
  const [playlistMixes, setPlaylistMixes] = useState<Mix[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(isNewPlaylist);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(isNewPlaylist);
  const [editName, setEditName] = useState(playlist?.name || '');
  const [editDescription, setEditDescription] = useState(playlist?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Add song modal state
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Mix[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch playlist songs from DB
  useEffect(() => {
    if (playlist?.id) {
      fetchPlaylistSongs();
    } else if (isNewPlaylist) {
      setIsLoading(false);
    }
  }, [playlist?.id]);

  const fetchPlaylistSongs = async () => {
    if (!playlist?.id) return;
    
    setIsLoading(true);
    try {
      const songIds = await getPlaylistSongs(playlist.id);
      
      if (songIds.length === 0) {
        setPlaylistMixes([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .in('id', songIds);

      if (error || !data || data.length === 0) {
        setPlaylistMixes([]);
      } else {
        // Maintain order from playlist_songs
        const orderedSongs = songIds
          .map(id => data.find((s: any) => s.id === id))
          .filter(Boolean)
          .map((song: any) => formatSong(song));
        
        setPlaylistMixes(orderedSongs);
      }
    } catch (err) {
      setPlaylistMixes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSong = (song: any): Mix => ({
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
    isLiked: false,
    isDownloaded: song.is_downloaded || false,
    genre: song.genre || 'Electronic',
    uploadedAt: song.created_at,
    isExclusive: song.is_exclusive || false,
    audioUrl: song.audio_url || '',
    description: song.description || '',
  });

  // ==================== CREATE/UPDATE PLAYLIST ====================

  const handleSavePlaylist = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    setIsSaving(true);
    try {
      if (isNewPlaylist) {
        const newPlaylist = await createPlaylist(editName, editDescription);
        if (newPlaylist) {
          haptics.success();
          setShowEditModal(false);
          navigation.setParams({ playlist: newPlaylist, isNewPlaylist: false });
        }
      } else if (playlist?.id) {
        await updatePlaylist(playlist.id, {
          name: editName,
          description: editDescription,
        });
        haptics.success();
        setShowEditModal(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  }, [editName, editDescription, isNewPlaylist, playlist?.id]);

  // ==================== DELETE PLAYLIST ====================

  const handleDeletePlaylist = useCallback(() => {
    if (!playlist?.id) return;

    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deletePlaylist(playlist.id);
            if (success) {
              haptics.success();
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [playlist?.id, playlist?.name]);

  // ==================== REMOVE SONG ====================

  const handleRemoveSong = useCallback((songId: string) => {
    if (!playlist?.id) return;

    Alert.alert(
      'Remove Song',
      'Remove this song from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeSongFromPlaylist(playlist.id, songId);
            if (success) {
              haptics.success();
              setPlaylistMixes(prev => prev.filter(m => m.id !== songId));
            }
          },
        },
      ]
    );
  }, [playlist?.id]);

  // ==================== ADD SONG MODAL ====================

  const openAddSongModal = useCallback(async () => {
    setShowAddSongModal(true);
    setIsSearching(true);
    
    try {
      // Fetch all available songs
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const formatted = data.map((song: any) => formatSong(song));
        setAvailableSongs(formatted);
      }
    } catch (err) {
      console.log('Error fetching songs:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddSong = useCallback(async (songId: string) => {
    if (!playlist?.id) return;

    const success = await addSongToPlaylist(playlist.id, songId);
    if (success) {
      haptics.success();
      // Refresh playlist songs
      fetchPlaylistSongs();
    } else {
      Alert.alert('Already Added', 'This song is already in the playlist');
    }
  }, [playlist?.id]);

  const filteredSongs = availableSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==================== PLAY ALL ====================

  const handlePlayAll = useCallback(() => {
    if (playlistMixes.length === 0) return;
    haptics.medium();
    setQueue(playlistMixes);
    setCurrentMix(playlistMixes[0]);
    navigation.navigate('Player', { mix: playlistMixes[0] });
  }, [playlistMixes]);

  // ==================== RENDER ====================

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {playlist?.cover_image ? (
            <Image source={{ uri: playlist.cover_image }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="musical-notes" size={64} color={Colors.primary} />
            </View>
          )}
          <View style={styles.heroOverlay} />
          
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* More options */}
          {playlist?.id && (
            <TouchableOpacity style={styles.moreButton} onPress={() => {
              Alert.alert('Playlist Options', 'Choose an action', [
                { text: 'Edit', onPress: () => { setEditName(playlist.name || ''); setEditDescription(playlist.description || ''); setShowEditModal(true); } },
                { text: 'Delete', style: 'destructive', onPress: handleDeletePlaylist },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}>
              <Ionicons name="ellipsis-horizontal" size={22} color={Colors.white} />
            </TouchableOpacity>
          )}

          {/* Playlist Info */}
          <View style={styles.heroInfo}>
            <Text style={styles.heroLabel}>PLAYLIST</Text>
            <Text style={styles.heroTitle}>{playlist?.name || 'New Playlist'}</Text>
            <Text style={styles.heroMeta}>
              {playlistMixes.length} songs
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setEditName(playlist?.name || '');
              setEditDescription(playlist?.description || '');
              setShowEditModal(true);
            }}
          >
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
            <Ionicons name="play" size={24} color={Colors.white} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={openAddSongModal}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Song List */}
        <View style={styles.mixList}>
          {isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptyTitle}>Loading playlist...</Text>
            </View>
          ) : playlistMixes.length > 0 ? (
            playlistMixes.map((mix, index) => (
              <View key={mix.id} style={styles.mixRow}>
                <Text style={styles.mixNumber}>{index + 1}</Text>
                <View style={styles.mixCardContainer}>
                  <MixCard
                    variant="horizontal"
                    mix={mix}
                    onPress={() => {
                      setQueue(playlistMixes);
                      setCurrentMix(mix);
                      navigation.navigate('Player', { mix });
                    }}
                    onPlay={() => {
                      setQueue(playlistMixes);
                      setCurrentMix(mix);
                      navigation.navigate('Player', { mix });
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveSong(mix.id)}
                >
                  <Ionicons name="close-circle" size={22} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No songs yet</Text>
              <Text style={styles.emptyText}>Tap the + button to add songs</Text>
              <TouchableOpacity style={styles.addSongButton} onPress={openAddSongModal}>
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.addSongButtonText}>Add Songs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ==================== EDIT PLAYLIST MODAL ==================== */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isNewPlaylist ? 'Create Playlist' : 'Edit Playlist'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Playlist name"
                  placeholderTextColor={Colors.textTertiary}
                  value={editName}
                  onChangeText={setEditName}
                  maxLength={50}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Add a description (optional)"
                  placeholderTextColor={Colors.textTertiary}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSavePlaylist}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isNewPlaylist ? 'Create' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== ADD SONG MODAL ==================== */}
      <Modal
        visible={showAddSongModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSongModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.addSongModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Songs</Text>
              <TouchableOpacity onPress={() => setShowAddSongModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search songs..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Song List */}
            {isSearching ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredSongs}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isInPlaylist = playlistMixes.some(m => m.id === item.id);
                  return (
                    <View style={styles.songItem}>
                      <Image source={{ uri: item.coverImage }} style={styles.songImage} />
                      <View style={styles.songInfo}>
                        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.songArtist} numberOfLines={1}>{item.artist?.name}</Text>
                      </View>
                      {isInPlaylist ? (
                        <View style={styles.addedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                          <Text style={styles.addedText}>Added</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addButtonSmall}
                          onPress={() => handleAddSong(item.id)}
                        >
                          <Ionicons name="add-circle" size={28} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptySearch}>
                    <Ionicons name="search-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptySearchText}>No songs found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.7)',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xxl + 44,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    position: 'absolute',
    top: Spacing.xxl + 44,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  heroLabel: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  heroMeta: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xxl,
    height: 48,
    gap: Spacing.sm,
    flex: 1,
  },
  playAllText: {
    ...Typography.button,
    color: Colors.white,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mixList: {
    paddingHorizontal: Spacing.xl,
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mixNumber: {
    ...Typography.body,
    color: Colors.textTertiary,
    width: 24,
    textAlign: 'center',
    marginRight: Spacing.sm,
  },
  mixCardContainer: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 2,
    paddingBottom: Spacing.xxxl,
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
  },
  addSongButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  addSongButtonText: {
    ...Typography.button,
    color: Colors.white,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl + 20,
    paddingTop: Spacing.xl,
    maxHeight: '80%',
  },
  addSongModal: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  modalBody: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.full,
    height: 48,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 48,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.white,
  },

  // Add Song Modal
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  searchLoading: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  songImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  songArtist: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addedText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600',
  },
  addButtonSmall: {
    padding: Spacing.xs,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptySearchText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
