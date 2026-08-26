import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { CoinCard } from '../../components';
import { haptics } from '../../utils/haptics';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';

const MODE_STORAGE_KEY = '@remix_user_mode';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  const [userStats, setUserStats] = useState({
    following: 0,
    followers: 0,
    liked: 0,
    mixes: 0,
  });

  useEffect(() => {
    fetchProfile();
    loadMode();
  }, [user]);

  // Jab screen focus ho toh mode refresh ho
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMode();
      fetchUserStats();
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
      setIsCreatorMode(savedMode === 'creator');
    } catch (err) {
      console.log('Error loading mode:', err);
    }
  };

  const saveMode = async (creator: boolean) => {
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, creator ? 'creator' : 'listener');
    } catch (err) {
      console.log('Error saving mode:', err);
    }
  };

  const toggleMode = () => {
    const newMode = !isCreatorMode;
    const modeName = newMode ? 'Creator' : 'Listener';

    Alert.alert(
      `Switch to ${modeName} Mode?`,
      newMode
        ? 'Creator mode mein aap songs upload kar sakte hain, analytics dekh sakte hain, aur coins kama sakte hain.'
        : 'Listener mode mein aap sirf songs sun sakte hain, like kar sakte hain, aur playlists bana sakte hain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            haptics.medium();
            setIsCreatorMode(newMode);
            saveMode(newMode);
          },
        },
      ]
    );
  };

  // Real-time user stats fetch karo
  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Followers count
      const { count: followerCount } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('dj_id', user.id);

      // Liked songs count
      const { count: likedCount } = await supabase
        .from('user_likes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Uploaded mixes count
      const { count: mixCount } = await supabase
        .from('songs')
        .select('id', { count: 'exact', head: true })
        .eq('uploaded_by', user.id);

      setUserStats({
        following: followingCount || 0,
        followers: followerCount || 0,
        liked: likedCount || 0,
        mixes: mixCount || 0,
      });
    } catch (err) {
      console.log('Error fetching user stats:', err);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setProfile({
          id: user.id,
          username: null,
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: null,
          role: user.user_metadata?.role || 'user',
          created_at: user.created_at,
        });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const creatorMenuItems = [
    {
      icon: 'diamond' as const,
      title: 'Coins & Rewards',
      subtitle: '12,450 coins earned',
      onPress: () => { haptics.selection(); navigation.navigate('CreatorDashboard'); },
      iconColor: Colors.gold,
    },
    {
      icon: 'stats-chart' as const,
      title: 'Creator Dashboard',
      subtitle: 'Analytics & insights',
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
      icon: 'musical-notes' as const,
      title: 'My Uploads',
      subtitle: 'Manage your mixes',
      onPress: () => { haptics.selection(); },
      iconColor: Colors.primary,
    },
  ];

  const listenerMenuItems = [
    {
      icon: 'heart' as const,
      title: 'Liked Songs',
      subtitle: `${userStats.liked} songs`,
      onPress: () => { haptics.selection(); navigation.navigate('Library'); },
      iconColor: Colors.error,
    },
    {
      icon: 'list' as const,
      title: 'My Playlists',
      subtitle: 'Custom collections',
      onPress: () => { haptics.selection(); navigation.navigate('Library'); },
      iconColor: Colors.primary,
    },
    {
      icon: 'download' as const,
      title: 'Downloads',
      subtitle: 'Offline listening',
      onPress: () => { haptics.selection(); navigation.navigate('Library'); },
      iconColor: Colors.info,
    },
    {
      icon: 'card' as const,
      title: 'Subscription',
      subtitle: 'Listener Plus',
      onPress: () => { haptics.selection(); navigation.navigate('Subscription'); },
      iconColor: Colors.gold,
    },
  ];

  const commonMenuItems = [
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

  const activeMenuItems = isCreatorMode ? creatorMenuItems : listenerMenuItems;

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

        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeTab, !isCreatorMode && styles.modeTabActive]}
            onPress={() => {
              if (isCreatorMode) {
                haptics.selection();
                setIsCreatorMode(false);
                saveMode(false);
              }
            }}
          >
            <Ionicons
              name="headset"
              size={18}
              color={!isCreatorMode ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.modeTabText, !isCreatorMode && styles.modeTabTextActive]}>
              Listener
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, isCreatorMode && styles.modeTabActive]}
            onPress={() => {
              if (!isCreatorMode) {
                haptics.selection();
                setIsCreatorMode(true);
                saveMode(true);
              }
            }}
          >
            <Ionicons
              name="mic"
              size={18}
              color={isCreatorMode ? Colors.white : Colors.textSecondary}
            />
            <Text style={[styles.modeTabText, isCreatorMode && styles.modeTabTextActive]}>
              Creator
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://picsum.photos/seed/user1/200/200' }}
              style={styles.avatar}
            />
            {isCreatorMode && (
              <View style={styles.badge}>
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.profileHandle}>@{profile?.username || user?.email?.split('@')[0] || 'user'}</Text>

          {/* Mode Badge */}
          <View style={[styles.modeBadge, { backgroundColor: isCreatorMode ? Colors.primary + '20' : Colors.info + '20' }]}>
            <Ionicons
              name={isCreatorMode ? 'mic' : 'headset'}
              size={14}
              color={isCreatorMode ? Colors.primary : Colors.info}
            />
            <Text style={[styles.modeBadgeText, { color: isCreatorMode ? Colors.primary : Colors.info }]}>
              {isCreatorMode ? 'Creator Mode' : 'Listener Mode'}
            </Text>
          </View>
          
          {/* Stats — Mode ke hisaab se */}
          <View style={styles.statsRow}>
            {isCreatorMode ? (
              // Creator: Following, Followers, Mixes
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatNumber(userStats.following)}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatNumber(userStats.followers)}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatNumber(userStats.mixes)}</Text>
                  <Text style={styles.statLabel}>Mixes</Text>
                </View>
              </>
            ) : (
              // Listener: Following, Liked, Playlists
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatNumber(userStats.following)}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatNumber(userStats.liked)}</Text>
                  <Text style={styles.statLabel}>Liked</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Playlists</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Coin Card — sirf Creator mode */}
        {isCreatorMode && (
          <View style={styles.section}>
            <CoinCard
              balance={0}
              totalEarned={0}
              onViewHistory={() => navigation.navigate('CreatorDashboard')}
            />
          </View>
        )}

        {/* Quick Actions — Mode ke hisaab se */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isCreatorMode ? 'Quick Actions' : 'Quick Access'}
          </Text>
          <View style={styles.quickActions}>
            {isCreatorMode ? (
              <>
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
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => { haptics.light(); navigation.navigate('Library'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: Colors.error + '20' }]}>
                    <Ionicons name="heart" size={24} color={Colors.error} />
                  </View>
                  <Text style={styles.quickActionText}>Liked</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => { haptics.light(); navigation.navigate('Library'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
                    <Ionicons name="list" size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.quickActionText}>Playlists</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => { haptics.light(); navigation.navigate('Library'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + '20' }]}>
                    <Ionicons name="download" size={24} color={Colors.info} />
                  </View>
                  <Text style={styles.quickActionText}>Downloads</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => { haptics.light(); navigation.navigate('Subscription'); }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: Colors.gold + '20' }]}>
                    <Ionicons name="star" size={24} color={Colors.gold} />
                  </View>
                  <Text style={styles.quickActionText}>Pro</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isCreatorMode ? 'Creator Tools' : 'For Listeners'}
          </Text>
          {activeMenuItems.map((item, index) => (
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

        {/* Common Menu */}
        <View style={styles.section}>
          {commonMenuItems.map((item, index) => (
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
          onPress={async () => {
            haptics.warning();
            await signOut();
          }}
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
  modeSwitcher: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.white,
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
    marginBottom: Spacing.md,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  modeBadgeText: {
    ...Typography.bodySmall,
    fontWeight: '600',
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
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
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
