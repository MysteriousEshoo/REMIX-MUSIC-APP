import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard, DJCard, SkeletonMixCard, SkeletonHorizontalCard } from '../../components';
import { mockMixes, mockDJs, Mix } from '../../data/mockData';
import { getGreeting } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAudioContext } from '../../contexts/AudioContext';

const MODE_STORAGE_KEY = '@remix_user_mode';
const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

// Animated list item wrapper
const AnimatedListItem: React.FC<{ children: React.ReactNode; index: number; delay?: number }> = ({
  children,
  index,
  delay = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay + index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay + index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

// Creator Stats type
interface CreatorStats {
  totalPlays: number;
  totalLikes: number;
  totalFollowers: number;
  totalCoins: number;
  totalMixes: number;
  recentPlays: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { setQueue, setCurrentMix } = useAudioContext();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChip, setSelectedChip] = useState('All');
  const [songs, setSongs] = useState<Mix[]>([]);
  const [userName, setUserName] = useState('Music Lover');
  const [notificationCount, setNotificationCount] = useState(0);
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    totalPlays: 0,
    totalLikes: 0,
    totalFollowers: 0,
    totalCoins: 0,
    totalMixes: 0,
    recentPlays: 0,
  });

  // Mode load karo
  useEffect(() => {
    loadMode();
  }, []);

  // Mode load from AsyncStorage
  const loadMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(MODE_STORAGE_KEY);
      setIsCreatorMode(savedMode === 'creator');
    } catch (err) {
      console.log('Error loading mode:', err);
    }
  };

  // Jab screen focus ho toh mode aur data refresh karo
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMode();
      fetchAllData();
    });
    return unsubscribe;
  }, [navigation]);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Sab data ek saath fetch karo
  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchSongs(),
      fetchUserName(),
      fetchNotificationCount(),
      fetchCreatorStats(),
    ]);
    setIsLoading(false);
  };

  // Creator stats fetch karo (real-time from Supabase)
  const fetchCreatorStats = async () => {
    if (!user) return;

    try {
      // User ki uploads count
      const { count: mixCount } = await supabase
        .from('songs')
        .select('id', { count: 'exact', head: true })
        .eq('uploaded_by', user.id);

      // User ke total plays
      const { data: songsData } = await supabase
        .from('songs')
        .select('plays_count')
        .eq('uploaded_by', user.id);

      const totalPlays = songsData?.reduce((sum, s) => sum + (s.plays_count || 0), 0) || 0;

      // User ke total likes on his songs
      const { data: likesData } = await supabase
        .from('songs')
        .select('likes_count')
        .eq('uploaded_by', user.id);

      const totalLikes = likesData?.reduce((sum, s) => sum + (s.likes_count || 0), 0) || 0;

      // Followers count
      const { count: followerCount } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('dj_id', user.id);

      // Recent plays (last 7 days simulation)
      const recentPlays = Math.floor(totalPlays * 0.15);

      setCreatorStats({
        totalPlays,
        totalLikes,
        totalFollowers: followerCount || 0,
        totalCoins: 0, // Abhi zero, baad mein coins table se
        totalMixes: mixCount || 0,
        recentPlays,
      });
    } catch (err) {
      console.log('Error fetching creator stats:', err);
    }
  };

  // User ke liked song IDs fetch karo
  const fetchUserLikes = async (): Promise<Set<string>> => {
    if (!user) return new Set();
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('song_id')
        .eq('user_id', user.id);

      if (error || !data) return new Set();
      return new Set(data.map((like: any) => like.song_id));
    } catch {
      return new Set();
    }
  };

  // Songs Supabase se fetch karo
  const fetchSongs = async () => {
    try {
      const [songsResult, likedIds] = await Promise.all([
        supabase
          .from('songs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        fetchUserLikes(),
      ]);

      const { data, error } = songsResult;

      if (error) {
        console.log('[HomeScreen] fetchSongs error:', error.message);
        setSongs(mockMixes);
      } else if (data && data.length > 0) {
        const formattedSongs: Mix[] = data.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: {
            id: song.uploaded_by || 'unknown',
            name: song.artist,
            handle: '@' + song.artist.toLowerCase().replace(/\s+/g, ''),
            avatar: 'https://picsum.photos/seed/' + song.artist + '/200/200',
            bio: '',
            followers: 0,
            mixes: 0,
            isVerified: false,
            totalEarnings: 0,
            genre: song.genre || 'Electronic',
            isFollowing: false,
          },
          coverImage: song.cover_image || 'https://picsum.photos/seed/' + song.id + '/400/400',
          duration: song.duration || 0,
          plays: song.plays_count || 0,
          likes: song.likes_count || 0,
          isLiked: likedIds.has(song.id),
          isDownloaded: song.is_downloaded || false,
          genre: song.genre || 'Electronic',
          uploadedAt: song.created_at,
          isExclusive: song.is_exclusive || false,
          audioUrl: song.audio_url || '',
          description: song.description || '',
        }));
        setSongs(formattedSongs);
      } else {
        setSongs(mockMixes);
      }
    } catch (err) {
      console.log('[HomeScreen] fetchSongs catch:', err);
      setSongs(mockMixes);
    }
  };

  // Genre wise songs fetch karo
  const fetchSongsByGenre = async (genre: string) => {
    try {
      const [songsResult, likedIds] = await Promise.all([
        supabase
          .from('songs')
          .select('*')
          .eq('genre', genre)
          .order('created_at', { ascending: false })
          .limit(20),
        fetchUserLikes(),
      ]);

      const { data, error } = songsResult;

      if (error || !data || data.length === 0) {
        const filtered = mockMixes.filter(m => m.genre === genre);
        setSongs(filtered.length > 0 ? filtered : mockMixes.slice(0, 5));
      } else {
        const formattedSongs: Mix[] = data.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: {
            id: song.uploaded_by || 'unknown',
            name: song.artist,
            handle: '@' + song.artist.toLowerCase().replace(/\s+/g, ''),
            avatar: 'https://picsum.photos/seed/' + song.artist + '/200/200',
            bio: '',
            followers: 0,
            mixes: 0,
            isVerified: false,
            totalEarnings: 0,
            genre: song.genre || 'Electronic',
            isFollowing: false,
          },
          coverImage: song.cover_image || 'https://picsum.photos/seed/' + song.id + '/400/400',
          duration: song.duration || 0,
          plays: song.plays_count || 0,
          likes: song.likes_count || 0,
          isLiked: likedIds.has(song.id),
          isDownloaded: song.is_downloaded || false,
          genre: song.genre || 'Electronic',
          uploadedAt: song.created_at,
          isExclusive: song.is_exclusive || false,
          audioUrl: song.audio_url || '',
          description: song.description || '',
        }));
        setSongs(formattedSongs);
      }
    } catch (err) {
      console.log('[HomeScreen] fetchSongsByGenre catch:', err);
      const filtered = mockMixes.filter(m => m.genre === genre);
      setSongs(filtered.length > 0 ? filtered : mockMixes.slice(0, 5));
    }
  };

  // Like/Unlike handler
  const handleLikeFromHome = useCallback(async (songId: string) => {
    if (!user) return;
    haptics.medium();

    const currentSong = songs.find(s => s.id === songId);
    const wasLiked = currentSong?.isLiked || false;

    // Optimistic update
    setSongs(prev => prev.map(s =>
      s.id === songId ? { ...s, isLiked: !s.isLiked, likes: s.isLiked ? s.likes - 1 : s.likes + 1 } : s
    ));

    try {
      if (wasLiked) {
        const { data: existing } = await supabase
          .from('user_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('song_id', songId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase.from('user_likes').delete().eq('id', existing.id);
          if (error) {
            setSongs(prev => prev.map(s =>
              s.id === songId ? { ...s, isLiked: true, likes: s.likes + 1 } : s
            ));
          }
        }
      } else {
        const { error } = await supabase
          .from('user_likes')
          .insert({ user_id: user.id, song_id: songId })
          .select();

        if (error) {
          setSongs(prev => prev.map(s =>
            s.id === songId ? { ...s, isLiked: false, likes: s.likes - 1 } : s
          ));
        }
      }
    } catch (err) {
      setSongs(prev => prev.map(s =>
        s.id === songId ? { ...s, isLiked: !s.isLiked, likes: s.isLiked ? s.likes - 1 : s.likes + 1 } : s
      ));
    }
  }, [user, songs]);

  const fetchUserName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (data?.full_name) {
        setUserName(data.full_name);
      }
    } catch (err) {
      // Use default name
    }
  };

  const fetchNotificationCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setNotificationCount(count);
      }
    } catch (err) {
      // Use default 0
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    haptics.light();
    fetchAllData().then(() => setRefreshing(false));
  }, []);

  // Jab koi song play ho — queue set karo with visible songs
  const handlePlaySong = useCallback((mix: Mix) => {
    haptics.light();
    // Set queue with all visible songs
    const visibleSongs = songs.length > 0 ? songs : [mix];
    setQueue(visibleSongs);
    setCurrentMix(mix);
    navigation.navigate('Player', { mix });
  }, [songs, navigation, setQueue, setCurrentMix]);

  // Jab genre chip change ho — SIRF LISTENER MODE KE LIYE
  useEffect(() => {
    if (isCreatorMode) return; // Creator ko genre chips nahi chahiye
    setIsLoading(true);
    if (selectedChip === 'All') {
      fetchSongs().then(() => setIsLoading(false));
    } else {
      fetchSongsByGenre(selectedChip).then(() => setIsLoading(false));
    }
  }, [selectedChip]);

  const featuredMixes = songs.filter(m => m.isExclusive);
  const trendingMixes = songs.slice(0, 6);
  const newReleases = songs.slice(4, 10);
  const topDJs = mockDJs.slice(0, 5);

  const chips = ['All', 'Electronic', 'House', 'Techno', 'Deep House', 'Trance'];

  // Format number helper
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // ========== CREATOR MODE HOME ==========
  // Sirf creator-specific content: Stats, Upload, My Uploads, Earnings
  // Koi bhi doosron ke mixes nahi dikhenge
  const renderCreatorHome = () => (
    <>
      {/* Creator Stats Dashboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Your Stats Today</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="headset" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{formatNumber(creatorStats.totalPlays)}</Text>
            <Text style={styles.statLabel}>Total Plays</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="heart" size={24} color={Colors.error} />
            <Text style={styles.statValue}>{formatNumber(creatorStats.totalLikes)}</Text>
            <Text style={styles.statLabel}>Total Likes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={Colors.info} />
            <Text style={styles.statValue}>{formatNumber(creatorStats.totalFollowers)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="diamond" size={24} color={Colors.gold} />
            <Text style={styles.statValue}>{formatNumber(creatorStats.totalCoins)}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
        </View>
      </View>

      {/* Quick Upload Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => { haptics.light(); navigation.navigate('Upload'); }}
        >
          <Ionicons name="cloud-upload" size={24} color={Colors.white} />
          <Text style={styles.uploadButtonText}>Upload New Mix</Text>
        </TouchableOpacity>
      </View>

      {/* Your Recent Uploads */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📁 Your Uploads</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreatorDashboard')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {songs.filter(s => s.artist.id === user?.id).length > 0 ? (
          songs.filter(s => s.artist.id === user?.id).slice(0, 5).map((mix, index) => (
            <AnimatedListItem key={mix.id} index={index} delay={200}>
              <MixCard
                variant="horizontal"
                mix={mix}
                onPress={() => handlePlaySong(mix)}
                onPlay={() => handlePlaySong(mix)}
              />
            </AnimatedListItem>
          ))
        ) : (
          <View style={styles.emptySection}>
            <Ionicons name="cloud-upload-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No uploads yet</Text>
            <Text style={styles.emptyText}>Share your first mix with the world!</Text>
            <TouchableOpacity
              style={styles.emptyUploadButton}
              onPress={() => { haptics.light(); navigation.navigate('Upload'); }}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.emptyUploadButtonText}>Upload Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Earnings Summary */}
      <View style={styles.section}>
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Ionicons name="diamond" size={24} color={Colors.gold} />
            <Text style={styles.earningsTitle}>Earnings Summary</Text>
          </View>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>{formatNumber(creatorStats.totalCoins)}</Text>
              <Text style={styles.earningsLabel}>Total Coins</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>$0</Text>
              <Text style={styles.earningsLabel}>Withdrawn</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>$0</Text>
              <Text style={styles.earningsLabel}>Pending</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => navigation.navigate('CreatorDashboard')}
          >
            <Text style={styles.withdrawButtonText}>View Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => { haptics.light(); navigation.navigate('CreatorDashboard'); }}
          >
            <Ionicons name="bar-chart" size={28} color={Colors.primary} />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => { haptics.light(); navigation.navigate('Notifications'); }}
          >
            <Ionicons name="notifications" size={28} color={Colors.info} />
            <Text style={styles.quickActionText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => { haptics.light(); navigation.navigate('Settings'); }}
          >
            <Ionicons name="settings" size={28} color={Colors.textSecondary} />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // ========== LISTENER MODE HOME ==========
  const renderListenerHome = () => (
    <>
      {/* Genre Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, selectedChip === chip && styles.chipActive]}
            onPress={() => { haptics.selection(); setSelectedChip(chip); }}
          >
            <Text style={[styles.chipText, selectedChip === chip && styles.chipTextActive]}>
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Featured</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { filter: 'featured' })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {featuredMixes.length > 0 ? (
          <FlatList
            horizontal
            data={featuredMixes}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <AnimatedListItem index={index} delay={100}>
                <MixCard
                  variant="featured"
                  mix={item}
                  onPress={() => handlePlaySong(item)}
                  onPlay={() => handlePlaySong(item)}
                />
              </AnimatedListItem>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No featured mixes yet</Text>
          </View>
        )}
      </View>

      {/* Trending Now */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📈 Trending Now</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { filter: 'trending' })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={trendingMixes}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index} delay={200}>
              <MixCard
                mix={item}
                onPress={() => handlePlaySong(item)}
                onPlay={() => handlePlaySong(item)}
                onLike={() => handleLikeFromHome(item.id)}
              />
            </AnimatedListItem>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* New Releases */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>✨ New Releases</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { filter: 'new' })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {newReleases.slice(0, 4).map((mix, index) => (
          <AnimatedListItem key={mix.id} index={index} delay={400}>
            <MixCard
              variant="horizontal"
              mix={mix}
              onPress={() => handlePlaySong(mix)}
              onPlay={() => handlePlaySong(mix)}
            />
          </AnimatedListItem>
        ))}
      </View>

      {/* Because You Liked... */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎧 Because You Liked...</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { filter: 'recommended' })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={[...trendingMixes].reverse()}
          keyExtractor={item => `rec-${item.id}`}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index} delay={500}>
              <MixCard
                variant="compact"
                mix={item}
                onPress={() => handlePlaySong(item)}
              />
            </AnimatedListItem>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Top DJs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⭐ Top DJs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { filter: 'djs' })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {topDJs.map((dj, index) => (
            <AnimatedListItem key={dj.id} index={index} delay={300}>
              <DJCard
                dj={dj}
                variant="compact"
                onPress={() => navigation.navigate('DJProfile', { dj })}
              />
            </AnimatedListItem>
          ))}
        </ScrollView>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>
              {userName} {isCreatorMode ? '🎤' : '👋'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => { 
              haptics.selection(); 
              navigation.navigate('Notifications');
              setNotificationCount(0);
            }}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {notificationCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Mode Badge */}
        <View style={styles.modeBadgeContainer}>
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
        </View>

        {isLoading ? (
          <>
            {/* Skeleton loaders */}
            <View style={styles.section}>
              <SkeletonMixCard />
            </View>
            <View style={styles.section}>
              <SkeletonHorizontalCard />
              <SkeletonHorizontalCard />
            </View>
          </>
        ) : (
          isCreatorMode ? renderCreatorHome() : renderListenerHome()
        )}

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
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  username: {
    ...Typography.h2,
    marginTop: 4,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  // Mode Badge
  modeBadgeContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  modeBadgeText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  // Chips
  chipsContainer: {
    marginBottom: Spacing.lg,
  },
  chipsContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  seeAll: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  featuredList: {
    paddingHorizontal: Spacing.xl,
  },
  horizontalList: {
    paddingHorizontal: Spacing.xl,
  },
  emptySection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyUploadButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  // Creator Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  statCard: {
    width: (Layout.screenWidth - Spacing.xl * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    marginTop: Spacing.sm,
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  // Upload Button
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  uploadButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  // Earnings Card
  earningsCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  earningsTitle: {
    ...Typography.h3,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsValue: {
    ...Typography.h3,
    color: Colors.gold,
  },
  earningsLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  withdrawButton: {
    backgroundColor: Colors.gold + '20',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  withdrawButtonText: {
    ...Typography.button,
    color: Colors.gold,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
