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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChip, setSelectedChip] = useState('All');
  const [songs, setSongs] = useState<Mix[]>([]);
  const [userName, setUserName] = useState('Music Lover');

  // Songs Supabase se fetch karo
  useEffect(() => {
    fetchSongs();
    fetchUserName();
  }, []);

  const fetchSongs = async () => {
    try {
      // Songs table se data nikalo
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching songs:', error);
        // Agar table nahi hai ya error hai toh mock data use karo
        setSongs(mockMixes);
      } else if (data && data.length > 0) {
        // Database se aaye songs ko Mix format mein convert karo
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
          likes: 0,
          isLiked: false,
          isDownloaded: false,
          genre: song.genre || 'Electronic',
          uploadedAt: song.created_at,
          isExclusive: false,
        }));
        setSongs(formattedSongs);
      } else {
        // Table empty hai — mock data use karo
        setSongs(mockMixes);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setSongs(mockMixes);
    }
  };

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    haptics.light();
    fetchSongs().then(() => setRefreshing(false));
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
            onPress={() => { haptics.selection(); navigation.navigate('Notifications'); }}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            <View style={styles.notifBadge} />
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
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
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
            </View>

            {/* Trending Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📈 Trending Now</Text>
                <TouchableOpacity>
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
                      onLike={() => haptics.medium()}
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
                <TouchableOpacity>
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
                <TouchableOpacity>
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
                <TouchableOpacity>
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
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
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
});
