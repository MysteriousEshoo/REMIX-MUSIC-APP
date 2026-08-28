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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State, Swipeable } from 'react-native-gesture-handler';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { Mix } from '../../data/mockData';
import { formatDuration } from '../../utils/helpers';
import { useAudioContext } from '../../contexts/AudioContext';
import { useLikeSong } from '../../hooks/useLikeSong';
import { haptics } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;
const QUEUE_ITEM_HEIGHT = 56;

interface PlayerScreenProps {
  navigation: any;
  route: any;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation, route }) => {
  const mix: Mix | undefined = route?.params?.mix;
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const audio = useAudioContext();
  const { isLiked, likeSong, statusChecked } = useLikeSong(mix?.id || '');
  const [showQueue, setShowQueue] = useState(false);

  // Vinyl rotation animation
  const vinylRotation = useRef(new Animated.Value(0)).current;
  const vinylAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Scale animations
  const playScaleAnim = useRef(new Animated.Value(1)).current;
  const likeScaleAnim = useRef(new Animated.Value(1)).current;

  // Drag state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const dragItemHeight = useRef(0);

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

  // Load audio when mix changes + find position in queue
  useEffect(() => {
    if (mix) {
      const queueIndex = audio.queue.findIndex(q => q.id === mix.id);
      if (queueIndex >= 0) {
        audio.setCurrentMix(mix);
      } else {
        if (audio.queue.length === 0) {
          audio.setQueue([mix]);
        } else {
          audio.addToQueue(mix);
        }
        audio.setCurrentMix(mix);
      }
      audio.loadAndPlay(mix, mix.audioUrl || 'https://example.com/mock-audio.mp3');
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

  const handleLike = useCallback(async () => {
    haptics.medium();
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
    await likeSong();
  }, [likeSong]);

  const handleSeek = useCallback((position: number) => {
    haptics.selection();
    audio.seek(position);
  }, [audio.seek]);

  const handleSkipBack = useCallback(() => {
    haptics.light();
    audio.playPrevious();
  }, [audio.playPrevious]);

  const handleSkipForward = useCallback(() => {
    haptics.light();
    audio.playNext();
  }, [audio.playNext]);

  // ==================== SWIPE TO DELETE ====================

  const renderSwipeActions = useCallback((progress: Animated.AnimatedInterpolation<number>, index: number) => {
    const translateX = progress.interpolate({
      inputRange: [-100, 0],
      outputRange: [80, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <Ionicons name="trash" size={20} color={Colors.white} />
        <Text style={styles.deleteActionText}>Delete</Text>
      </Animated.View>
    );
  }, []);

  const handleSwipeDelete = useCallback((index: number) => {
    haptics.medium();
    audio.removeFromQueue(index);
  }, [audio.removeFromQueue]);

  // ==================== DRAG TO REORDER ====================

  const handleDragStart = useCallback((index: number) => {
    haptics.medium();
    setDraggingIndex(index);
  }, []);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex && toIndex >= 0 && toIndex < audio.queue.length) {
      haptics.success();
      audio.reorderQueue(fromIndex, toIndex);
    }
    setDraggingIndex(null);
    dragTranslateY.setValue(0);
  }, [audio.reorderQueue, audio.queue.length]);

  // ==================== QUEUE ITEM COMPONENT ====================

  const QueueItem = useCallback(({ song, index }: { song: Mix; index: number }) => {
    const isCurrentlyPlaying = index === audio.currentIndex;
    const isDragging = draggingIndex === index;

    // Pan gesture for drag reorder
    const panRef = useRef<any>(null);
    const itemTranslateY = useRef(new Animated.Value(0)).current;
    const itemScale = useRef(new Animated.Value(1)).current;
    const lastTap = useRef(0);

    const onPanGestureEvent = Animated.event(
      [{ nativeEvent: { translationY: itemTranslateY } }],
      { useNativeDriver: true }
    );

    const onPanHandlerStateChange = (event: any) => {
      if (event.oldState === State.ACTIVE) {
        const translationY = event.nativeEvent.translationY;
        const itemIndex = index;

        // Calculate target index based on translation
        const targetIndex = Math.round(itemIndex + translationY / QUEUE_ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(audio.queue.length - 1, targetIndex));

        // Animate to final position
        Animated.spring(itemTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();

        Animated.spring(itemScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        handleDragEnd(itemIndex, clampedIndex);
      } else if (event.nativeEvent.state === State.ACTIVE) {
        // Drag start — scale up slightly
        Animated.spring(itemScale, {
          toValue: 1.05,
          useNativeDriver: true,
        }).start();
      }
    };

    return (
      <Swipeable
        renderRightActions={(progress) => renderSwipeActions(progress, index)}
        onSwipeableOpen={() => handleSwipeDelete(index)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanHandlerStateChange}
          simultaneousHandlers={[]}
          enabled={!isCurrentlyPlaying}
        >
          <Animated.View
            style={[
              styles.queueItem,
              isCurrentlyPlaying && styles.queueItemActive,
              isDragging && styles.queueItemDragging,
              {
                transform: [{ translateY: itemTranslateY }, { scale: itemScale }],
                zIndex: isDragging ? 100 : 1,
              },
            ]}
          >
            {/* Drag Handle */}
            {!isCurrentlyPlaying && (
              <View style={styles.dragHandle}>
                <Ionicons name="reorder-three" size={18} color={Colors.textTertiary} />
              </View>
            )}

            {/* Album Art */}
            <Image source={{ uri: song.coverImage }} style={styles.queueItemImage} />

            {/* Song Info */}
            <View style={styles.queueItemInfo}>
              <Text
                style={[styles.queueItemTitle, isCurrentlyPlaying && styles.queueItemTitleActive]}
                numberOfLines={1}
              >
                {song.title}
              </Text>
              <Text style={styles.queueItemArtist} numberOfLines={1}>
                {song.artist?.name || 'Unknown'}
              </Text>
            </View>

            {/* Currently Playing Indicator */}
            {isCurrentlyPlaying && (
              <View style={styles.nowPlayingIndicator}>
                <Ionicons name="musical-note" size={16} color={Colors.primary} />
              </View>
            )}

            {/* Play Button (tap to play) */}
            {!isCurrentlyPlaying && (
              <TouchableOpacity
                style={styles.queuePlayButton}
                onPress={() => {
                  haptics.selection();
                  audio.playSongAtIndex(index);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="play" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </PanGestureHandler>
      </Swipeable>
    );
  }, [audio.currentIndex, audio.queue.length, audio.playSongAtIndex, draggingIndex, renderSwipeActions, handleSwipeDelete, handleDragEnd]);

  if (!mix) return null;

  const vinylSpin = vinylRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Animated.View style={[styles.vinylDisc, { transform: [{ rotate: vinylSpin }] }]}>
              <View style={styles.vinylOuter}>
                <View style={styles.vinylGrooves} />
                <View style={styles.vinylInner}>
                  <View style={styles.vinylLabel} />
                </View>
              </View>
            </Animated.View>

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
                color={Colors.black}
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
          <TouchableOpacity style={styles.extraButton} onPress={() => { haptics.selection(); setShowQueue(!showQueue); }}>
            <Ionicons name="list" size={20} color={showQueue ? Colors.primary : Colors.white} />
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

        {/* Queue List */}
        {showQueue && (
          <View style={styles.queueContainer}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>Up Next</Text>
              <Text style={styles.queueCount}>{audio.queue.length} songs</Text>
            </View>
            <ScrollView style={styles.queueList} showsVerticalScrollIndicator={false}>
              {audio.queue.map((song, index) => (
                <QueueItem key={song.id + '-' + index} song={song} index={index} />
              ))}
            </ScrollView>
            <View style={styles.queueHint}>
              <Ionicons name="swap-vertical" size={14} color={Colors.textTertiary} />
              <Text style={styles.queueHintText}>Drag to reorder • Swipe left to delete</Text>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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

  // Queue
  queueContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  queueTitle: {
    ...Typography.h4,
    color: Colors.white,
  },
  queueCount: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  queueList: {
    maxHeight: 250,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    backgroundColor: 'transparent',
  },
  queueItemActive: {
    backgroundColor: Colors.primary + '20',
  },
  queueItemDragging: {
    backgroundColor: Colors.primary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  queueItemImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  queueItemTitleActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  queueItemArtist: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  nowPlayingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  queuePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: QUEUE_ITEM_HEIGHT,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  deleteActionText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  queueHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  queueHintText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
