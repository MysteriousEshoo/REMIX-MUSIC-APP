import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * useFollowDJ hook — Kisi bhi DJ ko follow/unfollow karne ke liye
 * 
 * KYUN zaruri hai:
 * - User follow button press kare toh follow save ho
 * - Unfollow kare toh follow delete ho
 * - Library screen mein followed DJs dikh sakein
 * 
 * Supabase Table: user_follows
 * Columns: id, user_id, dj_id, created_at
 */
export const useFollowDJ = (djId: string) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check karo ki user ne ye DJ follow kiya hai ya nahi
  const checkFollowStatus = useCallback(async () => {
    if (!user || !djId) return;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('dj_id', djId)
        .single();

      if (data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (err) {
      setIsFollowing(false);
    }
  }, [user, djId]);

  // Follow/Unfollow toggle
  const toggleFollow = useCallback(async () => {
    if (!user || !djId) return;
    setLoading(true);

    try {
      // Pehle check karo already follow kiya hai ya nahi
      const { data: existing } = await supabase
        .from('user_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('dj_id', djId)
        .single();

      if (existing) {
        // Already following hai — unfollow karo
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('id', existing.id);

        if (!error) {
          setIsFollowing(false);
          setFollowerCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Follow nahi hai — follow karo
        const { error } = await supabase
          .from('user_follows')
          .insert({
            user_id: user.id,
            dj_id: djId,
          });

        if (!error) {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, djId]);

  // DJ ki total followers count nikalo
  const fetchFollowerCount = useCallback(async () => {
    if (!djId) return;

    try {
      const { count, error } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('dj_id', djId);

      if (!error && count !== null) {
        setFollowerCount(count);
      }
    } catch (err) {
      // Count fetch nahi ho paya
    }
  }, [djId]);

  return {
    isFollowing,
    followerCount,
    loading,
    toggleFollow,
    checkFollowStatus,
    fetchFollowerCount,
  };
};
