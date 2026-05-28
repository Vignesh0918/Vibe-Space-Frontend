/**
 * ProfileScreen.js
 * 
 * High-fidelity, premium Profile Screen for VibeSpace.
 * Connects directly to the backend to render the authenticated user's real details:
 * - Cover banner photo showing cosmic blue/purple nebula.
 * - Circular avatar with gold star spark badge overlay.
 * - Action buttons: "Edit Profile" pill button and a circular gear settings button.
 * - Dynamic user metadata: Display name, username, bio, and mood emoji badge.
 * - Border-bounded stats row: Posts count, Followers, and Following.
 * - Clickable stats navigate to FollowersScreen and FollowingScreen.
 * - Interactive Tabs: POSTS, VIBES, TAGGED.
 * - Pull to refresh support.
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';
import { getUserProfile } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';
import { getUserPosts } from '../../services/postService';
import apiClient from '../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 36) / 3; // 12 padding left/right, plus grid gaps

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.uid;

  // States
  const [activeTab, setActiveTab] = useState('POSTS');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [stats, setStats] = useState({ postsCount: 0, circlesCount: 0, vibesCount: 0 });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfileData = async (isPull = false) => {
    if (isPull) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (currentUserId) {
        // 1. Fetch user profile from API to sync Redux
        const profRes = await getUserProfile(currentUserId);
        if (profRes.success && profRes.data) {
          dispatch(setUser(profRes.data));
        }

        // 2. Fetch stats
        const statsRes = await apiClient.get(`/users/${currentUserId}/stats`);
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }

        // 3. Fetch user posts
        const postsRes = await getUserPosts(currentUserId);
        if (postsRes.success) {
          setPosts(postsRes.data || []);
        }
      }
    } catch (err) {
      console.warn('Error fetching own profile data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchProfileData();
    }
  }, [currentUserId]);

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
        <Ionicons name="notifications-outline" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderGridItem = (item) => {
    const postId = item._id || item.id;
    return (
      <TouchableOpacity 
        key={postId}
        activeOpacity={0.9}
        style={styles.gridItem}
        onPress={() => navigation.navigate(SCREENS.POST_DETAIL, { postId })}
      >
        {item.imageURL ? (
          <Image source={{ uri: item.imageURL }} style={styles.gridImage} />
        ) : (
          <View style={styles.placeholderGridImage}>
            <Ionicons name="document-text-outline" size={28} color="rgba(255,255,255,0.2)" />
            <Text style={styles.placeholderGridText} numberOfLines={2}>{item.caption}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#818cf8" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchProfileData(true)}
              tintColor="#818cf8"
              colors={['#818cf8']}
            />
          }
        >
          {/* Cover Photo */}
          <View style={styles.coverContainer}>
            <Image 
              source={require('../../../assets/cosmic_wave.png')} 
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>

          {/* Profile Details Overlay Area */}
          <View style={styles.profileActionRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarInner}>
                {currentUser?.photoURL ? (
                  <Image 
                    source={{ uri: currentUser.photoURL }} 
                    style={styles.avatarImage} 
                  />
                ) : (
                  <View style={[styles.avatarImage, styles.placeholderAvatar]}>
                    <Text style={styles.avatarInitial}>
                      {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
              </View>
              {/* Gold spark badge on bottom right */}
              <View style={styles.sparkBadge}>
                <Text style={styles.sparkText}>✨</Text>
              </View>
            </View>

            {/* Action buttons on the right of avatar */}
            <View style={styles.buttonWrapper}>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.editProfileButton}
                onPress={() => navigation.navigate(SCREENS.EDIT_PROFILE)}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.settingsButton}
                onPress={() => navigation.navigate(SCREENS.SETTINGS)}
              >
                <Ionicons name="settings-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Names and Bio */}
          <View style={styles.userInfoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{currentUser?.displayName || currentUser?.username}</Text>
              {currentUser?.mood && (
                <View style={styles.moodBadge}>
                  <Text style={styles.moodEmoji}>{currentUser.mood}</Text>
                </View>
              )}
            </View>
            <Text style={styles.profileHandle}>@{currentUser?.username}</Text>
            {currentUser?.bio ? (
              <Text style={styles.profileBio}>{currentUser.bio}</Text>
            ) : (
              <Text style={[styles.profileBio, { color: COLORS.textMuted }]}>
                Curating the future of digital aesthetics. Late night dreamer, neon seeker. 🌌✨
              </Text>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{stats.postsCount || posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <TouchableOpacity 
              style={styles.statColumn}
              onPress={() => navigation.navigate(SCREENS.FOLLOWERS, { userId: currentUserId, username: currentUser?.username })}
            >
              <Text style={styles.statNumber}>{currentUser?.followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statColumn}
              onPress={() => navigation.navigate(SCREENS.FOLLOWING, { userId: currentUserId, username: currentUser?.username })}
            >
              <Text style={styles.statNumber}>{currentUser?.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs Bar */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'POSTS' && styles.activeTabButton]}
              onPress={() => setActiveTab('POSTS')}
            >
              <Text style={[styles.tabText, activeTab === 'POSTS' && styles.activeTabText]}>
                POSTS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'VIBES' && styles.activeTabButton]}
              onPress={() => setActiveTab('VIBES')}
            >
              <Text style={[styles.tabText, activeTab === 'VIBES' && styles.activeTabText]}>
                VIBES
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'TAGGED' && styles.activeTabButton]}
              onPress={() => setActiveTab('TAGGED')}
            >
              <Text style={[styles.tabText, activeTab === 'TAGGED' && styles.activeTabText]}>
                TAGGED
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Grid Content */}
          {activeTab === 'POSTS' ? (
            posts.length > 0 ? (
              <View style={styles.gridContainer}>
                {posts.map(renderGridItem)}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyText}>No posts shared yet.</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'VIBES' ? 'flame-outline' : 'pricetag-outline'} 
                size={48} 
                color="rgba(255,255,255,0.15)" 
              />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} to display</Text>
            </View>
          )}
        </ScrollView>
      )}

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0212', // Premium deep night background
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#0a0212',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: 0.5,
    ...FONTS.bold,
  },
  headerLogoImage: {
    width: 80,
    height: 40,
  },
  coverContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#1b082e',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: -50,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#0a0212',
    overflow: 'hidden',
    backgroundColor: '#2d1054',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  sparkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#eab308', // Gold yellow badge
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0212',
  },
  sparkText: {
    fontSize: 12,
  },
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editProfileButton: {
    backgroundColor: '#818cf8', // Lavender/periwinkle color
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  editProfileText: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 25,
    ...FONTS.bold,
    color: '#ffffff',
    marginRight: 8,
  },
  moodBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  moodEmoji: {
    fontSize: 14,
  },
  profileHandle: {
    fontSize: 14,
    color: '#b0a2c7',
    ...FONTS.medium,
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    ...FONTS.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginTop: 20,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#a092b7',
    ...FONTS.medium,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#a78bfa', // Lavender active line
  },
  tabText: {
    fontSize: 13,
    color: '#7a6d8d',
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#ffffff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1b082e',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  placeholderGridImage: {
    flex: 1,
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderGridText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7a6d8d',
    ...FONTS.medium,
  },
});