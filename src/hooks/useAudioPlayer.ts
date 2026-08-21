import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0-1
  isBuffering: boolean;
}

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    isBuffering: false,
  });

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
  }, []);

  const loadAndPlay = useCallback(async (uri: string) => {
    try {
      // Unload previous sound
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

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        updateProgress
      );

      soundRef.current = sound;
      setState(prev => ({ ...prev, isPlaying: true, isLoaded: true }));
    } catch (error) {
      console.warn('[AudioPlayer] Failed to load:', error);
      // For mock data URIs that don't exist, simulate playback
      simulatePlayback();
    }
  }, [updateProgress]);

  const simulatePlayback = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: true,
      isLoaded: true,
      duration: prev.duration || 3600,
    }));

    clearPlayerInterval();
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.currentTime >= prev.duration && prev.duration > 0) {
          clearPlayerInterval();
          return { ...prev, isPlaying: false, currentTime: 0, progress: 0 };
        }
        const newTime = prev.currentTime + 1;
        const duration = prev.duration || 3600;
        return {
          ...prev,
          currentTime: newTime,
          progress: newTime / duration,
        };
      });
    }, 1000);
  }, []);

  const play = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
      } catch {
        simulatePlayback();
      }
    } else {
      simulatePlayback();
    }
  }, [simulatePlayback]);

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
          const duration = prev.duration || 3600;
          return {
            ...prev,
            currentTime: positionSeconds,
            progress: positionSeconds / duration,
          };
        });
      }
    } else {
      setState(prev => {
        const duration = prev.duration || 3600;
        return {
          ...prev,
          currentTime: positionSeconds,
          progress: positionSeconds / duration,
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
    setState({
      isPlaying: false,
      isLoaded: false,
      currentTime: 0,
      duration: 0,
      progress: 0,
      isBuffering: false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPlayerInterval();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    ...state,
    loadAndPlay,
    play,
    pause,
    togglePlayPause,
    seek,
    stop,
  };
}
