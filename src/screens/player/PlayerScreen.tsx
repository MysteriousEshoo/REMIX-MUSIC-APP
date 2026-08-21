import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { Mix } from '../../data/mockData';
import { formatDuration } from '../../utils/helpers';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { haptics } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

interface PlayerScreenProps {
  navigation: any;
  route: any;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation, route }) => {
  const mix: Mix | undefined = route?.params?.mix;
  const [isLiked, setIsLiked] = useState(mix?.isLiked || false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const audio = useAudioPlayer();

  // Vinyl rotation animation
  const vinylRotation = useRef(new Animated.Value(0)).current;
  const vinylAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Scale animations
  const playScaleAnim = useRef(new Animated.Value(1)).current;
  const likeScaleAnim = useRef(new Animated.Value(1)).current;

  // Start vinyl spinning when playing
  useEffect(() => {
    if (audio.isPlaying) {
      vinylAnimRef.current = Animated.loop(
        Animated.timing(vinylRotation, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );
      vinylAnimRef.current.start();
    } else {
      vinylAnimRef.current?.stop();
    }
    return () => {
      vinylAnimRef.current?.stop();
    };
  }, [audio.isPlaying]);

  // Load audio when mix changes
  useEffect(() => {
    if (mix?.coverImage) {
      // Try to load a mock audio URI; will fall back to simulated playback
      audio.loadAndPlay('https://example.com/mock-audio.mp3');
    }
  }, [mix?.id]);

  const handlePlayPause = useCallback(() => {
    haptics.light();
    Animated.sequence([
      Animated.timing(playScaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(playScaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    audio.togglePlayPause();
  }, [audio.togglePlayPause]);

  const handleLike = useCallback(() => {
    haptics.medium();
    setIsLiked(prev => !prev);
    Animated.sequence([
      Animated.timing(likeScaleAnim, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(likeScaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSeek = useCallback((position: number) => {
    haptics.selection();
    audio.seek(position);
  }, [audio.seek]);

  const handleSkipBack = useCallback(() => {
    haptics.light();
    audio.seek(Math.max(0, audio.currentTime - 15));
  }, [audio.seek, audio.currentTime]);

  const handleSkipForward = useCallback(() => {
    haptics.light();
    audio.seek(Math.min(audio.duration, audio.currentTime + 15));
  }, [audio.seek, audio.currentTime, audio.duration]);

  if (!mix) return null;

  const vinylSpin = vinylRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background}>
        <Image source={{ uri: mix.coverImage }} style={styles.bgImage} />
        <View style={styles.bgOverlay} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }} style={styles.headerButton}>
          <Ionicons name="chevron-down" size={28} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>Playing from</Text>
          <Text style={styles.headerSource}>{mix.genre}</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Album Art with Vinyl */}
      <View style={styles.artworkContainer}>
        <View style={styles.artworkWrapper}>
          {/* Vinyl disc behind artwork */}
          <Animated.View style={[styles.vinylDisc, { transform: [{ rotate: vinylSpin }] }]}>
            <View style={styles.vinylOuter}>
              <View style={styles.vinylGrooves} />
              <View style={styles.vinylInner}>
                <View style={styles.vinylLabel} />
              </View>
            </View>
          </Animated.View>

          {/* Album artwork on top */}
          <Animated.View style={[styles.artworkFront, { transform: [{ scale: playScaleAnim }] }]}>
            <Image source={{ uri: mix.coverImage }} style={styles.artwork} />
            <View style={styles.artworkShadow} />
          </Animated.View>
        </View>
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <View style={styles.trackInfoRow}>
          <View style={styles.trackTextContainer}>
            <Text style={styles.trackTitle} numberOfLines={1}>{mix.title}</Text>
            <View style={styles.artistRow}>
              {mix.artist?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              )}
              <Text style={styles.trackArtist} numberOfLines={1}>{mix.artist?.name}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
            <Animated.View style={{ transform: [{ scale: likeScaleAnim }] }}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={28}
                color={isLiked ? Colors.primary : Colors.white}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <TouchableOpacity
          style={styles.progressBarTouchable}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            const barWidth = width - Spacing.xxl * 2;
            const ratio = Math.max(0, Math.min(1, x / barWidth));
            handleSeek(ratio * audio.duration);
          }}
          activeOpacity={1}
        >
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(audio.progress || 0) * 100}%` }]}>
              <View style={styles.progressDot} />
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatDuration(audio.currentTime)}</Text>
          <Text style={styles.timeText}>{formatDuration(audio.duration || mix.duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => { haptics.selection(); setIsShuffled(!isShuffled); }}
          style={styles.controlButton}
        >
          <Ionicons
            name="shuffle"
            size={22}
            color={isShuffled ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleSkipBack}>
          <Ionicons name="play-skip-back" size={28} color={Colors.white} />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: playScaleAnim }] }}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <Ionicons
              name={audio.isPlaying ? 'pause' : 'play'}
              size={32}
              color={Colors.white}
              style={audio.isPlaying ? {} : { marginLeft: 3 }}
            />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.controlButton} onPress={handleSkipForward}>
          <Ionicons name="play-skip-forward" size={28} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            haptics.selection();
            setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');
          }}
          style={styles.controlButton}
        >
          <Ionicons
            name={repeatMode === 'one' ? 'repeat' : 'repeat-outline'}
            size={22}
            color={repeatMode !== 'off' ? Colors.primary : Colors.textSecondary}
          />
          {repeatMode === 'one' && (
            <Text style={styles.repeatBadge}>1</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Extra Controls */}
      <View style={styles.extraControls}>
        <TouchableOpacity style={styles.extraButton}>
          <Ionicons name="airplane" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.extraButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.extraButton}>
          <Ionicons name="list" size={20} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.extraButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tip Button */}
      <TouchableOpacity
        style={styles.tipButton}
        onPress={() => haptics.success()}
      >
        <Ionicons name="gift" size={20} color={Colors.gold} />
        <Text style={styles.tipText}>Tip DJ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 44,
    paddingBottom: Spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  headerSource: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.white,
  },

  // Artwork + Vinyl
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  artworkWrapper: {
    position: 'relative',
    width: width * 0.7,
    height: width * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylDisc: {
    position: 'absolute',
    width: width * 0.72,
    height: width * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylOuter: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.72) / 2,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  vinylGrooves: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: (width * 0.72 * 0.9) / 2,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
  },
  vinylInner: {
    width: '35%',
    height: '35%',
    borderRadius: (width * 0.72 * 0.35) / 2,
    backgroundColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylLabel: {
    width: '50%',
    height: '50%',
    borderRadius: (width * 0.72 * 0.35 * 0.5) / 2,
    backgroundColor: Colors.primary,
  },
  artworkFront: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    zIndex: 2,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 16,
  },

  // Track Info
  trackInfo: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  trackInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  trackTitle: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: 4,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackArtist: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    marginLeft: 4,
  },
  likeButton: {
    padding: Spacing.sm,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  progressBarTouchable: {
    paddingVertical: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.textTertiary + '40',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 2,
    position: 'relative',
  },
  progressDot: {
    position: 'absolute',
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  timeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },

  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatBadge: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Extra Controls
  extraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xxxl,
    marginBottom: Spacing.xxl,
  },
  extraButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tip Button
  tipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tipText: {
    ...Typography.button,
    color: Colors.gold,
  },
});
