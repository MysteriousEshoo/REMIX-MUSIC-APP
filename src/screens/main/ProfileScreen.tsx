import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { CoinCard } from '../../components';
import { haptics } from '../../utils/haptics';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const isCreator = true;

  const menuItems = [
    {
      icon: 'diamond' as const,
      title: 'Coins & Rewards',
      subtitle: '12,450 coins',
      onPress: () => { haptics.selection(); navigation.navigate('CreatorDashboard'); },
      iconColor: Colors.gold,
    },
    {
      icon: 'stats-chart' as const,
      title: 'Creator Dashboard',
      subtitle: 'View your analytics',
      onPress: () => { haptics.selection(); navigation.navigate('CreatorDashboard'); },
      iconColor: Colors.primary,
    },
    {
      icon: 'cloud-upload' as const,
      title: 'Upload Mix',
      subtitle: 'Share your latest set',
      onPress: () => { haptics.selection(); navigation.navigate('Upload'); },
      iconColor: Colors.info,
    },
    {
      icon: 'card' as const,
      title: 'Subscription',
      subtitle: 'Listener Plus',
      onPress: () => { haptics.selection(); navigation.navigate('Subscription'); },
      iconColor: Colors.primary,
    },
    {
      icon: 'settings' as const,
      title: 'Settings',
      subtitle: 'Account, privacy, notifications',
      onPress: () => { haptics.selection(); navigation.navigate('Settings'); },
      iconColor: Colors.textSecondary,
    },
    {
      icon: 'help-circle' as const,
      title: 'Help & Support',
      subtitle: 'FAQ, contact us',
      onPress: () => haptics.selection(),
      iconColor: Colors.textSecondary,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => { haptics.selection(); navigation.navigate('Settings'); }}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://picsum.photos/seed/user1/200/200' }}
              style={styles.avatar}
            />
            {isCreator && (
              <View style={styles.badge}>
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>Music Lover</Text>
          <Text style={styles.profileHandle}>@musiclover</Text>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>128</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>1.2K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>Mixes</Text>
            </View>
          </View>
        </View>

        {/* Coin Card */}
        <View style={styles.section}>
          <CoinCard
            balance={12450}
            totalEarned={45200}
            onViewHistory={() => navigation.navigate('CreatorDashboard')}
          />
        </View>

        {/* Quick Actions */}
        {isCreator && (
          <View style={styles.section}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => { haptics.light(); navigation.navigate('Upload'); }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <Ionicons name="cloud-upload" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => { haptics.light(); navigation.navigate('CreatorDashboard'); }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.gold + '20' }]}>
                  <Ionicons name="diamond" size={24} color={Colors.gold} />
                </View>
                <Text style={styles.quickActionText}>Coins</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => { haptics.light(); navigation.navigate('Subscription'); }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + '20' }]}>
                  <Ionicons name="star" size={24} color={Colors.info} />
                </View>
                <Text style={styles.quickActionText}>Pro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => haptics.light()}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E91E63' + '20' }]}>
                  <Ionicons name="gift" size={24} color="#E91E63" />
                </View>
                <Text style={styles.quickActionText}>Refer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => haptics.warning()}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

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
    paddingTop: Spacing.xxl + 40,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: Layout.avatarXL,
    height: Layout.avatarXL,
    borderRadius: Layout.avatarXL / 2,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundElevated,
  },
  profileName: {
    ...Typography.h3,
    marginBottom: 4,
  },
  profileHandle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: (Layout.screenWidth - Spacing.xl * 2) / 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  menuSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoutText: {
    ...Typography.body,
    color: Colors.error,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
});
