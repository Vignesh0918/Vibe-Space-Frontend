/**
 * SearchScreen.js
 * 
 * High-fidelity, premium Search & Explore Screen for VibeSpace.
 * Features:
 * - Consistent top header with drawer trigger menu (hamburger), centered VibeSpace title, and notification bell.
 * - Search bar with magnifying glass icon and placeholder: "Search vibes, people, or music...".
 * - "People You May Know" horizontal directory section with view all trigger, profile image rings, and bottom-right overlay "+" add badges.
 * - "Trending Vibes" section with horizontal scrolling cards featuring deep image backgrounds, tag pills, bold titles, and active listener counts.
 * - "Nearby Vibes" section with a custom grid map graphic, active count overlays, overlapping radar circles, overlapping member badges, and an "EXPLORE" gradient pill trigger.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';
import PostCard from '../../components/feed/PostCard';
import { performSearch, clearSearch } from '../../store/slices/searchSlice';
import { setUser } from '../../store/slices/authSlice';
import * as authService from '../../services/authService';
import * as postService from '../../services/postService';
import * as circleService from '../../services/circleService';
import { suggestVibeTitles } from '../../services/aiService';


const { width } = Dimensions.get('window');
const TRENDING_CARD_WIDTH = width * 0.65;

export default function SearchScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const currentUser = useSelector((state) => state.auth.user);
  const searchResults = useSelector((state) => state.search.results) || { users: [], circles: [], posts: [], vibes: [] };
  const isSearchLoading = useSelector((state) => state.search.isLoading);
  const searchError = useSelector((state) => state.search.error);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'users', 'circles', 'posts', 'vibes'

  // Dashboard state
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);

  const [followingIds, setFollowingIds] = useState([]);
  const [joinedCircleIds, setJoinedCircleIds] = useState([]);

  // AI Vibe Title Suggester
  const [vibeTitles, setVibeTitles] = useState([]);
  const [isVibeTitlesLoading, setIsVibeTitlesLoading] = useState(false);

  // Fetch dashboard initial stats & lists
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const recRes = await authService.getRecommendedUsers();
        if (recRes.success) {
          setRecommendedUsers(recRes.data || []);
        }

        const trendRes = await postService.getTrendingPosts();
        if (trendRes.success) {
          setTrendingPosts(trendRes.data || []);
        }


      } catch (err) {
        console.warn('Error loading search initial metrics:', err);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch follow list and circle memberships to reflect action buttons state
  useEffect(() => {
    if (currentUser?.uid) {
      authService.getUserProfile(currentUser.uid).then(res => {
        if (res.success && res.data) {
          setFollowingIds(res.data.following || []);
        }
      });

      circleService.getUserCircles(currentUser.uid).then(res => {
        if (res.success && res.data) {
          setJoinedCircleIds(res.data.map(c => c._id || c.id) || []);
        }
      });
    }
  }, [currentUser]);

  // Debounced API Search call
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      dispatch(clearSearch());
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      dispatch(performSearch({ query: q, type: activeTab, page: 1, limit: 15 }));
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  const handleFollowToggle = async (targetUserId) => {
    const isFollowing = followingIds.includes(targetUserId);
    let nextFollowing;
    if (isFollowing) {
      nextFollowing = followingIds.filter(id => id !== targetUserId);
      setFollowingIds(nextFollowing);
      await authService.unfollowUser(targetUserId);
    } else {
      nextFollowing = [...followingIds, targetUserId];
      setFollowingIds(nextFollowing);
      await authService.followUser(targetUserId);
    }

    // Sync Redux state
    dispatch(setUser({
      ...currentUser,
      following: nextFollowing
    }));

    // Sync backend fully
    if (currentUser?.uid) {
      const res = await authService.getUserProfile(currentUser.uid);
      if (res.success && res.data) {
        setFollowingIds(res.data.following || []);
        dispatch(setUser(res.data));
      }
    }
  };

  const handleJoinCircle = async (circleId) => {
    setJoinedCircleIds(prev => [...prev, circleId]);
    const res = await circleService.addMemberToCircle(circleId, currentUser.uid);
    if (!res.success) {
      setJoinedCircleIds(prev => prev.filter(id => id !== circleId));
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: res.error || 'Failed to join circle.'
      });
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  };

  const handleSuggestVibeTitles = async () => {
    setIsVibeTitlesLoading(true);
    setVibeTitles([]);
    try {
      const res = await suggestVibeTitles('🔥', 'Unknown', getTimeOfDay(), []);
      if (res.success && res.data?.suggestions) {
        setVibeTitles(res.data.suggestions);
      }
    } catch (err) {
      console.warn('Vibe title suggestion failed:', err);
    } finally {
      setIsVibeTitlesLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => setIsDrawerOpen(true)}
      >
        <Ionicons name="menu" size={28} color="#ffffff" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>VibeSpace</Text>

      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.NOTIFICATIONS })}
      >
        <View style={styles.notificationWrapper}>
          <Ionicons name="notifications-outline" size={24} color="#ffffff" />
          <View style={styles.smallIndicator} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderCategoryTabs = () => (
    <View style={styles.tabsContainer}>
      {['all', 'users', 'circles', 'posts', 'vibes'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSearchResults = () => {
    if (isSearchLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a78bfa" />
          <Text style={styles.loadingText}>Searching the universe...</Text>
        </View>
      );
    }

    const { users = [], circles = [], posts = [], vibes = [] } = searchResults;
    const hasUsers = users.length > 0;
    const hasCircles = circles.length > 0;
    const hasPosts = posts.length > 0;
    const hasVibes = vibes.length > 0;

    const noResults = !hasUsers && !hasCircles && !hasPosts && !hasVibes;

    if (noResults) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyText}>No matches found for "{searchQuery}"</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your spelling or keywords</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsWrapper}>
        {/* USERS RESULTS */}
        {(activeTab === 'all' || activeTab === 'users') && hasUsers && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionTitle}>People</Text>
            {users.map((user) => {
              const isFollowing = followingIds.includes(user.id);
              return (
                <View key={user.id} style={styles.userResultRow}>
                  <TouchableOpacity
                    style={styles.userInfoBtn}
                    onPress={() => navigation.navigate(SCREENS.USER_PROFILE, { userId: user.id })}
                  >
                    <Image
                      source={user.photoURL ? { uri: user.photoURL } : require('../../../assets/default_avatar.png')}
                      style={styles.resultAvatar}
                    />
                    <View style={styles.resultInfoCol}>
                      <Text style={styles.resultNameText}>{user.displayName}</Text>
                      <Text style={styles.resultHandleText}>{user.username}</Text>
                    </View>
                  </TouchableOpacity>

                  {user.id !== currentUser?.uid && (
                    <TouchableOpacity
                      style={[styles.followBtn, isFollowing && styles.followingBtnActive]}
                      onPress={() => handleFollowToggle(user.id)}
                    >
                      <Text style={[styles.followBtnText, isFollowing && styles.followingBtnTextActive]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* CIRCLES RESULTS */}
        {(activeTab === 'all' || activeTab === 'circles') && hasCircles && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionTitle}>Circles</Text>
            {circles.map((circle) => {
              const isMember = joinedCircleIds.includes(circle.id);
              return (
                <View key={circle.id} style={styles.userResultRow}>
                  <TouchableOpacity
                    style={styles.userInfoBtn}
                    onPress={() => navigation.navigate(SCREENS.CIRCLE_DETAIL, { circleId: circle.id, circleName: circle.name })}
                  >
                    <Image
                      source={circle.avatar ? { uri: circle.avatar } : require('../../../assets/cosmic_wave.png')}
                      style={styles.circleResultAvatar}
                    />
                    <View style={styles.resultInfoCol}>
                      <Text style={styles.resultNameText}>{circle.name}</Text>
                      <Text style={styles.resultHandleText}>{circle.membersCount || circle.members?.length || 1} members • {circle.type}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.followBtn, isMember && styles.followingBtnActive]}
                    onPress={() => !isMember && handleJoinCircle(circle.id)}
                    disabled={isMember}
                  >
                    <Text style={[styles.followBtnText, isMember && styles.followingBtnTextActive]}>
                      {isMember ? 'Joined' : 'Join'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* VIBES RESULTS */}
        {(activeTab === 'all' || activeTab === 'vibes') && hasVibes && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionTitle}>Vibes Feed</Text>
            {vibes.map((vibe) => (
              <View key={vibe.id} style={styles.vibeCardItem}>
                <View style={styles.vibeHeaderRow}>
                  <Image
                    source={vibe.userAvatar ? { uri: vibe.userAvatar } : require('../../../assets/default_avatar.png')}
                    style={styles.vibeUserAvatar}
                  />
                  <View style={styles.vibeInfoCol}>
                    <Text style={styles.vibeName}>{vibe.userName}</Text>
                    <Text style={styles.vibeMoodText}>Feeling {vibe.mood}</Text>
                  </View>
                </View>
                <Text style={styles.vibeBodyText}>{vibe.text}</Text>
                {vibe.songTitle && (
                  <View style={styles.songRow}>
                    <Ionicons name="musical-notes" size={14} color="#a78bfa" style={{ marginRight: 6 }} />
                    <Text style={styles.songText}>{vibe.songTitle} - {vibe.songArtist}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* POSTS RESULTS */}
        {(activeTab === 'all' || activeTab === 'posts') && hasPosts && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionTitle}>Posts</Text>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={(emoji) => postService.toggleReaction(post.id, emoji, currentUser?.uid, currentUser?.displayName, currentUser?.photoURL)}
                onBookmark={() => postService.bookmarkPost(post.id)}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDashboard = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* People You May Know */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People You May Know</Text>
          <TouchableOpacity onPress={() => setActiveTab('users')}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {recommendedUsers.length > 0 ? (
            recommendedUsers.map((item) => (
              <TouchableOpacity
                key={item.id || item._id}
                style={styles.personCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(SCREENS.USER_PROFILE, { userId: item.id || item._id })}
              >
                <View style={styles.avatarWrapper}>
                  <LinearGradient
                    colors={['#8b5cf6', '#4f6ef7']}
                    style={styles.avatarGradientBorder}
                  >
                    <View style={styles.avatarInnerContainer}>
                      <Image
                        source={item.photoURL ? { uri: item.photoURL } : require('../../../assets/default_avatar.png')}
                        style={styles.personAvatar}
                      />
                    </View>
                  </LinearGradient>

                  <TouchableOpacity
                    style={[styles.plusIconBadge, followingIds.includes(item.id || item._id) && styles.plusIconBadgeActive]}
                    onPress={() => handleFollowToggle(item.id || item._id)}
                  >
                    <Ionicons
                      name={followingIds.includes(item.id || item._id) ? "checkmark" : "add"}
                      size={14}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.personName} numberOfLines={1}>{item.displayName}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyHorizontal}>
              <Text style={styles.emptyHorizontalText}>No recommendations today</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Trending Vibes */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginBottom: 16 }]}>Trending Vibes</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TRENDING_CARD_WIDTH + 16}
          decelerationRate="fast"
          contentContainerStyle={[styles.horizontalScroll, { paddingLeft: 16 }]}
        >
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post) => {
              // Extract tags
              const tags = post.caption?.match(/#[a-zA-Z0-9_]+/g) || ['#Vibe'];
              const totalReactions = Object.values(post.reactions || {}).reduce((acc, curr) => acc + curr.length, 0);

              return (
                <TouchableOpacity
                  key={post.id}
                  style={styles.trendingCardTouch}
                  activeOpacity={0.95}
                  onPress={() => navigation.navigate(SCREENS.POST_DETAIL, { postId: post.id })}
                >
                  <Image
                    source={post.imageURL ? { uri: post.imageURL } : require('../../../assets/concert_image.png')}
                    style={styles.trendingImage}
                  />

                  <LinearGradient
                    colors={['rgba(26,5,51,0.1)', 'rgba(26,5,51,0.9)']}
                    style={styles.trendingGradient}
                  >
                    <View style={styles.trendingTagRow}>
                      {tags.slice(0, 2).map((tag, idx) => (
                        <View key={idx} style={styles.tagCapsule}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.trendingTextWrapper}>
                      <Text style={styles.trendingCardTitle} numberOfLines={1}>
                        {post.caption || 'Cosmic Session'}
                      </Text>
                      <View style={styles.metricRow}>
                        <Ionicons name="flame" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                        <Text style={styles.metricText}>{totalReactions} reactions</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )
            })
          ) : (
            <View style={styles.trendingCardTouch}>
              <LinearGradient
                colors={['#1a0533', '#2d1054']}
                style={styles.trendingGradient}
              >
                <Text style={styles.emptyHorizontalText}>No trending vibes yet</Text>
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Nearby Vibes Section */ }
      <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Nearby Vibes</Text>
      <TouchableOpacity onPress={handleSuggestVibeTitles}>
        <View style={styles.aiVibeTitleBtn}>
          {isVibeTitlesLoading ? (
            <ActivityIndicator size="small" color="#a78bfa" />
          ) : (
            <>
              <Ionicons name="sparkles" size={14} color="#a78bfa" />
              <Text style={styles.aiVibeTitleBtnText}>AI Titles</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>

    {/* AI-Generated Vibe Title Suggestions */}
    {vibeTitles.length > 0 && (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vibeTagsScroll}
      >
        {vibeTitles.map((title, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.vibeTitleChip}
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Vibe Selected',
              text2: `"${title}" — Start this vibe nearby!`
            })}
          >
            <Ionicons name="location" size={14} color="#a78bfa" style={{ marginRight: 6 }} />
            <Text style={styles.vibeTitleChipText}>{title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )}

    {/* Nearby Vibes Placeholder Map */}
    <View style={styles.nearbyVibesCard}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(79, 110, 247, 0.1)']}
        style={styles.nearbyVibesGradient}
      >
        <Ionicons name="location-outline" size={48} color="rgba(167, 139, 250, 0.3)" />
        <Text style={styles.nearbyVibesTitle}>Discover vibes around you</Text>
        <Text style={styles.nearbyVibesSubtitle}>Tap AI Titles above to generate creative vibe names</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={handleSuggestVibeTitles}>
          <LinearGradient
            colors={['#a78bfa', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exploreBtnGradient}
          >
            <Text style={styles.exploreBtnText}>EXPLORE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>

    </ScrollView >
  );

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 80 // offset for navigation tabbar
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      {/* Search Input Bar */}
      <View style={[styles.searchBarWrapper, SHADOWS.small]}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
        <TextInput
          placeholder="Search vibes, people, or music..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.trim().length > 0 ? (
        <View style={{ flex: 1 }}>
          {renderCategoryTabs()}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {renderSearchResults()}
          </ScrollView>
        </View>
      ) : (
        renderDashboard()
      )}

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#1a0533',
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacingMd || 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.4)',
  },
  headerTitle: {
    fontSize: 22,
    ...FONTS.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(139, 92, 246, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  headerLogoImage: {
    width: 80,
    height: 40,
  },
  headerButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationWrapper: {
    position: 'relative',
  },
  smallIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger || '#ef4444',
    borderWidth: 1.5,
    borderColor: COLORS.background || '#1a0533',
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 11,
    ...FONTS.bold,
    color: COLORS.textMuted || '#a78bfa',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    paddingHorizontal: 12,
  },
  personCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 76,
  },
  avatarWrapper: {
    position: 'relative',
    width: 66,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarGradientBorder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInnerContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a0533',
    overflow: 'hidden',
  },
  personAvatar: {
    width: '100%',
    height: '100%',
  },
  plusIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#60a5fa', // bright blue add badge
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a0533',
    zIndex: 5,
  },
  plusIconBadgeActive: {
    backgroundColor: '#10b981', // green for checkmark
  },
  personName: {
    fontSize: 12,
    color: '#ffffff',
    ...FONTS.medium,
    textAlign: 'center',
  },
  trendingCardTouch: {
    width: TRENDING_CARD_WIDTH,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0c0317',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    marginRight: 16,
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  trendingGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  trendingTagRow: {
    flexDirection: 'row',
  },
  tagCapsule: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 10,
    ...FONTS.bold,
  },
  trendingTextWrapper: {
    width: '100%',
  },
  trendingCardTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    ...FONTS.medium,
  },

  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#a78bfa',
  },
  tabText: {
    fontSize: 11,
    color: '#7a6d8d',
    ...FONTS.bold,
  },
  activeTabText: {
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#b0a2c7',
    marginTop: 12,
    ...FONTS.medium,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 15,
    ...FONTS.bold,
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#b0a2c7',
    fontSize: 12,
    ...FONTS.medium,
    marginTop: 6,
  },
  resultsWrapper: {
    paddingHorizontal: 16,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsSectionTitle: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#a78bfa',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  userResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  userInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  circleResultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  resultInfoCol: {
    flex: 1,
  },
  resultNameText: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#ffffff',
  },
  resultHandleText: {
    fontSize: 12,
    color: '#b0a2c7',
    ...FONTS.medium,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    minWidth: 84,
    alignItems: 'center',
  },
  followingBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  followBtnText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.bold,
  },
  followingBtnTextActive: {
    color: '#b0a2c7',
  },
  vibeCardItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  vibeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vibeUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  vibeInfoCol: {
    flex: 1,
  },
  vibeName: {
    fontSize: 13,
    ...FONTS.bold,
    color: '#ffffff',
  },
  vibeMoodText: {
    fontSize: 11,
    color: '#a78bfa',
    ...FONTS.bold,
    marginTop: 1,
  },
  vibeBodyText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
    ...FONTS.medium,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  songText: {
    fontSize: 11,
    color: '#a78bfa',
    ...FONTS.bold,
  },
  emptyHorizontal: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emptyHorizontalText: {
    color: '#b0a2c7',
    fontSize: 13,
    ...FONTS.medium,
  },

  /* Nearby Vibes & AI Title Suggester */
  aiVibeTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  aiVibeTitleBtnText: {
    color: '#a78bfa',
    fontSize: 11,
    ...FONTS.bold,
    marginLeft: 4,
  },
  vibeTagsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  vibeTitleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  vibeTitleChipText: {
    color: '#e0d4ff',
    fontSize: 13,
    ...FONTS.medium,
  },
  nearbyVibesCard: {
    marginHorizontal: 16,
    borderRadius: SIZES.radiusLg || 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  nearbyVibesGradient: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyVibesTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  nearbyVibesSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.regular,
    marginBottom: 16,
    textAlign: 'center',
  },
  exploreBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  exploreBtnGradient: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.bold,
    letterSpacing: 1,
  },
});