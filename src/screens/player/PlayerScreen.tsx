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
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State, Swipeable } from 'react-native-gesture-handler';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { Mix } from '../../data/mockData';
import { formatDuration } from '../../utils/helpers';
import { useAudioContext } from '../../contexts/AudioContext';
import { useLikeSong } from '../../hooks/useLikeSong';
import { useCoins } from '../../contexts/CoinsContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePlaylists } from '../../contexts/PlaylistContext';
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
  const { balance, earnCoins, sendTip } = useCoins();
  const { user } = useAuth();
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const [showQueue, setShowQueue] = useState(false);

  // Tip modal state
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('5');
  const [sendingTip, setSendingTip] = useState(false);

  // Coin earning state
  const [hasEarnedCoins, setHasEarnedCoins] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

  // Add to Playlist modal state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(null);

  // Vinyl rotation animation
  const vinylRotation = useRef(new Animated.Value(0)).current;
  const vinylAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  // Scale animations
  const playScaleAnim = useRef(new Animated.Value(1)).current;
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;

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

  // ==================== EARN COINS WHEN SONG PLAYS ====================
  useEffect(() => {
    if (mix && audio.isPlaying && audio.currentTime > 5 && !hasEarnedCoins && user) {
      // Earn 1 coin after 5 seconds of playing
      const earnCoinsAsync = async () => {
        const newBalance = await earnCoins(mix.id);
        if (newBalance > balance) {
          setHasEarnedCoins(true);
          setEarnedAmount(1);
          
          // Show coin animation
          Animated.sequence([
            Animated.timing(coinAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(1000),
            Animated.timing(coinAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      };
      earnCoinsAsync();
    }
  }, [mix, audio.isPlaying, audio.currentTime, hasEarnedCoins, user]);

  // Reset earned state when song changes
  useEffect(() => {
    setHasEarnedCoins(false);
    setEarnedAmount(0);
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

  // ==================== TIP FUNCTIONALITY ====================

  const handleTip = useCallback(async () => {
    if (!mix?.artist?.id || !user) return;
    
    const amount = parseInt(tipAmount) || 0;
    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid coin amount.');
      return;
    }

    if (amount > balance) {
      Alert.alert('Insufficient Coins', `You only have ${balance} coins. Earn more by listening to songs!`);
      return;
    }

    if (mix.artist.id === user.id) {
      Alert.alert('Cannot Tip Yourself', 'You cannot tip your own songs.');
      return;
    }

    setSendingTip(true);
    try {
      const result = await sendTip(mix.artist.id, amount);
      
      if (result.success) {
        haptics.success();
        Alert.alert(
          '🎉 Tip Sent!',
          `You tipped ${amount} coins to ${mix.artist?.name || 'the DJ'}!`,
          [{ text: 'OK' }]
        );
        setShowTipModal(false);
        setTipAmount('5');
      } else {
        Alert.alert('Tip Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      Alert.alert('Tip Failed', 'Something went wrong. Please try again.');
    } finally {
      setSendingTip(false);
    }
  }, [mix, user, tipAmount, balance, sendTip]);

  const quickTipAmounts = [5, 10, 25, 50];

  // ==================== ADD TO PLAYLIST ====================

  const handleAddToPlaylist = useCallback(async (playlistId: string) => {
    if (!mix?.id) return;

    setAddingToPlaylistId(playlistId);
    try {
      const success = await addSongToPlaylist(playlistId, mix.id);
      if (success) {
        haptics.success();
        Alert.alert('✅ Added!', 'Song added to playlist');
        setShowPlaylistModal(false);
      } else {
        Alert.alert('Already Added', 'This song is already in the playlist');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add song to playlist');
    } finally {
      setAddingToPlaylistId(null);
    }
  }, [mix?.id, addSongToPlaylist]);

  const handleCreateAndAdd = useCallback(async () => {
    if (!newPlaylistName.trim() || !mix?.id) return;

    setIsCreatingPlaylist(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      if (newPlaylist) {
        await addSongToPlaylist(newPlaylist.id, mix.id);
        haptics.success();
        Alert.alert('✅ Created!', `Playlist "${newPlaylistName}" created and song added`);
        setShowCreatePlaylist(false);
        setShowPlaylistModal(false);
        setNewPlaylistName('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create playlist');
    } finally {
      setIsCreatingPlaylist(false);
    }
  }, [newPlaylistName, mix?.id, createPlaylist, addSongToPlaylist]);

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

        {/* Coin Balance Badge */}
        <View style={styles.coinBadge}>
          <Ionicons name="diamond" size={16} color={Colors.gold} />
          <Text style={styles.coinBadgeText}>{balance}</Text>
        </View>

        {/* Coin Earn Animation */}
        <Animated.View
          style={[
            styles.coinEarnPopup,
            {
              opacity: coinAnim,
              transform: [{
                translateY: coinAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Ionicons name="diamond" size={16} color={Colors.gold} />
          <Text style={styles.coinEarnText}>+{earnedAmount} coin earned!</Text>
        </Animated.View>

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
          <TouchableOpacity style={styles.extraButton} onPress={() => {
            haptics.light();
            setShowPlaylistModal(true);
          }}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
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
          onPress={() => {
            haptics.light();
            setShowTipModal(true);
          }}
        >
          <Ionicons name="gift" size={20} color={Colors.gold} />
          <Text style={styles.tipText}>Tip DJ</Text>
          <View style={styles.tipBalance}>
            <Ionicons name="diamond" size={12} color={Colors.gold} />
            <Text style={styles.tipBalanceText}>{balance}</Text>
          </View>
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

        {/* ==================== TIP MODAL ==================== */}
        <Modal
          visible={showTipModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTipModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💎 Tip {mix.artist?.name || 'DJ'}</Text>
                <TouchableOpacity onPress={() => setShowTipModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Current Balance */}
              <View style={styles.balanceRow}>
                <Ionicons name="diamond" size={20} color={Colors.gold} />
                <Text style={styles.balanceText}>{balance} coins available</Text>
              </View>

              {/* Quick Tip Amounts */}
              <View style={styles.quickAmounts}>
                {quickTipAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.quickAmountButton,
                      tipAmount === String(amount) && styles.quickAmountActive,
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setTipAmount(String(amount));
                    }}
                  >
                    <Ionicons name="diamond" size={14} color={tipAmount === String(amount) ? Colors.white : Colors.gold} />
                    <Text style={[
                      styles.quickAmountText,
                      tipAmount === String(amount) && styles.quickAmountTextActive,
                    ]}>
                      {amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Amount Input */}
              <View style={styles.customAmountContainer}>
                <Text style={styles.customAmountLabel}>Custom Amount</Text>
                <View style={styles.customAmountRow}>
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={() => {
                      const current = parseInt(tipAmount) || 0;
                      if (current > 1) setTipAmount(String(current - 1));
                    }}
                  >
                    <Ionicons name="remove" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.amountInputContainer}>
                    <Ionicons name="diamond" size={18} color={Colors.gold} />
                    <TextInput
                      style={styles.amountInput}
                      value={tipAmount}
                      onChangeText={setTipAmount}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={() => {
                      const current = parseInt(tipAmount) || 0;
                      if (current < balance) setTipAmount(String(current + 1));
                    }}
                  >
                    <Ionicons name="add" size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Send Tip Button */}
              <TouchableOpacity
                style={[
                  styles.sendTipButton,
                  (sendingTip || !tipAmount || parseInt(tipAmount) <= 0 || parseInt(tipAmount) > balance) && styles.sendTipButtonDisabled,
                ]}
                onPress={handleTip}
                disabled={sendingTip || !tipAmount || parseInt(tipAmount) <= 0 || parseInt(tipAmount) > balance}
              >
                {sendingTip ? (
                  <Text style={styles.sendTipText}>Sending...</Text>
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={Colors.white} />
                    <Text style={styles.sendTipText}>
                      Send {tipAmount || '0'} Coins
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Tip Message */}
              <Text style={styles.tipMessage}>
                Support your favorite DJs! They receive 100% of your tip.
              </Text>
            </View>
          </View>
        </Modal>

        {/* ==================== ADD TO PLAYLIST MODAL ==================== */}
        <Modal
          visible={showPlaylistModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPlaylistModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add to Playlist</Text>
                <TouchableOpacity onPress={() => setShowPlaylistModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Create New Playlist Button */}
              <TouchableOpacity
                style={styles.createPlaylistButton}
                onPress={() => setShowCreatePlaylist(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                <Text style={styles.createPlaylistText}>Create New Playlist</Text>
              </TouchableOpacity>

              {/* Existing Playlists */}
              <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <TouchableOpacity
                      key={playlist.id}
                      style={styles.playlistItem}
                      onPress={() => handleAddToPlaylist(playlist.id)}
                      disabled={addingToPlaylistId === playlist.id}
                    >
                      <View style={styles.playlistItemImage}>
                        <Ionicons name="musical-notes" size={24} color={Colors.primary} />
                      </View>
                      <View style={styles.playlistItemInfo}>
                        <Text style={styles.playlistItemName}>{playlist.name}</Text>
                        <Text style={styles.playlistItemCount}>{playlist.song_count} songs</Text>
                      </View>
                      {addingToPlaylistId === playlist.id ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyPlaylists}>
                    <Ionicons name="list-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyPlaylistsText}>No playlists yet</Text>
                    <Text style={styles.emptyPlaylistsSubtext}>Create one to get started</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ==================== CREATE PLAYLIST MODAL ==================== */}
        <Modal
          visible={showCreatePlaylist}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreatePlaylist(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Playlist</Text>
                <TouchableOpacity onPress={() => setShowCreatePlaylist(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.createPlaylistForm}>
                <Text style={styles.createPlaylistLabel}>Playlist Name</Text>
                <TextInput
                  style={styles.createPlaylistInput}
                  placeholder="My Playlist"
                  placeholderTextColor={Colors.textTertiary}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  maxLength={50}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.createPlaylistConfirmButton,
                  (!newPlaylistName.trim() || isCreatingPlaylist) && styles.createPlaylistConfirmDisabled,
                ]}
                onPress={handleCreateAndAdd}
                disabled={!newPlaylistName.trim() || isCreatingPlaylist}
              >
                {isCreatingPlaylist ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.createPlaylistConfirmText}>Create & Add Song</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

  // Coin Badge
  coinBadge: {
    position: 'absolute',
    top: Spacing.xxl + 52,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    zIndex: 10,
  },
  coinBadgeText: {
    ...Typography.bodySmall,
    color: Colors.gold,
    fontWeight: '700',
  },

  // Coin Earn Animation
  coinEarnPopup: {
    position: 'absolute',
    top: Spacing.xxl + 80,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    zIndex: 10,
  },
  coinEarnText: {
    ...Typography.bodySmall,
    color: Colors.black,
    fontWeight: '700',
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
  tipBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '30',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    gap: 4,
  },
  tipBalanceText: {
    ...Typography.caption,
    color: Colors.gold,
    fontWeight: '600',
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

  // ==================== MODAL STYLES ====================
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

  // Tip Modal
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  balanceText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  quickAmountActive: {
    backgroundColor: Colors.gold,
  },
  quickAmountText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  quickAmountTextActive: {
    color: Colors.white,
  },
  customAmountContainer: {
    marginBottom: Spacing.xl,
  },
  customAmountLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  customAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  amountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: 120,
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  amountInput: {
    ...Typography.h2,
    color: Colors.gold,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
  },
  sendTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    height: 56,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sendTipButtonDisabled: {
    opacity: 0.5,
  },
  sendTipText: {
    ...Typography.buttonLarge,
    color: Colors.white,
  },
  tipMessage: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Add to Playlist Modal
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  createPlaylistText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  playlistList: {
    maxHeight: 300,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  playlistItemImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistItemInfo: {
    flex: 1,
  },
  playlistItemName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  playlistItemCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyPlaylists: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyPlaylistsText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyPlaylistsSubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },

  // Create Playlist Modal
  createPlaylistForm: {
    marginBottom: Spacing.xl,
  },
  createPlaylistLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  createPlaylistInput: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  createPlaylistConfirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 48,
  },
  createPlaylistConfirmDisabled: {
    opacity: 0.5,
  },
  createPlaylistConfirmText: {
    ...Typography.button,
    color: Colors.white,
  },
});
