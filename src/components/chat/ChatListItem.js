import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';

/**
 * ChatListItem Component
 * Features:
 * - Direct Messages (DMs) vs Group Chats rendering logic.
 * - Single recipient avatar with online status indicator dot or multi-user stacked avatar.
 * - Last message text preview with image/voice indicators.
 * - Hourglass icon alert for disappearing timer rooms.
 * - Blue pill badge showing unread message counts.
 * - Swipe-left gesture revealing exit (group) or delete (DM) action button.
 */
export default function ChatListItem({ chat, currentUserId, onPress, onDeleteOrLeave }) {
  const { isGroup, name, groupAvatar, expiryHours, lastMessage, unreadCounts = {}, participantDetails = [] } = chat;

  // Filter out the current user to find other participants
  const otherParticipants = participantDetails.filter(p => p.uid !== currentUserId);

  // Retrieve unread count for current user
  const unreadCount = chat.unread !== undefined ? chat.unread : (unreadCounts[currentUserId] || 0);

  // Determine avatar and details
  let displayName = chat.name || name;
  let isOnline = chat.online || false;
  let avatarUrl = chat.avatar || groupAvatar;

  if (!isGroup && otherParticipants.length > 0) {
    const otherUser = otherParticipants[0];
    if (otherUser) {
      displayName = otherUser.displayName || displayName;
      isOnline = otherUser.isOnline;
      avatarUrl = otherUser.photoURL || avatarUrl;
    }
  }

  // Format timestamp relative to current date
  const formatTimeHelper = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const timestampStr = chat.time || (lastMessage ? formatTimeHelper(lastMessage.createdAt) : '');

  // Swipe Action
  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.rightActionContainer}
        onPress={() => onDeleteOrLeave && onDeleteOrLeave(chat)}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.deleteButton, { transform: [{ scale }] }]}>
          <Ionicons name={isGroup ? 'exit-outline' : 'trash-outline'} size={22} color="#ffffff" />
          <Text style={styles.deleteText}>{isGroup ? 'Leave' : 'Delete'}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Avatar Render
  const renderAvatars = () => {
    const getAvatarSource = (url) => {
      if (!url) return null;
      if (typeof url === 'object' && url.uri) return url;
      if (typeof url === 'number') return url;
      return { uri: url };
    };

    if (isGroup) {
      if (avatarUrl) {
        return <Image source={getAvatarSource(avatarUrl)} style={styles.avatar} />;
      }
      
      // Render stack of up to 3 participant avatars
      const displayAvatars = otherParticipants.slice(0, 3);
      if (displayAvatars.length === 0) {
        return (
          <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: '#4c2885' }]}>
            <Text style={styles.initialsText}>{displayName.slice(0, 2).toUpperCase()}</Text>
          </View>
        );
      }

      return (
        <View style={styles.groupAvatarStack}>
          {displayAvatars.map((p, i) => {
            const hasPhoto = !!p.photoURL;
            return hasPhoto ? (
              <Image
                key={p.uid}
                source={{ uri: p.photoURL }}
                style={[
                  styles.groupAvatarItem,
                  { marginLeft: i === 0 ? 0 : -14, zIndex: 10 - i }
                ]}
              />
            ) : (
              <View
                key={p.uid}
                style={[
                  styles.groupAvatarItem,
                  styles.placeholderAvatar,
                  {
                    backgroundColor: i === 0 ? '#4f6ef7' : i === 1 ? '#ec4899' : '#10b981',
                    marginLeft: i === 0 ? 0 : -14,
                    zIndex: 10 - i,
                  }
                ]}
              >
                <Text style={[styles.initialsText, { fontSize: 10 }]}>
                  {p.displayName ? p.displayName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            );
          })}
        </View>
      );
    } else {
      if (avatarUrl) {
        return (
          <View style={styles.avatarWrapper}>
            <Image source={getAvatarSource(avatarUrl)} style={styles.avatar} />
            {isOnline && <View style={styles.onlineDot} />}
          </View>
        );
      }
      return (
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: '#4f6ef7' }]}>
            <Text style={styles.initialsText}>
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          {isOnline && <View style={styles.onlineDot} />}
        </View>
      );
    }
  };

  const previewText = typeof lastMessage === 'string'
    ? lastMessage
    : (lastMessage ? lastMessage.text : 'Start a new conversation');

  const hasExpiry = chat.hasExpiry !== undefined ? chat.hasExpiry : (expiryHours > 0);

  return (
    <Swipeable renderRightActions={renderRightActions} friction={1.5} rightThreshold={40}>
      <TouchableOpacity activeOpacity={0.75} style={styles.card} onPress={() => onPress && onPress(chat)}>
        {renderAvatars()}

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.time}>{timestampStr}</Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.preview} numberOfLines={1}>
              {previewText}
            </Text>
            
            <View style={styles.metaRow}>
              {hasExpiry && (
                <Ionicons name="hourglass" size={13} color={COLORS.gold || '#eab308'} style={styles.hourglass} />
              )}
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card || 'rgba(30, 12, 56, 0.45)',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.08)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981', // online
    borderWidth: 2,
    borderColor: COLORS.card || '#1e0c38',
  },
  groupAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
    width: 50,
    justifyContent: 'flex-start',
  },
  groupAvatarItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.card || '#1e0c38',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted || '#a78bfa',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted || '#a78bfa',
    marginRight: 8,
    opacity: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourglass: {
    marginRight: 6,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary || '#8b5cf6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  rightActionContainer: {
    width: 80,
    marginBottom: 10,
    marginLeft: 4,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});