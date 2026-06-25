import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import ReactionBar from './ReactionBar';
import { SCREENS } from '../../constants';
import { useNavigation } from '@react-navigation/native';

// Map circle IDs to readable labels and custom colors
const CIRCLE_MAPPING = {
  friends: { name: 'FRIENDS', color: '#8b5cf6' },
  family: { name: 'FAMILY', color: '#10b981' },
  work: { name: 'WORK', color: '#f59e0b' },
  secret: { name: 'SECRET', color: '#ef4444' },
  all: { name: 'PUBLIC', color: '#00f0ff' },
};

/**
 * PostCard Component
 * Extracted core UI card displaying post details:
 * - User header with avatar & display name (tappable to view profile).
 * - Circle-specific color indicator badge.
 * - High-fidelity post image attachment (tappable to view post detail).
 * - ReactionBar with animated long-press reactions picker.
 * - Caption container with auto-stylized hashtags.
 * - Comments count button & toggle bookmark button.
 */
export default function PostCard({ post, currentUserId, onReact, onBookmark, onOptions }) {
  const navigation = useNavigation();
  const {
    id,
    _id,
    caption,
    imageURL,
    circleId,
    userId,
    userName,
    userAvatar,
    reactions = {},
    commentsCount = 0,
    bookmarkedBy = [],
    createdAt,
  } = post;

  const postId = _id || id;

  // Resolve Circle name and color
  const circleDetails = CIRCLE_MAPPING[circleId.toLowerCase()] || CIRCLE_MAPPING.all;

  // Check if current user bookmarked
  const isBookmarked = bookmarkedBy.includes(currentUserId);

  // Format time relative to post date
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 0 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
    }
  };

  const timeAgoStr = formatTime(createdAt);

  const navigateToDetail = () => {
    navigation.navigate(SCREENS.POST_DETAIL, { postId });
  };

  const navigateToUserProfile = () => {
    // Navigates to user profile screen
    navigation.navigate(SCREENS.USER_PROFILE, { userId });
  };

  // Split caption by words and colorize hashtags
  const renderCaptionText = () => {
    if (!caption) return null;
    const words = caption.split(' ');
    return words.map((word, i) => {
      if (word.startsWith('#')) {
        return (
          <Text key={i} style={styles.hashtagText}>
            {word}{' '}
          </Text>
        );
      }
      return <Text key={i}>{word} </Text>;
    });
  };

  return (
    <View style={[styles.card, SHADOWS.small]}>
      {/* User Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={navigateToUserProfile} activeOpacity={0.75}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarInitial}>
                {userName ? userName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </TouchableOpacity>

        {onOptions && (
          <TouchableOpacity onPress={() => onOptions(post)} style={styles.optionsBtn} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted || '#a78bfa'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Image Content */}
      <TouchableOpacity activeOpacity={0.95} onPress={navigateToDetail} style={styles.imageWrapper}>
        {imageURL ? (
          <Image source={{ uri: imageURL }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.1)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Interaction row */}
      <View style={styles.interactionRow}>
        {/* Left Side: ReactBar */}
        <View style={styles.reactContainer}>
          <ReactionBar
            reactions={reactions}
            currentUserId={currentUserId}
            onReact={(emoji) => onReact && onReact(postId, emoji)}
          />
        </View>

        {/* Right Side: Comments and Bookmark */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToDetail} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={22} color="#ffffff" />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { marginLeft: 16 }]}
            onPress={() => onBookmark && onBookmark(postId)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isBookmarked ? (COLORS.gold || '#eab308') : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption Content */}
      {caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.captionUserName} onPress={navigateToUserProfile}>
              {userName}{' '}
            </Text>
            {renderCaptionText()}
          </Text>
          <Text style={styles.timeText}>{timeAgoStr}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card || '#2d1054',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
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
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optionsBtn: {
    padding: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 290,
    backgroundColor: '#0c0314',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reactContainer: {
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    ...FONTS.regular,
  },
  captionUserName: {
    fontWeight: '700',
    color: '#ffffff',
  },
  hashtagText: {
    color: COLORS.neon || '#a78bfa',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMuted || '#a78bfa',
    marginTop: 4,
    opacity: 0.65,
  },
});