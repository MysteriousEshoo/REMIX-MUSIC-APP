import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../theme';
import { DJ } from '../data/mockData';
import { formatNumber } from '../utils/helpers';

interface DJCardProps {
  dj: DJ;
  onPress: () => void;
  onFollow?: () => void;
  variant?: 'default' | 'horizontal' | 'compact' | 'top';
  index?: number;
}

export const DJCard: React.FC<DJCardProps> = ({
  dj,
  onPress,
  onFollow,
  variant = 'default',
  index,
}) => {
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: dj.avatar }} style={styles.horizontalAvatar} />
        <View style={styles.horizontalInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{dj.name}</Text>
            {dj.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            )}
          </View>
          <Text style={styles.handle} numberOfLines={1}>{dj.handle}</Text>
          <Text style={styles.genre}>{dj.genre}</Text>
        </View>
        {onFollow && (
          <TouchableOpacity
            style={[styles.followButton, dj.isFollowing && styles.followingButton]}
            onPress={onFollow}
          >
            <Text style={[styles.followText, dj.isFollowing && styles.followingText]}>
              {dj.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'top') {
    return (
      <TouchableOpacity style={styles.topCard} onPress={onPress} activeOpacity={0.7}>
        {index !== undefined && (
          <Text style={styles.topRank}>#{index + 1}</Text>
        )}
        <Image source={{ uri: dj.avatar }} style={styles.topAvatar} />
        <Text style={styles.topName} numberOfLines={1}>{dj.name}</Text>
        <Text style={styles.topFollowers}>{formatNumber(dj.followers)} followers</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: dj.avatar }} style={styles.compactAvatar} />
        <Text style={styles.compactName} numberOfLines={1}>{dj.name}</Text>
        <Text style={styles.compactGenre} numberOfLines={1}>{dj.genre}</Text>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity style={styles.defaultCard} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: dj.avatar }} style={styles.defaultAvatar} />
      <View style={styles.defaultInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{dj.name}</Text>
          {dj.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          )}
        </View>
        <Text style={styles.handle} numberOfLines={1}>{dj.handle}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{formatNumber(dj.followers)} followers</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{dj.mixes} mixes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default
  defaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  defaultAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  defaultInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginRight: 4,
  },
  handle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stat: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  statDot: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginHorizontal: 4,
  },
  genre: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 2,
  },

  // Horizontal
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  horizontalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  followButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  followingButton: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  followText: {
    ...Typography.buttonSmall,
    color: Colors.black,
  },
  followingText: {
    ...Typography.buttonSmall,
    color: Colors.textSecondary,
  },

  // Compact
  compactCard: {
    width: 100,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  compactAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.sm,
  },
  compactName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  compactGenre: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Top ranking
  topCard: {
    width: 100,
    alignItems: 'center',
    marginRight: Spacing.lg,
    position: 'relative',
  },
  topRank: {
    ...Typography.h2,
    color: Colors.gold,
    marginBottom: Spacing.xs,
  },
  topAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Colors.gold,
    marginBottom: Spacing.sm,
  },
  topName: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  topFollowers: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
