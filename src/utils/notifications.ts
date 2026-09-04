/**
 * Notifications Utility — Ye file push notifications bhejne ke liye helper functions provide karti hai.
 *
 * KYUN zaruri hai:
 * - Jab koi like kare, follow kare, ya upload kare toh DJ ko notification jaaye
 * - Supabase Edge Functions use karke server-side se notification bhejte hain
 *
 * KAISE kaam karta hai:
 * 1. Client-side event hota hai (like, follow, upload)
 * 2. Supabase Edge Function call hoti hai
 * 3. Edge Function user ke device tokens fetch karke push notification bhejti hai
 */

import { supabase } from '../config/supabase';

// ==================== NOTIFICATION TYPES ====================
export type NotificationType = 'like' | 'follow' | 'upload' | 'tip' | 'system';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  targetUserId: string;
  senderUserId: string;
}

// ==================== SAVE IN-APP NOTIFICATION ====================
export const saveInAppNotification = async (payload: NotificationPayload) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.targetUserId,
      type: payload.type,
      title: payload.title,
      message: payload.body,
      is_read: false,
    });

    if (error) {
      console.log('[Notifications] Error saving in-app notification:', error);
    }
  } catch (err) {
    console.log('[Notifications] Error saving in-app notification:', err);
  }
};

// ==================== SEND PUSH NOTIFICATION ====================
export const sendPushNotification = async (payload: NotificationPayload) => {
  try {
    // First, save in-app notification
    await saveInAppNotification(payload);

    // Get target user's push tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_tokens')
      .eq('id', payload.targetUserId)
      .single();

    if (!profile?.push_tokens) {
      console.log('[Notifications] No push tokens found for user:', payload.targetUserId);
      return;
    }

    let tokens: string[] = [];
    try {
      tokens = JSON.parse(profile.push_tokens);
    } catch {
      return;
    }

    if (tokens.length === 0) {
      return;
    }

    // Send push notification to each token using Supabase Edge Function
    // For now, we'll use the Expo push API directly
    for (const token of tokens) {
      await sendExpoPushNotification(token, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        type: payload.type,
      });
    }

    console.log('[Notifications] Push notification sent to', tokens.length, 'devices');
  } catch (error) {
    console.log('[Notifications] Error sending push notification:', error);
  }
};

// ==================== SEND EXPO PUSH NOTIFICATION ====================
const sendExpoPushNotification = async (
  token: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    type: string;
  }
) => {
  try {
    const message = {
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      channelId: payload.type === 'upload' ? 'song-uploads' : 'default',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    if (!response.ok) {
      console.log('[Notifications] Expo push error:', result);
    }
  } catch (error) {
    console.log('[Notifications] Error sending Expo push:', error);
  }
};

// ==================== NOTIFICATION HELPERS ====================

// When someone likes a song
export const notifySongLike = async (
  songId: string,
  songTitle: string,
  likerUserId: string,
  songOwnerId: string
) => {
  if (likerUserId === songOwnerId) return; // Don't notify yourself

  // Get liker's name
  const { data: likerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', likerUserId)
    .single();

  const likerName = likerProfile?.full_name || 'Someone';

  await sendPushNotification({
    type: 'like',
    title: '❤️ New Like!',
    body: `${likerName} liked "${songTitle}"`,
    targetUserId: songOwnerId,
    senderUserId: likerUserId,
    data: { songId, screen: 'Player' },
  });
};

// When someone follows a DJ
export const notifyFollow = async (
  followerUserId: string,
  djId: string
) => {
  if (followerUserId === djId) return; // Don't notify yourself

  // Get follower's name
  const { data: followerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', followerUserId)
    .single();

  const followerName = followerProfile?.full_name || 'Someone';

  await sendPushNotification({
    type: 'follow',
    title: '👤 New Follower!',
    body: `${followerName} started following you`,
    targetUserId: djId,
    senderUserId: followerUserId,
    data: { djId, screen: 'DJProfile' },
  });
};

// When a DJ uploads a new song (notify all followers)
export const notifyNewUpload = async (
  djId: string,
  songId: string,
  songTitle: string
) => {
  // Get DJ's name
  const { data: djProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', djId)
    .single();

  const djName = djProfile?.full_name || 'A DJ';

  // Get all followers of this DJ
  const { data: followers } = await supabase
    .from('user_follows')
    .select('user_id')
    .eq('dj_id', djId);

  if (!followers || followers.length === 0) {
    console.log('[Notifications] No followers to notify for DJ:', djId);
    return;
  }

  // Send notification to each follower
  for (const follower of followers) {
    if (follower.user_id === djId) continue; // Don't notify the DJ themselves

    await sendPushNotification({
      type: 'upload',
      title: '🎵 New Song!',
      body: `${djName} uploaded "${songTitle}"`,
      targetUserId: follower.user_id,
      senderUserId: djId,
      data: { songId, djId, screen: 'Player' },
    });
  }

  console.log('[Notifications] New upload notification sent to', followers.length, 'followers');
};

// When someone tips a DJ
export const notifyTip = async (
  tipperUserId: string,
  djId: string,
  amount: number
) => {
  if (tipperUserId === djId) return; // Don't notify yourself

  // Get tipper's name
  const { data: tipperProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', tipperUserId)
    .single();

  const tipperName = tipperProfile?.full_name || 'Someone';

  await sendPushNotification({
    type: 'tip',
    title: '💎 New Tip!',
    body: `${tipperName} tipped you ${amount} coins`,
    targetUserId: djId,
    senderUserId: tipperUserId,
    data: { screen: 'CreatorDashboard' },
  });
};

// System notification (admin broadcast)
export const notifySystem = async (
  targetUserId: string,
  title: string,
  message: string
) => {
  await sendPushNotification({
    type: 'system',
    title,
    body: message,
    targetUserId,
    senderUserId: 'system',
    data: { screen: 'Notifications' },
  });
};
