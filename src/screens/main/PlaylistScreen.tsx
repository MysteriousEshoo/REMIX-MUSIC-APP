import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard } from '../../components';
import { Mix } from '../../data/mockData';
import { formatDurationText } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PlaylistScreenProps {
  navigation: any;
  route: any;
}

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ navigation, route }) => {
  const playlist = route?.params?.playlist;
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [playlistMixes, setPlaylistMixes] = useState<Mix[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch playlist songs from DB
  useEffect(() => {
    fetchPlaylistSongs();
  }, [playlist?.id]);

  const fetchPlaylistSongs = async () => {
    setIsLoading(true);
    try {
      if (!playlist?.songIds || playlist.songIds.length === 0) {
        setPlaylistMixes([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .in('id', playlist.songIds);

      if (error || !data || data.length === 0) {
        setPlaylistMixes([]);
      } else {
        const formatted: Mix[] = data.map((song: any) => ({
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
        }));
        setPlaylistMixes(formatted);
      }
    } catch (err) {
      setPlaylistMixes([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!playlist) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: playlist?.coverImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color={Colors.white} />
          </TouchableOpacity>

          {/* Playlist Info */}
          <View style={styles.heroInfo}>
            <Text style={styles.heroLabel}>PLAYLIST</Text>
            <Text style={styles.heroTitle}>{playlist?.name}</Text>
            <Text style={styles.heroMeta}>
              {playlist?.mixCount} mixes · {formatDurationText(playlist?.totalDuration || 0)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => { haptics.medium(); setIsLiked(!isLiked); }}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playAllButton} onPress={() => haptics.medium()}>
            <Ionicons name="play" size={24} color={Colors.white} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shuffleButton}>
            <Ionicons name="shuffle" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadAllButton}>
            <Ionicons name="download-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Mix List */}
        <View style={styles.mixList}>
          {isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Loading playlist...</Text>
            </View>
          ) : playlistMixes.length > 0 ? (
            playlistMixes.map((mix, index) => (
              <View key={mix.id} style={styles.mixRow}>
                <Text style={styles.mixNumber}>{index + 1}</Text>
                <MixCard
                  variant="horizontal"
                  mix={mix}
                  onPress={() => navigation.navigate('Player', { mix })}
                  onPlay={() => navigation.navigate('Player', { mix })}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No songs in this playlist</Text>
              <Text style={styles.emptyText}>Add some songs to get started</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
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
  shareButton: {
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
  likeButton: {
    width: 44,
    height: 44,
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
  shuffleButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadAllButton: {
    width: 44,
    height: 44,
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
});
