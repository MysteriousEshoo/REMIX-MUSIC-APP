import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { CoinTransaction } from '../data/mockData';

interface CoinCardProps {
  balance: number;
  totalEarned: number;
  onViewHistory?: () => void;
}

export const CoinCard: React.FC<CoinCardProps> = ({ balance, totalEarned, onViewHistory }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.coinRow}>
          <View style={styles.coinIcon}>
            <Ionicons name="diamond" size={24} color={Colors.gold} />
          </View>
          <View>
            <Text style={styles.balance}>{balance.toLocaleString()}</Text>
            <Text style={styles.label}>Coins</Text>
          </View>
        </View>
        {onViewHistory && (
          <TouchableOpacity onPress={onViewHistory} style={styles.historyButton}>
            <Text style={styles.historyText}>History</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${(balance * 0.01).toFixed(2)}</Text>
          <Text style={styles.statLabel}>Est. Value</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalEarned.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Top 12%</Text>
          <Text style={styles.statLabel}>Ranking</Text>
        </View>
      </View>
    </View>
  );
};

interface CoinTransactionItemProps {
  transaction: CoinTransaction;
}

export const CoinTransactionItem: React.FC<CoinTransactionItemProps> = ({ transaction }) => {
  const getIcon = () => {
    switch (transaction.type) {
      case 'earned': return 'trending-up';
      case 'spent': return 'trending-down';
      case 'tip_sent': return 'gift-outline';
      case 'tip_received': return 'gift';
      case 'payout': return 'wallet-outline';
      default: return 'diamond';
    }
  };

  const getColor = () => {
    switch (transaction.type) {
      case 'earned': return Colors.primary;
      case 'tip_received': return Colors.gold;
      case 'tip_sent': return Colors.info;
      case 'spent': return Colors.warning;
      case 'payout': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'earned': return '+';
      case 'tip_received': return '+';
      case 'spent': return '-';
      case 'tip_sent': return '-';
      case 'payout': return '-';
      default: return '';
    }
  };

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: getColor() + '20' }]}>
        <Ionicons name={getIcon() as any} size={18} color={getColor()} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{transaction.description}</Text>
        <Text style={styles.transactionDate}>{transaction.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: getColor() }]}>
        {getAmountPrefix()}{transaction.amount.toLocaleString()} coins
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  balance: {
    ...Typography.coinLarge,
    fontSize: 32,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    ...Typography.body,
    color: Colors.primary,
    marginRight: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  transactionDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  transactionAmount: {
    ...Typography.body,
    fontWeight: '600',
  },
});
