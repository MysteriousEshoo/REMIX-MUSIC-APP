import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../theme';
import { Mix } from '../data/mockData';
import { formatDuration, formatNumber } from '../utils/helpers';

interface MixCardProps {
  mix: Mix;
  onPress: () => void;
  onLike?: () => void;
  onPlay?: () => void;
  style?: any;
  variant?: 'default' | 'horizontal' | 'compact' | 'featured';
}

export const MixCard: React.FC<MixCardProps> = ({
  mix,
  onPress,
  onLike,
  onPlay,
  style,
  variant = 'default',
}) => {
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity style={[styles.horizontalCard, style]} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: mix.coverImage }} style={styles.horizontalImage} />
        <View style={styles.horizontalInfo}>
          <Text style={styles.title} numberOfLines={1}>{mix.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{mix.artist.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="headset-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{formatNumber(mix.plays)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{formatDuration(mix.duration)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Ionicons name="play" size={16} color={Colors.black} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={[styles.compactCard, style]} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: mix.coverImage }} style={styles.compactImage} />
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>{mix.title}</Text>
          <Text style={styles.compactArtist} numberOfLines={1}>{mix.artist.name}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={[styles.featuredCard, style]} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: mix.coverImage }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          {mix.isExclusive && (
            <View style={styles.exclusiveBadge}>
              <Ionicons name="diamond" size={10} color={Colors.diamond} />
              <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
            </View>
          )}
          <View style={styles.featuredBottom}>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredTitle} numberOfLines={1}>{mix.title}</Text>
              <Text style={styles.featuredArtist} numberOfLines={1}>{mix.artist.name}</Text>
            </View>
            <TouchableOpacity style={styles.featuredPlayButton} onPress={onPlay}>
              <Ionicons name="play" size={20} color={Colors.black} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity style={[styles.defaultCard, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: mix.coverImage }} style={styles.defaultImage} />
        <TouchableOpacity style={styles.playOverlay} onPress={onPlay}>
          <Ionicons name="play" size={24} color={Colors.black} />
        </TouchableOpacity>
        {mix.isExclusive && (
          <View style={styles.exclusiveBadgeSmall}>
            <Ionicons name="diamond" size={8} color={Colors.diamond} />
          </View>
        )}
      </View>
      <View style={styles.defaultInfo}>
        <Text style={styles.title} numberOfLines={1}>{mix.title}</Text>
        <View style={styles.artistRow}>
          {mix.artist.isVerified && (
            <Ionicons name="checkmark-circle" size={12} color={Colors.primary} style={styles.verifiedIcon} />
          )}
          <Text style={styles.artist} numberOfLines={1}>{mix.artist.name}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatNumber(mix.plays)} plays</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{formatDuration(mix.duration)}</Text>
        </View>
      </View>
      {onLike && (
        <TouchableOpacity style={styles.likeButton} onPress={onLike}>
          <Ionicons
            name={mix.isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={mix.isLiked ? Colors.error : Colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Default card
  defaultCard: {
    width: Layout.cardWidth,
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  defaultImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultInfo: {
    paddingHorizontal: Spacing.xs,
  },
  title: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  artist: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginRight: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  metaDot: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginHorizontal: 4,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  exclusiveBadgeSmall: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.overlayDark,
    borderRadius: BorderRadius.full,
    padding: 4,
  },

  // Horizontal card
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  horizontalImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },

  // Compact card
  compactCard: {
    width: 120,
    marginRight: Spacing.md,
  },
  compactImage: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  compactInfo: {
    paddingHorizontal: Spacing.xs,
  },
  compactTitle: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  compactArtist: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Featured card
  featuredCard: {
    width: Layout.screenWidth - Spacing.xl * 2,
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.lg,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitle: {
    ...Typography.h3,
    color: Colors.white,
    marginBottom: 4,
  },
  featuredArtist: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  featuredPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  exclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayDark,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  exclusiveText: {
    ...Typography.labelSmall,
    color: Colors.diamond,
    marginLeft: 4,
    fontSize: 9,
  },
});
