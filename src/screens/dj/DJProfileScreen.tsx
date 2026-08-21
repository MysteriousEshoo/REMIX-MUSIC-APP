import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard, Button } from '../../components';
import { mockMixes } from '../../data/mockData';
import { formatNumber } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';

interface DJProfileScreenProps {
  navigation: any;
  route: any;
}

export const DJProfileScreen: React.FC<DJProfileScreenProps> = ({ navigation, route }) => {
  const dj = route?.params?.dj;
  const [isFollowing, setIsFollowing] = useState(dj?.isFollowing || false);

  const djMixes = mockMixes.filter(m => m.artist.id === dj?.id);
  const allMixes = djMixes.length > 0 ? djMixes : mockMixes.slice(0, 4);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Image source={{ uri: dj?.avatar }} style={styles.heroImage} />
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
            <Image source={{ uri: dj?.avatar }} style={styles.avatar} />
            {dj?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.djName}>{dj?.name}</Text>
          </View>
          <Text style={styles.handle}>{dj?.handle}</Text>
          <Text style={styles.genre}>{dj?.genre}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(dj?.followers || 0)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dj?.mixes || 0}</Text>
              <Text style={styles.statLabel}>Mixes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${formatNumber(dj?.totalEarnings || 0)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={() => { haptics.medium(); setIsFollowing(!isFollowing); }}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
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
          <Text style={styles.bio}>{dj?.bio}</Text>
        </View>

        {/* Latest Mix */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Mix</Text>
          </View>
          {allMixes.length > 0 && (
            <View style={styles.latestMix}>
              <TouchableOpacity
                style={styles.latestMixContent}
                onPress={() => navigation.navigate('Player', { mix: allMixes[0] })}
              >
                <Image source={{ uri: allMixes[0].coverImage }} style={styles.latestMixImage} />
                <View style={styles.latestMixInfo}>
                  <Text style={styles.latestMixTitle} numberOfLines={2}>
                    {allMixes[0].title}
                  </Text>
                  <Text style={styles.latestMixMeta}>
                    {formatNumber(allMixes[0].plays)} plays · {allMixes[0].uploadedAt}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.latestPlayButton}
                  onPress={() => navigation.navigate('Player', { mix: allMixes[0] })}
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
            <Text style={styles.mixCount}>{allMixes.length} mixes</Text>
          </View>
          {allMixes.map((mix) => (
            <MixCard
              key={mix.id}
              variant="horizontal"
              mix={mix}
              onPress={() => navigation.navigate('Player', { mix })}
              onPlay={() => navigation.navigate('Player', { mix })}
            />
          ))}
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
});
