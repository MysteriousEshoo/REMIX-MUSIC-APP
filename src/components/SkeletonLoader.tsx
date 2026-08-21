import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.backgroundHighlight,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton layouts
export const SkeletonMixCard: React.FC = () => (
  <View style={skeletonStyles.card}>
    <SkeletonLoader width="100%" height={120} borderRadius={BorderRadius.md} />
    <SkeletonLoader width="80%" height={14} style={{ marginTop: Spacing.sm }} />
    <SkeletonLoader width="60%" height={12} style={{ marginTop: Spacing.xs }} />
  </View>
);

export const SkeletonHorizontalCard: React.FC = () => (
  <View style={skeletonStyles.horizontalCard}>
    <SkeletonLoader width={56} height={56} borderRadius={BorderRadius.sm} />
    <View style={{ flex: 1, marginLeft: Spacing.md }}>
      <SkeletonLoader width="70%" height={14} />
      <SkeletonLoader width="50%" height={12} style={{ marginTop: Spacing.xs }} />
    </View>
  </View>
);

export const SkeletonDJCard: React.FC = () => (
  <View style={skeletonStyles.djCard}>
    <SkeletonLoader width={80} height={80} borderRadius={40} />
    <SkeletonLoader width={60} height={12} style={{ marginTop: Spacing.sm }} />
    <SkeletonLoader width={40} height={10} style={{ marginTop: Spacing.xs }} />
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: Spacing.md,
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  djCard: {
    width: 100,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
});
