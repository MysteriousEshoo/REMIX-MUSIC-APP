import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard } from '../../components';
import { Mix } from '../../data/mockData';
import { formatNumber } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { useFollowDJ } from '../../hooks/useFollowDJ';
import { supabase } from '../../config/supabase';

interface DJProfileScreenProps {
  navigation: any;
  route: any;
}

export const DJProfileScreen: React.FC<DJProfileScreenProps> = ({ navigation, route }) => {
  const dj = route?.params?.dj;
  const djId = dj?.id || dj?.handle || '';
  
  // useFollowDJ hook — Supabase se follow/unfollow
  const { isFollowing, followerCount, loading: followLoading, toggleFollow, fetchFollowerCount } = useFollowDJ(djId);

  const [djMixes, setDjMixes] = useState<Mix[]>([]);
  const [isLoadingMixes, setIsLoadingMixes] = useState(true);
  const [totalFollowers, setTotalFollowers] = useState(dj?.followers || 0);

  // Fetch follower count on mount
  useEffect(() => {
    if (djId) {
      fetchFollowerCount();
    }
  }, [djId]);

  // Update total followers from hook
  useEffect(() => {
    if (followerCount > 0) {
      setTotalFollowers(followerCount);
    }
  }, [followerCount]);

  // Fetch DJ's songs from Supabase
  useEffect(() => {
    fetchDjMixes();
  }, [djId]);

  const fetchDjMixes = async () => {
    setIsLoadingMixes(true);
    try {
      if (!djId) {
        setDjMixes([]);
        setIsLoadingMixes(false);
        return;
      }

      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('uploaded_by', djId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setDjMixes([]);
      } else {
        const formatted: Mix[] = data.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: {
            id: song.uploaded_by || djId,
            name: song.artist || dj?.name || 'Unknown',
            handle: dj?.handle || '@unknown',
            avatar: dj?.avatar || 'https://picsum.photos/seed/unknown/200/200',
            bio: dj?.bio || '',
            followers: totalFollowers,
            mixes: data.length,
            isVerified: dj?.isVerified || false,
            totalEarnings: dj?.totalEarnings || 0,
            genre: song.genre || 'Electronic',
            isFollowing,
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
        setDjMixes(formatted);
      }
    } catch (err) {
      setDjMixes([]);
    } finally {
      setIsLoadingMixes(false);
    }
  };

  const handleFollowToggle = useCallback(async () => {
    haptics.medium();
    await toggleFollow();
    // Update follower count locally
    setTotalFollowers((prev: number) => isFollowing ? prev - 1 : prev + 1);
  }, [toggleFollow, isFollowing]);

  if (!dj) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Image source={{ uri: dj.avatar }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Share button */}
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: dj.avatar }} style={styles.avatar} />
            {dj.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.djName}>{dj.name}</Text>
          </View>
          <Text style={styles.handle}>{dj.handle}</Text>
          <Text style={styles.genre}>{dj.genre}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(totalFollowers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{djMixes.length}</Text>
              <Text style={styles.statLabel}>Mixes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${formatNumber(dj.totalEarnings || 0)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={[styles.followText, isFollowing && styles.followingText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.tipButton}>
              <Ionicons name="gift" size={18} color={Colors.gold} />
              <Text style={styles.tipButtonText}>Tip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Bio */}
          <Text style={styles.bio}>{dj.bio}</Text>
        </View>

        {/* Latest Mix */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Mix</Text>
          </View>
          {djMixes.length > 0 && (
            <View style={styles.latestMix}>
              <TouchableOpacity
                style={styles.latestMixContent}
                onPress={() => navigation.navigate('Player', { mix: djMixes[0] })}
              >
                <Image source={{ uri: djMixes[0].coverImage }} style={styles.latestMixImage} />
                <View style={styles.latestMixInfo}>
                  <Text style={styles.latestMixTitle} numberOfLines={2}>
                    {djMixes[0].title}
                  </Text>
                  <Text style={styles.latestMixMeta}>
                    {formatNumber(djMixes[0].plays)} plays
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.latestPlayButton}
                  onPress={() => navigation.navigate('Player', { mix: djMixes[0] })}
                >
                  <Ionicons name="play" size={24} color={Colors.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* All Mixes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Mixes</Text>
            <Text style={styles.mixCount}>{djMixes.length} mixes</Text>
          </View>
          {isLoadingMixes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            djMixes.map((mix) => (
              <MixCard
                key={mix.id}
                variant="horizontal"
                mix={mix}
                onPress={() => navigation.navigate('Player', { mix })}
                onPlay={() => navigation.navigate('Player', { mix })}
              />
            ))
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
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.6)',
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
  profileInfo: {
    paddingHorizontal: Spacing.xl,
    marginTop: -40,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colors.background,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  djName: {
    ...Typography.h1,
    textAlign: 'center',
  },
  handle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  genre: {
    ...Typography.body,
    color: Colors.primary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
  },
  followButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
  },
  followText: {
    ...Typography.button,
    color: Colors.white,
  },
  followingText: {
    color: Colors.textSecondary,
  },
  tipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.full,
    height: 48,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xs,
  },
  tipButtonText: {
    ...Typography.button,
    color: Colors.gold,
  },
  moreButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bio: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 22,
  },
  section: {
    marginTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  mixCount: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  latestMix: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  latestMixContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  latestMixImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
  },
  latestMixInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  latestMixTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  latestMixMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  latestPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
});
