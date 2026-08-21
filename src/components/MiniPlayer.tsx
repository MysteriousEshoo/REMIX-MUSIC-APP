import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '../theme';
import { Mix } from '../data/mockData';
import { formatDuration } from '../utils/helpers';

interface MiniPlayerProps {
  mix: Mix | null;
  isPlaying: boolean;
  progress: number; // 0 to 1
  onPress: () => void;
  onPlayPause: () => void;
  onNext?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  mix,
  isPlaying,
  progress,
  onPress,
  onPlayPause,
  onNext,
}) => {
  if (!mix) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Progress bar at top */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        <Image source={{ uri: mix.coverImage }} style={styles.cover} />
        
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{mix.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{mix.artist.name}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={Colors.white}
            />
          </TouchableOpacity>
          {onNext && (
            <TouchableOpacity onPress={onNext} style={styles.nextButton}>
              <Ionicons name="play-skip-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.medium,
    zIndex: 100,
  },
  progressBarBg: {
    height: 2,
    backgroundColor: Colors.backgroundHighlight,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: Layout.miniPlayerHeight,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  artist: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});
