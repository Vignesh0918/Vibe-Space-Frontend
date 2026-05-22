/**
 * UserProfileScreen.js
 * 
 * High-fidelity, premium User Profile Screen for VibeSpace.
 * Renders another user's profile:
 * - Cover banner photo showing cosmic blue/purple nebula.
 * - Circular avatar with online indicator and glowing border.
 * - Action buttons: "Follow" / "Unfollow" pill button, and a "Message" button to open DMs.
 * - User metadata: Display name, username, bio, and mood badge.
 * - Interactive stats row: Posts, Followers, and Following.
 * - Grid of user's posts (renders thumbnail grid of their media/posts, tapping goes to PostDetail).
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
  Alert,
  FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import { getUserProfile, followUser, unfollowUser } from '../../services/authService';
import { getOrCreateDMChat } from '../../services/chatService';
import apiClient from '../../config/api';
import { setUser } from '../../store/slices/authSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 36) / 3; // 12 padding left/right, plus grid gaps

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { userId } = route.params || {};
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.uid;

  // States
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ postsCount: 0, circlesCount: 0, vibesCount: 0 });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Get user profile
      const profRes = await getUserProfile(userId);
      if (profRes.success && profRes.data) {
        setProfile(profRes.data);
        // Check if current user is following this user
        const followersList = profRes.data.followers || [];
        setIsFollowing(followersList.includes(currentUserId));
      } else {
        Alert.alert('Error', profRes.error || 'Could not load user profile.');
        navigation.goBack();
        return;
      }

      // 2. Get user stats
      const statsRes = await apiClient.get(`/users/${userId}/stats`);
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }

      // 3. Get user posts
      const postsRes = await apiClient.get(`/users/${userId}/posts`);
      if (postsRes.data?.success) {
        setPosts(postsRes.data.data || []);
      }
    } catch (err) {
      console.warn('Error loading user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    const originallyFollowing = isFollowing;
    const nextFollowing = !isFollowing;

    // Optimistic UI update
    setIsFollowing(nextFollowing);
    if (profile) {
      const followersList = profile.followers || [];
      const updatedFollowers = nextFollowing
        ? [...followersList, currentUserId]
        : followersList.filter(uid => uid !== currentUserId);
      setProfile({ ...profile, followers: updatedFollowers });
    }

    try {
      let res;
      if (originallyFollowing) {
        res = await unfollowUser(userId);
      } else {
        res = await followUser(userId);
      }

      if (res.success) {
        // Update current user's Redux state (following list)
        const currentFollowing = currentUser?.following || [];
        const nextUserFollowing = originallyFollowing
          ? currentFollowing.filter(id => id !== userId)
          : [...currentFollowing, userId];
        
        dispatch(setUser({
          ...currentUser,
          following: nextUserFollowing
        }));
      } else {
        // Revert
        setIsFollowing(originallyFollowing);
        fetchProfileData(); // reload
        Alert.alert('Error', res.error || 'Action failed.');
      }
    } catch (err) {
      setIsFollowing(originallyFollowing);
      Alert.alert('Error', err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartDM = async () => {
    if (!profile) return;
    setIsActionLoading(true);
    try {
      const res = await getOrCreateDMChat(currentUserId, userId);
      if (res.success && res.data) {
        navigation.navigate(SCREENS.CHAT, {
          chatId: res.data.id || res.data._id,
          chatName: profile.displayName || profile.username || 'Chat'
        });
      } else {
        Alert.alert('Chat Error', res.error || 'Could not start DM.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={28} color="#ffffff" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{profile ? `@${profile.username}` : 'Loading...'}</Text>
      
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => Alert.alert('Options', 'Block or Report User')}
      >
        <Ionicons name="ellipsis-vertical" size={22} color="#ffffff" />
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

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#818cf8" />
      </View>
    );
  }

  const isOnline = profile.isOnline;

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
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
              {profile.photoURL ? (
                <Image 
                  source={{ uri: profile.photoURL }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <View style={[styles.avatarImage, styles.placeholderAvatar]}>
                  <Text style={styles.avatarInitial}>
                    {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </View>
            {isOnline && <View style={styles.onlineDot} />}
          </View>

          {/* Action buttons on the right of avatar */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.followButton, isFollowing && styles.followingButton]}
              disabled={isActionLoading}
              onPress={handleFollowToggle}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.messageButton}
              disabled={isActionLoading}
              onPress={handleStartDM}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Names and Bio */}
        <View style={styles.userInfoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{profile.displayName || profile.username}</Text>
            {profile.mood && (
              <View style={styles.moodBadge}>
                <Text style={styles.moodEmoji}>{profile.mood}</Text>
              </View>
            )}
          </View>
          <Text style={styles.profileHandle}>@{profile.username}</Text>
          {profile.bio ? (
            <Text style={styles.profileBio}>{profile.bio}</Text>
          ) : (
            <Text style={[styles.profileBio, { color: COLORS.textMuted }]}>No bio shared yet.</Text>
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
            onPress={() => navigation.navigate(SCREENS.FOLLOWERS, { userId, username: profile.username })}
          >
            <Text style={styles.statNumber}>{profile.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statColumn}
            onPress={() => navigation.navigate(SCREENS.FOLLOWING, { userId, username: profile.username })}
          >
            <Text style={styles.statNumber}>{profile.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Post Grid Section Header */}
        <View style={styles.sectionHeader}>
          <Ionicons name="grid-outline" size={16} color="#a78bfa" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>POSTS</Text>
        </View>

        {/* Grid Content */}
        {posts.length > 0 ? (
          <View style={styles.gridContainer}>
            {posts.map(renderGridItem)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyText}>No posts shared yet.</Text>
          </View>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.25)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: '#ffffff',
    ...FONTS.bold,
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
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#0a0212',
  },
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: '#818cf8', // Lavender/periwinkle color
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    minWidth: 110,
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
  },
  messageButton: {
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
    fontSize: 22,
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
    fontSize: 13,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#a78bfa',
    ...FONTS.bold,
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 4,
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
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7a6d8d',
    ...FONTS.medium,
  },
});
