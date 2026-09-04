/**
 * PushNotificationContext — Ye file push notifications manage karti hai.
 *
 * KYUN zaruri hai:
 * - User ko real-time notifications milte hain (new song, like, follow)
 * - Device token Supabase mein save hota hai
 * - Notification tap pe sahi screen pe navigate hota hai
 *
 * KAISE kaam karta hai:
 * 1. App load pe permission maangta hai
 * 2. Device token milta hai aur Supabase mein save karta hai
 * 3. Foreground mein notification aaye toh local notification dikhata hai
 * 4. Notification tap pe deep linking handle karta hai
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

// ==================== NOTIFICATION TYPES ====================
export interface PushNotificationData {
  type: 'like' | 'follow' | 'upload' | 'tip' | 'system';
  title: string;
  body: string;
  data?: {
    songId?: string;
    djId?: string;
    screen?: string;
  };
}

interface PushNotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  sendLocalNotification: (data: PushNotificationData) => Promise<void>;
  clearNotification: () => void;
}

// ==================== CONTEXT ====================
const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within PushNotificationProvider');
  }
  return context;
};

// ==================== PROVIDER ====================
export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>(null);
  const responseListener = useRef<Notifications.Subscription>(null);

  // ==================== CONFIGURE NOTIFICATION HANDLER ====================
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  // ==================== REQUEST PERMISSION & GET TOKEN ====================
  const requestPermission = async (): Promise<boolean> => {
    try {
      const existingStatus = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus.status;

      if (existingStatus.status !== 'granted') {
        const result = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = result.status;
      }

      if (finalStatus !== 'granted') {
        setPermissionGranted(false);
        return false;
      }

      setPermissionGranted(true);

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '9754ae70-1c67-474e-a0ed-6410f0c68e85',
      });

      const token = tokenData.data;
      setExpoPushToken(token);

      // Android-specific: create notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'ReMix Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1DB954',
        });

        await Notifications.setNotificationChannelAsync('song-uploads', {
          name: 'New Song Uploads',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1DB954',
        });
      }

      // Save token to Supabase if user is logged in
      if (user) {
        await saveTokenToSupabase(token);
      }

      return true;
    } catch (error) {
      console.log('[PushNotification] Error requesting permission:', error);
      return false;
    }
  };

  // ==================== SAVE TOKEN TO SUPABASE ====================
  const saveTokenToSupabase = async (token: string) => {
    if (!user) return;

    try {
      // Check if token already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('push_tokens')
        .eq('id', user.id)
        .single();

      let updatedTokens: string[] = [];
      
      if (existing?.push_tokens) {
        // Parse existing tokens (stored as JSON string)
        try {
          updatedTokens = JSON.parse(existing.push_tokens);
        } catch {
          updatedTokens = [];
        }
        
        // Add new token if not already present
        if (!updatedTokens.includes(token)) {
          updatedTokens.push(token);
        }
      } else {
        updatedTokens = [token];
      }

      // Update profile with new token
      await supabase
        .from('profiles')
        .update({ push_tokens: JSON.stringify(updatedTokens) })
        .eq('id', user.id);

      console.log('[PushNotification] Token saved to Supabase');
    } catch (error) {
      console.log('[PushNotification] Error saving token:', error);
    }
  };

  // ==================== SEND LOCAL NOTIFICATION ====================
  const sendLocalNotification = async (data: PushNotificationData) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: true,
        },
        trigger: null, // Immediately
      });
    } catch (error) {
      console.log('[PushNotification] Error sending local notification:', error);
    }
  };

  // ==================== CLEAR NOTIFICATION ====================
  const clearNotification = () => {
    setNotification(null);
  };

  // ==================== LISTEN FOR NOTIFICATIONS ====================
  useEffect(() => {
    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Notification tap listener (background/killed state)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationTap(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // ==================== HANDLE NOTIFICATION TAP ====================
  const handleNotificationTap = (data: Record<string, unknown>) => {
    const screen = data.screen as string;
    const songId = data.songId as string;
    const djId = data.djId as string;

    // Store navigation data for AppNavigator to consume
    if (global.onNotificationTap) {
      global.onNotificationTap({ screen, songId, djId });
    }
  };

  // ==================== REQUEST PERMISSION ON LOGIN ====================
  useEffect(() => {
    if (user && !expoPushToken) {
      requestPermission();
    }
  }, [user]);

  return (
    <PushNotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        permissionGranted,
        requestPermission,
        sendLocalNotification,
        clearNotification,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
};

// ==================== GLOBAL TYPE FOR NAVIGATION ====================
declare global {
  var onNotificationTap: ((data: { screen?: string; songId?: string; djId?: string }) => void) | undefined;
}
