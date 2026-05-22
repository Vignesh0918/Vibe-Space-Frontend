/**
 * PostDetailScreen.js
 * 
 * High-fidelity Post Detail Screen for VibeSpace.
 * Renders the PostCard, full comment listing (with user details, likes, timestamps),
 * comment inputs, and a custom popup modal showing full list of users who reacted.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { auth } from '../../services/firebase';
import { 
  getPostDetails, 
  getComments, 
  addComment, 
  toggleReaction, 
  bookmarkPost 
} from '../../services/postService';
import PostCard from '../../components/feed/PostCard';

export default function PostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const { postId } = route.params || {};
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;

  // States
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Reacted users list modal states
  const [isReactionsModalVisible, setIsReactionsModalVisible] = useState(false);
  const [selectedReactionUsers, setSelectedReactionUsers] = useState([]);
  const [selectedReactionEmoji, setSelectedReactionEmoji] = useState('');

  const fetchPostDetails = async () => {
    try {
      const res = await getPostDetails(postId);
      if (res.success) {
        setPost(res.data);
      } else {
        Alert.alert('Error', res.error || 'Failed to load post details.');
      }
    } catch (err) {
      console.warn('Failed to load post details:', err);
    } finally {
      setIsLoadingPost(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await getComments(postId);
      if (res.success) {
        setComments(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPostDetails();
      fetchComments();
    }
  }, [postId]);

  const handleReact = async (id, emoji) => {
    const originalPost = post;
    
    // Optimistic UI update
    const nextReactions = { ...post.reactions };
    let currentEmojiUsers = [...(nextReactions[emoji] || [])];
    if (currentEmojiUsers.includes(currentUserId)) {
      currentEmojiUsers = currentEmojiUsers.filter(uid => uid !== currentUserId);
    } else {
      currentEmojiUsers.push(currentUserId);
    }
    nextReactions[emoji] = currentEmojiUsers;
    setPost({ ...post, reactions: nextReactions });

    try {
      const res = await toggleReaction(
        postId, 
        emoji, 
        currentUserId, 
        currentUser?.displayName || 'User', 
        currentUser?.photoURL || ''
      );
      if (!res.success) {
        setPost(originalPost); // roll back
      } else {
        fetchPostDetails(); // refresh details to sync other counts
      }
    } catch (err) {
      setPost(originalPost);
    }
  };

  const handleBookmark = async (id) => {
    const originalPost = post;
    const isBookmarked = post.bookmarkedBy?.includes(currentUserId);
    const nextBookmarked = isBookmarked
      ? post.bookmarkedBy.filter(uid => uid !== currentUserId)
      : [...(post.bookmarkedBy || []), currentUserId];

    setPost({ ...post, bookmarkedBy: nextBookmarked });

    try {
      const res = await bookmarkPost(postId);
      if (!res.success) {
        setPost(originalPost);
      }
    } catch (err) {
      setPost(originalPost);
    }
  };

  const handleAddComment = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    setIsSubmittingComment(true);

    try {
      const res = await addComment(
        postId, 
        currentUserId, 
        currentUser?.displayName || 'Alex Vibe', 
        currentUser?.photoURL || '', 
        text
      );
      if (res.success) {
        // Refresh comments list and post details to sync comment counts
        fetchComments();
        fetchPostDetails();
      } else {
        Alert.alert('Error', res.error || 'Failed to submit comment.');
        setInputText(text); // restore input
      }
    } catch (err) {
      Alert.alert('Error', err.message);
      setInputText(text);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Open list of users who reacted with this emoji
  const handleViewReactionsList = (emoji, userList) => {
    setSelectedReactionEmoji(emoji);
    setSelectedReactionUsers(userList || []);
    setIsReactionsModalVisible(true);
  };

  const formatCommentTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentRow}>
      <Image 
        source={item.userAvatar ? { uri: item.userAvatar } : require('../../../assets/aarav_avatar.png')} 
        style={styles.commentAvatar} 
      />
      <View style={styles.commentBubble}>
        <View style={styles.commentHeaderRow}>
          <Text style={styles.commentName}>{item.userName}</Text>
          <Text style={styles.commentTime}>{formatCommentTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoadingPost ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={styles.flex} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id || item._id}
            renderItem={renderComment}
            ListHeaderComponent={
              <View style={styles.postSection}>
                <PostCard
                  post={post}
                  currentUserId={currentUserId}
                  onReact={handleReact}
                  onBookmark={handleBookmark}
                />
                
                {/* Visual grid representation of all active reaction counts */}
                {post.reactions && Object.keys(post.reactions).length > 0 && (
                  <View style={styles.reactionsBreakdown}>
                    <Text style={styles.breakdownTitle}>Reactions Breakdown</Text>
                    <View style={styles.breakdownRow}>
                      {Object.entries(post.reactions)
                        .filter(([_, users]) => users.length > 0)
                        .map(([emoji, users]) => (
                          <TouchableOpacity
                            key={emoji}
                            style={styles.breakdownPill}
                            onPress={() => handleViewReactionsList(emoji, users)}
                          >
                            <Text style={styles.breakdownEmoji}>{emoji}</Text>
                            <Text style={styles.breakdownCount}>{users.length}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}

                <View style={styles.commentsTitleRow}>
                  <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
                </View>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isLoadingComments ? (
                <View style={styles.emptyCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={40} color="rgba(255,255,255,0.15)" />
                  <Text style={styles.emptyCommentsText}>No comments yet. Start the conversation!</Text>
                </View>
              ) : null
            }
          />

          {/* Bottom input area */}
          <View style={styles.bottomCommentBar}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            {inputText.trim().length > 0 && (
              <TouchableOpacity
                style={styles.commentSendBtn}
                onPress={handleAddComment}
                disabled={isSubmittingComment}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="send" size={18} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Reactions Users Modal */}
      <Modal
        visible={isReactionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsReactionsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsReactionsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reactions with {selectedReactionEmoji}</Text>
              <TouchableOpacity onPress={() => setIsReactionsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedReactionUsers}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={styles.userReactionRow}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.avatarText}>U</Text>
                  </View>
                  <Text style={styles.userReactionName}>User UID: {item}</Text>
                </View>
              )}
              contentContainerStyle={{ padding: 20 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ color: COLORS.textMuted }}>No users found.</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postSection: {
    paddingBottom: 16,
  },
  reactionsBreakdown: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1.5,
    borderRadius: 14,
  },
  breakdownTitle: {
    fontSize: 12,
    ...FONTS.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  breakdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 6,
    marginVertical: 4,
  },
  breakdownEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  breakdownCount: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  commentsTitleRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 16,
  },
  commentsTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 24,
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.08)',
    padding: 10,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentName: {
    fontSize: 13,
    ...FONTS.bold,
    color: '#ffffff',
  },
  commentTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  commentText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    ...FONTS.regular,
    lineHeight: 18,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    opacity: 0.6,
  },
  emptyCommentsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
  bottomCommentBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 40, 133, 0.35)',
    padding: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 80,
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 2, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
  },
  userReactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  userReactionName: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.medium,
  },
});
