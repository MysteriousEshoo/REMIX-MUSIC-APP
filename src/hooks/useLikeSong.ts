import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { notifySongLike } from '../utils/notifications';

/**
 * useLikeSong hook — Kisi bhi song ko like/unlike karne ke liye
 * 
 * Supabase Table: user_likes
 * Columns: id, user_id, song_id, created_at
 */
export const useLikeSong = (songId: string) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);

  // Check karo ki user ne ye song like kiya hai ya nahi
  const checkLikeStatus = useCallback(async () => {
    if (!user || !songId) {
      setIsLiked(false);
      setStatusChecked(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .maybeSingle();  // maybeSingle use karo — row na mile toh null return karega, error nahi

      if (error) {
        console.log('[useLikeSong] checkLikeStatus error:', error.message);
      }
      setIsLiked(!!data);
    } catch (err) {
      console.log('[useLikeSong] checkLikeStatus catch:', err);
      setIsLiked(false);
    } finally {
      setStatusChecked(true);
    }
  }, [user, songId]);

  // Mount pe automatically check karo
  useEffect(() => {
    checkLikeStatus();
  }, [checkLikeStatus]);

  // Like/Unlike toggle
  const likeSong = useCallback(async () => {
    if (!user || !songId) {
      console.log('[useLikeSong] likeSong skipped — user:', !!user, 'songId:', songId);
      return;
    }

    setLoading(true);
    const previousLiked = isLiked;

    try {
      // Optimistic update — turant UI change karo
      setIsLiked(!previousLiked);

      if (previousLiked) {
        // UNLIKE — delete from user_likes
        console.log('[useLikeSong] Unlike kar raha hoon:', songId);
        const { data: existing, error: findErr } = await supabase
          .from('user_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('song_id', songId)
          .maybeSingle();

        if (findErr) {
          console.log('[useLikeSong] Find existing error:', findErr.message);
        }

        if (existing) {
          const { error } = await supabase
            .from('user_likes')
            .delete()
            .eq('id', existing.id);

          if (error) {
            console.log('[useLikeSong] DELETE error:', error.message);
            setIsLiked(previousLiked); // Revert
          } else {
            console.log('[useLikeSong] ✅ Unlike SUCCESS');
          }
        } else {
          console.log('[useLikeSong] No existing like found to delete');
        }
      } else {
        // LIKE — insert into user_likes
        console.log('[useLikeSong] Like kar raha hoon:', songId, 'user:', user.id);
        const { data, error } = await supabase
          .from('user_likes')
          .insert({
            user_id: user.id,
            song_id: songId,
          })
          .select();

        if (error) {
          console.log('[useLikeSong] ❌ INSERT error:', error.message, error.code, error.details);
          setIsLiked(previousLiked); // Revert optimistic update
        } else {
          console.log('[useLikeSong] ✅ Like SUCCESS — inserted:', data);
          
          // Send notification to song owner
          await sendLikeNotification(songId, user.id);
        }
      }
    } catch (err) {
      console.log('[useLikeSong] ❌ likeSong CATCH error:', err);
      setIsLiked(previousLiked); // Revert
    } finally {
      setLoading(false);
    }
  }, [user, songId, isLiked]);

  // Song owner ko notification bhejo
  const sendLikeNotification = async (songId: string, likerUserId: string) => {
    try {
      // Get song details and owner
      const { data: song } = await supabase
        .from('songs')
        .select('title, uploaded_by')
        .eq('id', songId)
        .single();

      if (song && song.uploaded_by) {
        await notifySongLike(
          songId,
          song.title,
          likerUserId,
          song.uploaded_by
        );
      }
    } catch (err) {
      console.log('[useLikeSong] Error sending like notification:', err);
    }
  };

  // Song ki total likes count nikalo
  const fetchLikeCount = useCallback(async () => {
    if (!songId) return;

    try {
      const { count, error } = await supabase
        .from('user_likes')
        .select('id', { count: 'exact', head: true })
        .eq('song_id', songId);

      if (!error && count !== null) {
        setLikeCount(count);
      }
    } catch (err) {
      // Count fetch nahi ho paya
    }
  }, [songId]);

  return {
    isLiked,
    likeCount,
    loading,
    statusChecked,
    likeSong,
    checkLikeStatus,
    fetchLikeCount,
  };
};
