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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { MixCard, DJCard, SkeletonMixCard, SkeletonHorizontalCard } from '../../components';
import { mockMixes, mockDJs, Mix } from '../../data/mockData';
import { getGreeting } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';


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

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChip, setSelectedChip] = useState('All');
  const [songs, setSongs] = useState<Mix[]>([]);
  const [userName, setUserName] = useState('Music Lover');
  const [notificationCount, setNotificationCount] = useState(0);

  // Songs Supabase se fetch karo
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchSongs(), fetchUserName(), fetchNotificationCount()]).then(() => {
      setIsLoading(false);
    });
  }, []);

  // Jab genre chip change ho toh us genre ke songs fetch karo
  useEffect(() => {
    setIsLoading(true);
    if (selectedChip === 'All') {
      fetchSongs().then(() => setIsLoading(false));
    } else {
      fetchSongsByGenre(selectedChip).then(() => setIsLoading(false));
    }
  }, [selectedChip]);

  // Jab screen wapas aaye (tab switch) toh songs refresh karo taaki like state updated rahe
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSongs();
    });
    return unsubscribe;
  }, [navigation]);

  // User ke liked song IDs fetch karo
  const fetchUserLikes = async (): Promise<Set<string>> => {
    if (!user) {
      console.log('[HomeScreen] fetchUserLikes: user nahi hai');
      return new Set();
    }
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('song_id')
        .eq('user_id', user.id);

      if (error) {
        console.log('[HomeScreen] fetchUserLikes error:', error.message);
        return new Set();
      }
      if (!data) return new Set();
      console.log('[HomeScreen] fetchUserLikes:', data.length, 'liked songs found');
      return new Set(data.map((like: any) => like.song_id));
    } catch (err) {
      console.log('[HomeScreen] fetchUserLikes catch:', err);
      return new Set();
    }
  };

  // Songs Supabase se fetch karo (with per-user like status)
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
        }));
        console.log('[HomeScreen] fetchSongs:', formattedSongs.length, 'songs loaded');
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
        }));
        setSongs(formattedSongs);
      }
    } catch (err) {
      console.log('[HomeScreen] fetchSongsByGenre catch:', err);
      const filtered = mockMixes.filter(m => m.genre === genre);
      setSongs(filtered.length > 0 ? filtered : mockMixes.slice(0, 5));
    }
  };

  // Like/Unlike handler — REAL Supabase insert/delete
  const handleLikeFromHome = useCallback(async (songId: string) => {
    if (!user) {
      console.log('[HomeScreen] handleLikeFromHome: user nahi hai');
      return;
    }
    haptics.medium();

    // Check karo current state
    const currentSong = songs.find(s => s.id === songId);
    const wasLiked = currentSong?.isLiked || false;
    console.log('[HomeScreen] Like toggle:', songId, 'wasLiked:', wasLiked);

    // Optimistic update — turant UI update karo
    setSongs(prev => prev.map(s =>
      s.id === songId ? { ...s, isLiked: !s.isLiked, likes: s.isLiked ? s.likes - 1 : s.likes + 1 } : s
    ));

    try {
      if (wasLiked) {
        // UNLIKE
        const { data: existing, error: findErr } = await supabase
          .from('user_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('song_id', songId)
          .maybeSingle();

        if (findErr) {
          console.log('[HomeScreen] Find existing error:', findErr.message);
        }

        if (existing) {
          const { error } = await supabase.from('user_likes').delete().eq('id', existing.id);
          if (error) {
            console.log('[HomeScreen] ❌ DELETE error:', error.message);
            // Revert
            setSongs(prev => prev.map(s =>
              s.id === songId ? { ...s, isLiked: true, likes: s.likes + 1 } : s
            ));
          } else {
            console.log('[HomeScreen] ✅ Unlike SUCCESS');
          }
        }
      } else {
        // LIKE
        const { data, error } = await supabase
          .from('user_likes')
          .insert({ user_id: user.id, song_id: songId })
          .select();

        if (error) {
          console.log('[HomeScreen] ❌ INSERT error:', error.message, error.code, error.details);
          // Revert optimistic update
          setSongs(prev => prev.map(s =>
            s.id === songId ? { ...s, isLiked: false, likes: s.likes - 1 } : s
          ));
        } else {
          console.log('[HomeScreen] ✅ Like SUCCESS:', data);
        }
      }
    } catch (err) {
      console.log('[HomeScreen] ❌ Like CATCH error:', err);
      // Revert
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

  // Notification count fetch karo
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
    fetchSongs().then(() => {
      fetchNotificationCount().then(() => setRefreshing(false));
    });
  }, []);

  const featuredMixes = songs.filter(m => m.isExclusive);
  const trendingMixes = songs.slice(0, 6);
  const newReleases = songs.slice(4, 10);
  const topDJs = mockDJs.slice(0, 5);

  const chips = ['All', 'Electronic', 'House', 'Techno', 'Deep House', 'Trance'];

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
            <Text style={styles.username}>{userName} 👋</Text>
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

        {/* Quick Access Chips */}
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
          <>
            {/* Featured Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔥 Featured</Text>
                <TouchableOpacity onPress={() => {
                  haptics.selection();
                  navigation.navigate('Search', { filter: 'featured' });
                }}>
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
                        onPress={() => navigation.navigate('Player', { mix: item })}
                        onPlay={() => navigation.navigate('Player', { mix: item })}
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

            {/* Trending Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📈 Trending Now</Text>
                <TouchableOpacity onPress={() => {
                  haptics.selection();
                  navigation.navigate('Search', { filter: 'trending' });
                }}>
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
                      onPress={() => navigation.navigate('Player', { mix: item })}
                      onPlay={() => navigation.navigate('Player', { mix: item })}
                      onLike={() => handleLikeFromHome(item.id)}
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
                <TouchableOpacity onPress={() => {
                  haptics.selection();
                  navigation.navigate('Search', { filter: 'djs' });
                }}>
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

            {/* New Releases */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✨ New Releases</Text>
                <TouchableOpacity onPress={() => {
                  haptics.selection();
                  navigation.navigate('Search', { filter: 'new' });
                }}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {newReleases.slice(0, 4).map((mix, index) => (
                <AnimatedListItem key={mix.id} index={index} delay={400}>
                  <MixCard
                    variant="horizontal"
                    mix={mix}
                    onPress={() => navigation.navigate('Player', { mix })}
                    onPlay={() => navigation.navigate('Player', { mix })}
                  />
                </AnimatedListItem>
              ))}
            </View>

            {/* Recommended for You */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎧 For You</Text>
                <TouchableOpacity onPress={() => {
                  haptics.selection();
                  navigation.navigate('Search', { filter: 'recommended' });
                }}>
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
                      onPress={() => navigation.navigate('Player', { mix: item })}
                    />
                  </AnimatedListItem>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          </>
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
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
});
