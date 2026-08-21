import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    // Simulate network status checking
    // In production, use NetInfo from @react-native-community/netinfo
    const checkNetwork = () => {
      // For demo, we keep it hidden
      setIsOffline(false);
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -60,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.warning} />
      <Text style={styles.text}>You're offline</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.warning + 'E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        paddingTop: Spacing.xxl + 8,
      },
      android: {
        paddingTop: Spacing.lg,
      },
    }),
  },
  text: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.black,
  },
});
