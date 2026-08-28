import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { formatNumber, formatCurrency } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CreatorDashboardScreenProps {
  navigation: any;
}

interface CreatorAnalytics {
  totalPlays: number;
  activeListeners: number;
  avgListenTime: string;
  followerGrowth: number;
  coinsEarned: number;
  estimatedEarnings: number;
  totalMixes: number;
  totalLikes: number;
  totalFollowers: number;
  recentPlays: number;
}

export const CreatorDashboardScreen: React.FC<CreatorDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<CreatorAnalytics>({
    totalPlays: 0,
    activeListeners: 0,
    avgListenTime: '0:00',
    followerGrowth: 0,
    coinsEarned: 0,
    estimatedEarnings: 0,
    totalMixes: 0,
    totalLikes: 0,
    totalFollowers: 0,
    recentPlays: 0,
  });

  const [listenerData, setListenerData] = useState<{ day: string; value: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Parallel mein sab data fetch karo
      const [songsResult, followersResult, likesOnMySongsResult] = await Promise.all([
        // 1. User ki saari uploads
        supabase
          .from('songs')
          .select('id, plays_count, likes_count, created_at')
          .eq('uploaded_by', user.id),

        // 2. User ke followers count
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('dj_id', user.id),

        // 3. Mere songs pe total likes
        supabase
          .from('songs')
          .select('likes_count')
          .eq('uploaded_by', user.id),
      ]);

      const songs = songsResult.data || [];
      const followerCount = followersResult.count || 0;
      const totalLikes = likesOnMySongsResult.data?.reduce((sum, s) => sum + (s.likes_count || 0), 0) || 0;

      // Total plays
      const totalPlays = songs.reduce((sum, s) => sum + (s.plays_count || 0), 0);

      // Period filter karo
      const now = new Date();
      let periodStart: Date;
      if (period === 'week') {
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === 'month') {
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        periodStart = new Date(0); // All time
      }

      const periodSongs = songs.filter(s => new Date(s.created_at) >= periodStart);
      const recentPlays = periodSongs.reduce((sum, s) => sum + (s.plays_count || 0), 0);

      // Simulated data (yeh baad mein real analytics table se aayega)
      const activeListeners = Math.floor(totalPlays * 0.05); // 5% of plays = active listeners
      const avgListenMinutes = 15 + Math.floor(Math.random() * 20);
      const avgListenSeconds = Math.floor(Math.random() * 60);

      // Coins: 1 play = 1 coin (simplified)
      const coinsEarned = totalPlays;
      const estimatedEarnings = (coinsEarned * 0.001).toFixed(2); // $0.001 per coin

      // Generate weekly listener data
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const baseValue = recentPlays / 7;
      const weekData = weekDays.map((day, i) => ({
        day,
        value: Math.max(0.1, Math.min(1, (baseValue * (0.5 + Math.random())) / (baseValue * 1.2 || 1))),
      }));

      setListenerData(weekData);

      setAnalytics({
        totalPlays,
        activeListeners,
        avgListenTime: `${avgListenMinutes}:${avgListenSeconds.toString().padStart(2, '0')}`,
        followerGrowth: Math.floor(followerCount * 0.1), // 10% growth simulation
        coinsEarned,
        estimatedEarnings: parseFloat(estimatedEarnings),
        totalMixes: songs.length,
        totalLikes,
        totalFollowers: followerCount,
        recentPlays,
      });
    } catch (err) {
      console.log('[CreatorDashboard] Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
  }, [period]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Creator Dashboard</Text>
          <TouchableOpacity style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Coin Balance Card */}
        <View style={styles.section}>
          <View style={styles.coinCard}>
            <View style={styles.coinHeader}>
              <Ionicons name="diamond" size={28} color={Colors.gold} />
              <Text style={styles.coinTitle}>Coin Balance</Text>
            </View>
            <Text style={styles.coinBalance}>{formatNumber(analytics.coinsEarned)}</Text>
            <Text style={styles.coinSubtext}>Total coins earned from your mixes</Text>
            <View style={styles.coinStats}>
              <View style={styles.coinStatItem}>
                <Text style={styles.coinStatValue}>${analytics.estimatedEarnings.toFixed(2)}</Text>
                <Text style={styles.coinStatLabel}>Estimated Value</Text>
              </View>
              <View style={styles.coinStatDivider} />
              <View style={styles.coinStatItem}>
                <Text style={styles.coinStatValue}>15%</Text>
                <Text style={styles.coinStatLabel}>Platform Fee</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {(['week', 'month', 'all'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => { haptics.selection(); setPeriod(p); }}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Analytics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Ionicons name="headset" size={20} color={Colors.primary} />
              <Text style={styles.analyticsValue}>{formatNumber(analytics.totalPlays)}</Text>
              <Text style={styles.analyticsLabel}>Total Plays</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Ionicons name="people" size={20} color={Colors.info} />
              <Text style={styles.analyticsValue}>{formatNumber(analytics.activeListeners)}</Text>
              <Text style={styles.analyticsLabel}>Active Listeners</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Ionicons name="time" size={20} color={Colors.warning} />
              <Text style={styles.analyticsValue}>{analytics.avgListenTime}</Text>
              <Text style={styles.analyticsLabel}>Avg Listen Time</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Ionicons name="trending-up" size={20} color={Colors.success} />
              <Text style={[styles.analyticsValue, { color: Colors.success }]}>
                +{formatNumber(analytics.followerGrowth)}
              </Text>
              <Text style={styles.analyticsLabel}>New Followers</Text>
            </View>
          </View>
        </View>

        {/* Content Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Content</Text>
          <View style={styles.contentStatsCard}>
            <View style={styles.contentStatItem}>
              <Ionicons name="musical-notes" size={20} color={Colors.primary} />
              <View style={styles.contentStatInfo}>
                <Text style={styles.contentStatValue}>{analytics.totalMixes}</Text>
                <Text style={styles.contentStatLabel}>Total Uploads</Text>
              </View>
            </View>
            <View style={styles.contentStatDivider} />
            <View style={styles.contentStatItem}>
              <Ionicons name="heart" size={20} color={Colors.error} />
              <View style={styles.contentStatInfo}>
                <Text style={styles.contentStatValue}>{formatNumber(analytics.totalLikes)}</Text>
                <Text style={styles.contentStatLabel}>Total Likes</Text>
              </View>
            </View>
            <View style={styles.contentStatDivider} />
            <View style={styles.contentStatItem}>
              <Ionicons name="people" size={20} color={Colors.info} />
              <View style={styles.contentStatInfo}>
                <Text style={styles.contentStatValue}>{formatNumber(analytics.totalFollowers)}</Text>
                <Text style={styles.contentStatLabel}>Followers</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Listener Activity Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listener Activity</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {listenerData.map((item, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${item.value * 100}%`,
                          backgroundColor:
                            index === 4 ? Colors.primary : Colors.backgroundHighlight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Coins This Period</Text>
              <Text style={styles.earningsValue}>{formatNumber(analytics.coinsEarned)}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Estimated Cash Value</Text>
              <Text style={[styles.earningsValue, { color: Colors.success }]}>
                {formatCurrency(analytics.estimatedEarnings)}
              </Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Platform Commission</Text>
              <Text style={[styles.earningsValue, { color: Colors.textSecondary }]}>15%</Text>
            </View>
          </View>
        </View>

        {/* Withdraw Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.withdrawButton} onPress={() => haptics.success()}>
            <Ionicons name="wallet-outline" size={20} color={Colors.white} />
            <Text style={styles.withdrawText}>Withdraw Earnings</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => { haptics.light(); navigation.navigate('Upload'); }}
            >
              <Ionicons name="cloud-upload" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Upload New Mix</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => { haptics.light(); navigation.navigate('Notifications'); }}
            >
              <Ionicons name="notifications" size={24} color={Colors.info} />
              <Text style={styles.actionText}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl + 44,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  // Coin Card
  coinCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  coinTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  coinBalance: {
    ...Typography.h1,
    color: Colors.gold,
    marginBottom: Spacing.xs,
  },
  coinSubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  coinStats: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  coinStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  coinStatValue: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.gold,
  },
  coinStatLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  coinStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  // Period
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginHorizontal: Spacing.xl,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.white,
  },
  // Analytics
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  analyticsCard: {
    width: (Layout.screenWidth - Spacing.xl * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  analyticsValue: {
    ...Typography.h2,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  analyticsLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  // Content Stats
  contentStatsCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contentStatInfo: {
    flex: 1,
  },
  contentStatValue: {
    ...Typography.h3,
  },
  contentStatLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  contentStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  // Chart
  chartCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 24,
    height: 100,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  barLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  // Earnings
  earningsCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  earningsLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  earningsValue: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.gold,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 52,
    gap: Spacing.sm,
  },
  withdrawText: {
    ...Typography.button,
    color: Colors.white,
  },
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
