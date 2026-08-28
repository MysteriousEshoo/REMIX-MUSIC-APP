/**
 * AudioContext — Global audio state + Queue management
 *
 * KYUN zaruri hai:
 * - MiniPlayer ko pata hona chahiye ki kaunsa gaana chal raha hai
 * - PlayerScreen jab close ho toh audio band na ho
 * - Queue system — next/previous song play karna
 * - Background audio — app minimize hone pe bhi chale
 * - Lock screen controls — phone lock pe bhi play/pause/skip
 * - Notification shade controls — Android notification se control
 *
 * KAISE kaam karta hai:
 * 1. App start pe Audio enable hota hai
 * 2. Jab gaana play hota hai, lock screen metadata set hota hai
 * 3. Background mein audio chalta rehta hai (staysActiveInBackground)
 * 4. Auto-play next jab current gaana khatam hota hai
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';
import { Mix } from '../data/mockData';

interface AudioContextType {
  // Current song
  currentMix: Mix | null;
  setCurrentMix: (mix: Mix | null) => void;

  // Queue
  queue: Mix[];
  currentIndex: number;
  setQueue: (songs: Mix[]) => void;
  setCurrentIndex: (index: number) => void;
  addToQueue: (mix: Mix) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  playSongAtIndex: (index: number) => Promise<void>;
  hasNext: boolean;
  hasPrevious: boolean;

  // Player state
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0-1
  isBuffering: boolean;

  // Player controls
  loadAndPlay: (mix: Mix, uri: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seek: (positionSeconds: number) => Promise<void>;
  stop: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<Mix[]>([]);
  const currentIndexRef = useRef(-1);

  const [currentMix, setCurrentMixState] = useState<Mix | null>(null);
  const [queue, setQueueState] = useState<Mix[]>([]);
  const [currentIndex, setCurrentIndexState] = useState(-1);
  const [state, setState] = useState({
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    isBuffering: false,
  });

  // ==================== AUDIO INITIALIZATION ====================

  // App start pe audio system enable karo
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setIsEnabledAsync(true);

        // Set audio mode for background playback + notification controls
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          // Android interruption mode — phone call aane pe pause ho
          interruptionModeAndroid: 1, // AUDIO_MODE_INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
        });
      } catch (err) {
        console.warn('[AudioContext] Failed to initialize audio:', err);
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = async () => {
    clearPlayerInterval();
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
    }
  };

  // ==================== LOCK SCREEN METADATA ====================

  // Lock screen / notification controls ke liye metadata set karo
  const updateLockScreenMetadata = useCallback(async (mix: Mix) => {
    if (!soundRef.current) return;

    try {
      // expo-av Sound object has updateOptions but types may not expose it
      // Cast to any to access the method
      const sound: any = soundRef.current;
      if (sound.updateOptions) {
        await sound.updateOptions({
          android: {
            playIcon: require('../../assets/icon.png'),
            pauseIcon: require('../../assets/icon.png'),
            previousIcon: require('../../assets/icon.png'),
            nextIcon: require('../../assets/icon.png'),
            closeIcon: require('../../assets/icon.png'),
            color: 0x1DB954,
          },
          ios: {
            playIcon: require('../../assets/icon.png'),
            pauseIcon: require('../../assets/icon.png'),
            previousIcon: require('../../assets/icon.png'),
            nextIcon: require('../../assets/icon.png'),
            closeIcon: require('../../assets/icon.png'),
            preferredForwardBufferDuration: 5,
            presentationStyle: 2,
          },
          progressUpdateIntervalMillis: 1000,
        });
      }
    } catch (err) {
      // Lock screen metadata optional hai — fail hone pe ignore karo
      console.warn('[AudioContext] Lock screen metadata update skipped:', err);
    }
  }, []);

  // ==================== PROGRESS TRACKING ====================

  const clearPlayerInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateProgress = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setState(prev => ({ ...prev, isLoaded: false, isPlaying: false }));
      return;
    }

    const currentTime = (status.positionMillis || 0) / 1000;
    const duration = (status.durationMillis || 0) / 1000;
    const progress = duration > 0 ? currentTime / duration : 0;

    setState({
      isPlaying: status.isPlaying,
      isLoaded: true,
      currentTime,
      duration,
      progress,
      isBuffering: status.isBuffering || false,
    });

    // Auto-play next when current song ends
    if (status.didJustFinish && !status.isLooping) {
      const q = queueRef.current;
      const ci = currentIndexRef.current;
      if (ci >= 0 && ci < q.length - 1) {
        // Next song exists — use setTimeout to avoid state update conflict
        setTimeout(() => {
          playSongAtIndex(ci + 1);
        }, 300);
      }
    }
  }, []);

  // ==================== SIMULATED PLAYBACK ====================

  const simulatePlayback = useCallback((durationSec: number) => {
    setState(prev => ({
      ...prev,
      isPlaying: true,
      isLoaded: true,
      duration: prev.duration || durationSec || 3600,
    }));

    clearPlayerInterval();
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.currentTime >= prev.duration && prev.duration > 0) {
          clearPlayerInterval();
          // Auto-play next song
          return { ...prev, isPlaying: false, currentTime: 0, progress: 0 };
        }
        const newTime = prev.currentTime + 1;
        const dur = prev.duration || 3600;
        return {
          ...prev,
          currentTime: newTime,
          progress: newTime / dur,
        };
      });
    }, 1000);
  }, []);

  // ==================== LOAD AND PLAY ====================

  const loadAndPlay = useCallback(async (mix: Mix, uri: string) => {
    try {
      setCurrentMixState(mix);

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        clearPlayerInterval();
      }

      // Audio mode set karo (background + notification controls)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Audio file load karo
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 1000,
        },
        updateProgress
      );

      soundRef.current = sound;

      // Lock screen metadata set karo
      await updateLockScreenMetadata(mix);

      setState(prev => ({ ...prev, isPlaying: true, isLoaded: true }));
    } catch (error) {
      console.warn('[AudioContext] Failed to load audio:', error);
      // Fallback — simulation mode
      setCurrentMixState(mix);
      simulatePlayback(mix.duration || 3600);
    }
  }, [updateProgress, simulatePlayback, updateLockScreenMetadata]);

  // ==================== QUEUE OPERATIONS ====================

  const setQueue = useCallback((songs: Mix[]) => {
    queueRef.current = songs;
    setQueueState(songs);
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    currentIndexRef.current = index;
    setCurrentIndexState(index);
  }, []);

  const addToQueue = useCallback((mix: Mix) => {
    setQueueState(prev => {
      const updated = [...prev, mix];
      queueRef.current = updated;
      return updated;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueueState(prev => {
      const newQueue = [...prev];
      newQueue.splice(index, 1);
      queueRef.current = newQueue;
      if (index < currentIndex) {
        const newIdx = currentIndex - 1;
        currentIndexRef.current = newIdx;
        setCurrentIndexState(newIdx);
      }
      return newQueue;
    });
  }, [currentIndex]);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    currentIndexRef.current = -1;
    setQueueState([]);
    setCurrentIndexState(-1);
  }, []);

  const playSongAtIndex = useCallback(async (index: number) => {
    if (index >= 0 && index < queue.length) {
      const song = queue[index];
      setCurrentIndexState(index);
      setCurrentMixState(song);

      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          clearPlayerInterval();
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Use real audio URL if available
        const audioUri = song.audioUrl || 'https://example.com/mock-audio.mp3';

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          {
            shouldPlay: true,
            progressUpdateIntervalMillis: 1000,
          },
          updateProgress
        );

        soundRef.current = sound;

        // Lock screen metadata update karo
        await updateLockScreenMetadata(song);

        setState(prev => ({ ...prev, isPlaying: true, isLoaded: true }));
      } catch (error) {
        console.warn('[AudioContext] Failed to load from queue:', error);
        simulatePlayback(song.duration || 3600);
      }
    }
  }, [queue, updateProgress, simulatePlayback, updateLockScreenMetadata, clearPlayerInterval]);

  const playNext = useCallback(async () => {
    if (currentIndex < queue.length - 1) {
      const nextIndex = currentIndex + 1;
      await playSongAtIndex(nextIndex);
    }
  }, [currentIndex, queue.length, playSongAtIndex]);

  const playPrevious = useCallback(async () => {
    // Agar 3 seconds se zyada play ho chuka hai toh restart current song
    if (state.currentTime > 3) {
      if (soundRef.current) {
        try {
          await soundRef.current.setPositionAsync(0);
        } catch {
          setState(prev => ({ ...prev, currentTime: 0, progress: 0 }));
        }
      } else {
        setState(prev => ({ ...prev, currentTime: 0, progress: 0 }));
      }
      return;
    }

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      await playSongAtIndex(prevIndex);
    }
  }, [currentIndex, state.currentTime, playSongAtIndex]);

  const hasNext = currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  // ==================== PLAYER CONTROLS ====================

  const play = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
      } catch {
        simulatePlayback(state.duration || 3600);
      }
    } else if (currentMix) {
      simulatePlayback(state.duration || 3600);
    }
  }, [simulatePlayback, state.duration, currentMix]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
      } catch {
        clearPlayerInterval();
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    } else {
      clearPlayerInterval();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback(async (positionSeconds: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(positionSeconds * 1000);
      } catch {
        setState(prev => {
          const dur = prev.duration || 3600;
          return {
            ...prev,
            currentTime: positionSeconds,
            progress: positionSeconds / dur,
          };
        });
      }
    } else {
      setState(prev => {
        const dur = prev.duration || 3600;
        return {
          ...prev,
          currentTime: positionSeconds,
          progress: positionSeconds / dur,
        };
      });
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {
        // ignore
      }
    }
    clearPlayerInterval();
    setCurrentMixState(null);
    setQueueState([]);
    setCurrentIndexState(-1);
    setState({
      isPlaying: false,
      isLoaded: false,
      currentTime: 0,
      duration: 0,
      progress: 0,
      isBuffering: false,
    });
  }, []);

  const setCurrentMix = useCallback((mix: Mix | null) => {
    setCurrentMixState(mix);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentMix,
        setCurrentMix,
        queue,
        currentIndex,
        setQueue,
        setCurrentIndex,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playNext,
        playPrevious,
        playSongAtIndex,
        hasNext,
        hasPrevious,
        ...state,
        loadAndPlay,
        play,
        pause,
        togglePlayPause,
        seek,
        stop,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
