import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { CoinCard, CoinTransactionItem } from '../../components';
import { mockCoinTransactions } from '../../data/mockData';
import { formatNumber, formatCurrency } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';

interface CreatorDashboardScreenProps {
  navigation: any;
}

export const CreatorDashboardScreen: React.FC<CreatorDashboardScreenProps> = ({ navigation }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  const analytics = {
    totalPlays: 245000,
    activeListeners: 12400,
    avgListenTime: '18:32',
    followerGrowth: '+342',
    coinsEarned: 12450,
    estimatedEarnings: 124.50,
  };

  const listenerData = [
    { day: 'Mon', value: 0.6 },
    { day: 'Tue', value: 0.8 },
    { day: 'Wed', value: 0.4 },
    { day: 'Thu', value: 0.9 },
    { day: 'Fri', value: 1.0 },
    { day: 'Sat', value: 0.7 },
    { day: 'Sun', value: 0.5 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <CoinCard
            balance={12450}
            totalEarned={45200}
            onViewHistory={() => {}}
          />
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
                {analytics.followerGrowth}
              </Text>
              <Text style={styles.analyticsLabel}>New Followers</Text>
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
              <Text style={styles.earningsLabel}>Coins This Month</Text>
              <Text style={styles.earningsValue}>{analytics.coinsEarned.toLocaleString()}</Text>
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

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {mockCoinTransactions.map((transaction) => (
            <CoinTransactionItem key={transaction.id} transaction={transaction} />
          ))}
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
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  seeAll: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
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
});
