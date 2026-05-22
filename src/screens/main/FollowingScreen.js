/**
 * FollowingScreen.js
 * 
 * High-fidelity screen listing users followed by a specific user in VibeSpace.
 * Supports filtering followed users locally, quick navigation to their profiles,
 * and quick unfollow actions with optimistic UI and Redux state sync.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import { getUserFollowing, followUser, unfollowUser } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';

export default function FollowingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { userId, username = 'User' } = route.params || {};
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.uid;

  // States
  const [followingList, setFollowingList] = useState([]);
  const [filteredFollowing, setFilteredFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionUserId, setActionUserId] = useState(null); // Track which user is currently triggering follow/unfollow API

  const fetchFollowing = async (isPull = false) => {
    if (isPull) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await getUserFollowing(userId);
      if (res.success) {
        setFollowingList(res.data || []);
        setFilteredFollowing(res.data || []);
      } else {
        Alert.alert('Error', res.error || 'Failed to load following list.');
      }
    } catch (err) {
      console.warn('Error loading following list:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFollowing();
    }
  }, [userId]);

  // Handle local searching/filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFollowing(followingList);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = followingList.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(q)) ||
        (user.username && user.username.toLowerCase().includes(q))
      );
      setFilteredFollowing(filtered);
    }
  }, [searchQuery, followingList]);

  const handleFollowAction = async (targetUser) => {
    const targetId = targetUser.uid || targetUser._id;
    if (actionUserId) return; // Prevent multiple clicks
    setActionUserId(targetId);

    const isCurrentlyFollowing = currentUser?.following?.includes(targetId);

    try {
      let res;
      if (isCurrentlyFollowing) {
        res = await unfollowUser(targetId);
      } else {
        res = await followUser(targetId);
      }

      if (res.success) {
        const currentFollowing = currentUser?.following || [];
        const nextFollowing = isCurrentlyFollowing
          ? currentFollowing.filter(id => id !== targetId)
          : [...currentFollowing, targetId];

        // Sync Redux
        dispatch(setUser({
          ...currentUser,
          following: nextFollowing
        }));

        // If current user is looking at their own profile, we can optimistically remove/update from list
        if (userId === currentUserId && isCurrentlyFollowing) {
          setFollowingList(prev => prev.filter(user => (user.uid || user._id) !== targetId));
        }
      } else {
        Alert.alert('Error', res.error || 'Action failed.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setActionUserId(null);
    }
  };

  const renderUserItem = ({ item }) => {
    const targetId = item.uid || item._id;
    const isSelf = targetId === currentUserId;
    const isCurrentlyFollowing = currentUser?.following?.includes(targetId);

    return (
      <View style={styles.userRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.userInfoRow}
          onPress={() => {
            if (isSelf) {
              navigation.navigate(SCREENS.PROFILE_TAB);
            } else {
              navigation.navigate(SCREENS.USER_PROFILE, { userId: targetId });
            }
          }}
        >
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarInitial}>
                {item.displayName ? item.displayName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.userDetail}>
            <Text style={styles.displayName}>{item.displayName || item.username}</Text>
            <Text style={styles.username}>@{item.username}</Text>
          </View>
        </TouchableOpacity>

        {!isSelf ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isCurrentlyFollowing && styles.followingButton
            ]}
            disabled={actionUserId === targetId}
            onPress={() => handleFollowAction(item)}
          >
            {actionUserId === targetId ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {isCurrentlyFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Following</Text>
          <Text style={styles.headerSubtitle}>@{username}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted || '#a78bfa'} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search following..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#818cf8" />
        </View>
      ) : (
        <FlatList
          data={filteredFollowing}
          keyExtractor={(item) => item.uid || item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchFollowing(true)}
              tintColor="#818cf8"
              colors={['#818cf8']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No followed users found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#1a0533',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.4)',
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.regular,
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  placeholderAvatar: {
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userDetail: {
    flex: 1,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
  },
  username: {
    color: '#b0a2c7',
    fontSize: 12,
    ...FONTS.medium,
    marginTop: 1,
  },
  actionButton: {
    backgroundColor: '#818cf8',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted || '#a78bfa',
    marginTop: 10,
    textAlign: 'center',
  },
});
