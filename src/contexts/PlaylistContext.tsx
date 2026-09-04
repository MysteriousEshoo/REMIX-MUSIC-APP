/**
 * PlaylistContext — Ye file playlists manage karti hai.
 *
 * KYUN zaruri hai:
 * - User apne playlists create kar sake
 * - Songs ko playlists mein add/remove kar sake
 * - Playlists ka order change kar sake
 * - Library screen mein playlists dikhein
 *
 * KAISE kaam karta hai:
 * 1. Login pe playlists fetch hoti hain
 * 2. Create playlist → Supabase mein save
 * 3. Add song → playlist_songs junction table mein insert
 * 4. Remove song → playlist_songs se delete
 * 5. Delete playlist → playlists se delete (cascade se songs bhi)
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  is_public: boolean;
  song_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at: string;
}

interface PlaylistContextType {
  playlists: Playlist[];
  loading: boolean;
  
  // CRUD Operations
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string, isPublic?: boolean) => Promise<Playlist | null>;
  deletePlaylist: (playlistId: string) => Promise<boolean>;
  updatePlaylist: (playlistId: string, updates: Partial<Pick<Playlist, 'name' | 'description' | 'is_public'>>) => Promise<boolean>;
  
  // Song Operations
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
  getPlaylistSongs: (playlistId: string) => Promise<string[]>;
  isSongInPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
  
  // Utility
  refreshAll: () => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylists must be used within PlaylistProvider');
  }
  return context;
};

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  // ==================== FETCH PLAYLISTS ====================
  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error || !data) {
        setPlaylists([]);
        return;
      }

      // Get song counts for each playlist
      const playlistsWithCounts = await Promise.all(
        data.map(async (playlist) => {
          const { count } = await supabase
            .from('playlist_songs')
            .select('id', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);

          return {
            ...playlist,
            song_count: count || 0,
          };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (err) {
      console.log('[PlaylistContext] Error fetching playlists:', err);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ==================== CREATE PLAYLIST ====================
  const createPlaylist = useCallback(async (
    name: string,
    description: string = '',
    isPublic: boolean = false
  ): Promise<Playlist | null> => {
    if (!user || !name.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim(),
          is_public: isPublic,
        })
        .select()
        .single();

      if (error || !data) {
        console.log('[PlaylistContext] Error creating playlist:', error);
        return null;
      }

      const newPlaylist: Playlist = {
        ...data,
        song_count: 0,
      };

      setPlaylists(prev => [newPlaylist, ...prev]);
      console.log('[PlaylistContext] Playlist created:', data.id);
      return newPlaylist;
    } catch (err) {
      console.log('[PlaylistContext] Error creating playlist:', err);
      return null;
    }
  }, [user]);

  // ==================== DELETE PLAYLIST ====================
  const deletePlaylist = useCallback(async (playlistId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete playlist (cascade will delete playlist_songs)
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        console.log('[PlaylistContext] Error deleting playlist:', error);
        return false;
      }

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      console.log('[PlaylistContext] Playlist deleted:', playlistId);
      return true;
    } catch (err) {
      console.log('[PlaylistContext] Error deleting playlist:', err);
      return false;
    }
  }, [user]);

  // ==================== UPDATE PLAYLIST ====================
  const updatePlaylist = useCallback(async (
    playlistId: string,
    updates: Partial<Pick<Playlist, 'name' | 'description' | 'is_public'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('playlists')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) {
        console.log('[PlaylistContext] Error updating playlist:', error);
        return false;
      }

      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        )
      );
      console.log('[PlaylistContext] Playlist updated:', playlistId);
      return true;
    } catch (err) {
      console.log('[PlaylistContext] Error updating playlist:', err);
      return false;
    }
  }, [user]);

  // ==================== ADD SONG TO PLAYLIST ====================
  const addSongToPlaylist = useCallback(async (
    playlistId: string,
    songId: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if song already exists in playlist
      const { data: existing } = await supabase
        .from('playlist_songs')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('song_id', songId)
        .maybeSingle();

      if (existing) {
        console.log('[PlaylistContext] Song already in playlist');
        return false;
      }

      // Get max position
      const { data: maxPosData } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newPosition = (maxPosData?.position ?? -1) + 1;

      // Add song
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          position: newPosition,
        });

      if (error) {
        console.log('[PlaylistContext] Error adding song to playlist:', error);
        return false;
      }

      // Update playlist timestamp and song count
      await supabase
        .from('playlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', playlistId);

      // Update local state
      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId ? { ...p, song_count: p.song_count + 1 } : p
        )
      );

      console.log('[PlaylistContext] Song added to playlist:', playlistId, songId);
      return true;
    } catch (err) {
      console.log('[PlaylistContext] Error adding song to playlist:', err);
      return false;
    }
  }, [user]);

  // ==================== REMOVE SONG FROM PLAYLIST ====================
  const removeSongFromPlaylist = useCallback(async (
    playlistId: string,
    songId: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);

      if (error) {
        console.log('[PlaylistContext] Error removing song from playlist:', error);
        return false;
      }

      // Update playlist timestamp and song count
      await supabase
        .from('playlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', playlistId);

      // Update local state
      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId ? { ...p, song_count: Math.max(0, p.song_count - 1) } : p
        )
      );

      console.log('[PlaylistContext] Song removed from playlist:', playlistId, songId);
      return true;
    } catch (err) {
      console.log('[PlaylistContext] Error removing song from playlist:', err);
      return false;
    }
  }, [user]);

  // ==================== GET PLAYLIST SONGS ====================
  const getPlaylistSongs = useCallback(async (playlistId: string): Promise<string[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('playlist_songs')
        .select('song_id')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error || !data) return [];
      return data.map(ps => ps.song_id);
    } catch (err) {
      console.log('[PlaylistContext] Error getting playlist songs:', err);
      return [];
    }
  }, [user]);

  // ==================== CHECK IF SONG IN PLAYLIST ====================
  const isSongInPlaylist = useCallback(async (
    playlistId: string,
    songId: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('playlist_songs')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('song_id', songId)
        .maybeSingle();

      return !!data;
    } catch (err) {
      return false;
    }
  }, [user]);

  // ==================== REFRESH ALL ====================
  const refreshAll = useCallback(async () => {
    await fetchPlaylists();
  }, [fetchPlaylists]);

  // ==================== INITIALIZE ====================
  useEffect(() => {
    if (user) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [user]);

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        loading,
        fetchPlaylists,
        createPlaylist,
        deletePlaylist,
        updatePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        getPlaylistSongs,
        isSongInPlaylist,
        refreshAll,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};
