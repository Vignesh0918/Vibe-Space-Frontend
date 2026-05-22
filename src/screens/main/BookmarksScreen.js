/**
 * BookmarksScreen.js
 * 
 * High-fidelity Screen for displaying user's saved/bookmarked posts in VibeSpace.
 * Calls postService.getBookmarkedPosts and renders a scrollable feed of PostCard items.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { getBookmarkedPosts, bookmarkPost, toggleReaction } from '../../services/postService';
import PostCard from '../../components/feed/PostCard';

export default function BookmarksScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.uid;

  // States
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookmarks = async (isPull = false) => {
    if (isPull) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await getBookmarkedPosts(currentUserId);
      if (res.success) {
        setBookmarks(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load bookmarks:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchBookmarks();
    }
  }, [currentUserId]);

  const handleReact = async (postId, emoji) => {
    // Find post to update locally
    const originalBookmarks = [...bookmarks];
    setBookmarks(prev => prev.map(post => {
      const pId = post._id || post.id;
      if (pId === postId) {
        const nextReactions = { ...post.reactions };
        let currentEmojiUsers = [...(nextReactions[emoji] || [])];
        if (currentEmojiUsers.includes(currentUserId)) {
          currentEmojiUsers = currentEmojiUsers.filter(uid => uid !== currentUserId);
        } else {
          currentEmojiUsers.push(currentUserId);
        }
        nextReactions[emoji] = currentEmojiUsers;
        return { ...post, reactions: nextReactions };
      }
      return post;
    }));

    try {
      const res = await toggleReaction(
        postId,
        emoji,
        currentUserId,
        currentUser?.displayName || 'User',
        currentUser?.photoURL || ''
      );
      if (!res.success) {
        setBookmarks(originalBookmarks); // revert
      }
    } catch (err) {
      setBookmarks(originalBookmarks); // revert
    }
  };

  const handleBookmarkToggle = async (postId) => {
    // Optimistically remove from bookmarks screen
    const originalBookmarks = [...bookmarks];
    setBookmarks(prev => prev.filter(post => (post._id !== postId && post.id !== postId)));

    try {
      const res = await bookmarkPost(postId);
      if (!res.success) {
        setBookmarks(originalBookmarks); // revert
      }
    } catch (err) {
      setBookmarks(originalBookmarks); // revert
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Bookmarks</Text>
      <View style={{ width: 32 }} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#818cf8" />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={currentUserId}
              onReact={handleReact}
              onBookmark={handleBookmarkToggle}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchBookmarks(true)}
              tintColor="#818cf8"
              colors={['#818cf8']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No bookmarked posts yet.</Text>
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
  headerTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted || '#a78bfa',
    marginTop: 10,
    textAlign: 'center',
  },
});
