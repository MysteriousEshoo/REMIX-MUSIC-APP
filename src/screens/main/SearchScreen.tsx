import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../../theme';
import { SearchBar, DJCard, MixCard } from '../../components';
import { genres, mockDJs, mockMixes, DJ, Mix } from '../../data/mockData';
import { haptics } from '../../utils/haptics';
import { supabase } from '../../config/supabase';

const SEARCH_HISTORY_KEY = '@remix_search_history';
const MAX_HISTORY = 8;

interface SearchScreenProps {
  navigation: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [resultOpacity] = useState(new Animated.Value(0));
  const [dbSongs, setDbSongs] = useState<Mix[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Load search history from AsyncStorage
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Animate results in
  useEffect(() => {
    if (searchQuery) {
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      resultOpacity.setValue(0);
    }
  }, [searchQuery]);

  const loadSearchHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  };

  const saveToHistory = async (query: string) => {
    if (!query.trim()) return;
    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_HISTORY);
      setRecentSearches(updated);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const clearHistory = async () => {
    haptics.light();
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      saveToHistory(text);
    }
  }, [recentSearches]);

  const handleRecentPress = useCallback((search: string) => {
    haptics.selection();
    setSearchQuery(search);
    saveToHistory(search);
  }, []);

  // Database se search karo jab query change ho
  useEffect(() => {
    if (searchQuery.length > 1) {
      searchFromDatabase(searchQuery);
    }
  }, [searchQuery]);

  const searchFromDatabase = async (query: string) => {
    setIsSearchingDb(true);
    try {
      // Songs table mein title, artist, genre search karo
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%,genre.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        // Fallback to mock data
        setDbSongs([]);
      } else if (data && data.length > 0) {
        const formatted: Mix[] = data.map((song: any) => ({
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
        setDbSongs(formatted);
      } else {
        setDbSongs([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setDbSongs([]);
    } finally {
      setIsSearchingDb(false);
    }
  };

  // Mock data se bhi filter karo (fallback + DJs ke liye)
  const filteredDJs = searchQuery
    ? mockDJs.filter(dj =>
        dj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dj.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Database se aaye songs + mock songs dono dikhao
  const filteredMixes = [
    ...dbSongs,
    ...mockMixes.filter(mix =>
      mix.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mix.artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mix.genre.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  ].filter((mix, index, self) => 
    index === self.findIndex(m => m.id === mix.id)
  );  // Duplicate remove karo

  const hasResults = filteredDJs.length > 0 || filteredMixes.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setIsSearching(true)}
          />
        </View>

        {!isSearching && !searchQuery ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={`${search}-${index}`}
                    style={styles.recentItem}
                    onPress={() => handleRecentPress(search)}
                  >
                    <Ionicons name="time-outline" size={18} color={Colors.textTertiary} />
                    <Text style={styles.recentText}>{search}</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Genre Grid */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Browse by Genre</Text>
              </View>
              <View style={styles.genreGrid}>
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[styles.genreCard, { backgroundColor: genre.color + '30' }]}
                    onPress={() => { haptics.selection(); setSearchQuery(genre.name); saveToHistory(genre.name); }}
                  >
                    <Text style={styles.genreIcon}>{genre.icon}</Text>
                    <Text style={[styles.genreName, { color: genre.color }]}>
                      {genre.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular DJs */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular DJs</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {mockDJs.slice(0, 5).map((dj) => (
                  <DJCard
                    key={dj.id}
                    dj={dj}
                    variant="top"
                    index={mockDJs.indexOf(dj)}
                    onPress={() => navigation.navigate('DJProfile', { dj })}
                  />
                ))}
              </ScrollView>
            </View>
          </>
        ) : searchQuery ? (
          <Animated.View style={{ opacity: resultOpacity }}>
            {/* Search Results */}
            {filteredDJs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DJs</Text>
                {filteredDJs.map((dj) => (
                  <DJCard
                    key={dj.id}
                    dj={dj}
                    variant="horizontal"
                    onPress={() => navigation.navigate('DJProfile', { dj })}
                    onFollow={() => haptics.success()}
                  />
                ))}
              </View>
            )}

            {filteredMixes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mixes</Text>
                {filteredMixes.map((mix) => (
                  <MixCard
                    key={mix.id}
                    variant="horizontal"
                    mix={mix}
                    onPress={() => navigation.navigate('Player', { mix })}
                    onPlay={() => navigation.navigate('Player', { mix })}
                  />
                ))}
              </View>
            )}

            {!hasResults && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>
                  Try searching for something else
                </Text>
              </View>
            )}
          </Animated.View>
        ) : null}

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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl + 40,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  seeAll: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  clearText: {
    ...Typography.body,
    color: Colors.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentText: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: Spacing.md,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genreCard: {
    width: (Layout.screenWidth - Spacing.xl * 2 - Spacing.sm) / 2,
    height: 80,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    justifyContent: 'flex-end',
  },
  genreIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  genreName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  horizontalList: {
    gap: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl * 2,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
