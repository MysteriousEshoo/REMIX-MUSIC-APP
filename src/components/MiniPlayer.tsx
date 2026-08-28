/**
 * MiniPlayer — Chota player jo tab screens pe dikhta hai.
 * 
 * KYUN zaruri hai:
 * - Jab full PlayerScreen band ho, audio chalta rahe
 * - User ko pata rahe ki kaunsa gaana chal raha hai
 * - Quick play/pause access mile bina screen change kiye
 * 
 * KAISE kaam karta hai:
 * 1. AudioContext se currentMix aur player state padhta hai
 * 2. Agar koi gaana chal raha hai toh dikhaata hai (song info + play/pause)
 * 3. Tap kare toh full PlayerScreen khule
 * 4. Progress bar dikhata hai kitna ho gaya
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../theme';
import { useAudioContext } from '../contexts/AudioContext';
import { formatDuration } from '../utils/helpers';
import { haptics } from '../utils/haptics';

export const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<any>();
  const { currentMix, isPlaying, currentTime, duration, progress, togglePlayPause } = useAudioContext();

  // Agar koi gaana nahi chal raha toh kuch mat dikhao
  if (!currentMix) return null;

  const handlePlayPause = useCallback(() => {
    haptics.light();
    togglePlayPause();
  }, [togglePlayPause]);

  const handleOpenPlayer = useCallback(() => {
    haptics.selection();
    navigation.navigate('Player', { mix: currentMix });
  }, [navigation, currentMix]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleOpenPlayer}
      activeOpacity={0.9}
    >
      {/* Progress bar — top pe thin line */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(progress || 0) * 100}%` }]} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Album art */}
        <Image source={{ uri: currentMix.coverImage }} style={styles.albumArt} />

        {/* Song info */}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {currentMix.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {currentMix.artist?.name || 'Unknown'}
          </Text>
        </View>

        {/* Time */}
        <Text style={styles.timeText}>
          {formatDuration(currentTime)}
        </Text>

        {/* Play/Pause button */}
        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={handlePlayPause}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color={Colors.white}
            style={!isPlaying ? { marginLeft: 2 } : {}}
          />
        </TouchableOpacity>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            haptics.light();
            // Stop audio — AudioContext mein handle hoga
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 85 : 65, // Tab bar ke upar
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  progressBarBg: {
    height: 2,
    backgroundColor: Colors.textTertiary + '30',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  albumArt: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  songInfo: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  songTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 13,
  },
  songArtist: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
    minWidth: 35,
    textAlign: 'center',
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
