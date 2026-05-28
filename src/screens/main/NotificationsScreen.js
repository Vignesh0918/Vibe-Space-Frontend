import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { setUser } from '../../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { listenToNotifications, markAllNotificationsRead } from '../../services/notificationService';
import { getDailySummary } from '../../services/aiService';
import { followUser, unfollowUser } from '../../services/authService';
import EmptyState from '../../components/common/EmptyState';
import Toast from 'react-native-toast-message';

const FALLBACK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'like',
    user: {
      name: 'Alex Rivera',
      avatar: require('../../../assets/default_avatar.png'),
    },
    text: 'liked your post from last night.',
    time: '2 MINS AGO',
    previewImage: require('../../../assets/concert_image.png'),
    badgeIcon: 'heart',
    badgeColor: '#ec4899',
    read: false,
  },
  {
    id: '2',
    type: 'mention',
    user: {
      name: 'Sarah Chen',
      avatar: require('../../../assets/default_avatar.png'),
    },
    text: 'mentioned you in a comment.',
    time: '15 MINS AGO',
    previewImage: require('../../../assets/post_workstation.png'),
    badgeIcon: 'at',
    badgeColor: '#3b82f6',
    read: false,
  },
  {
    id: '3',
    type: 'circle_join',
    user: {
      name: 'New members',
      avatar: null,
    },
    text: 'joined Creative Delhi Circle.',
    time: '1 HOUR AGO',
    membersJoined: [
      require('../../../assets/default_avatar.png'),
      require('../../../assets/default_avatar.png'),
    ],
    badgeIcon: 'people',
    badgeColor: '#4f6ef7',
    read: false,
  },
  {
    id: '4',
    type: 'reaction',
    user: {
      name: 'Maya Patel',
      avatar: require('../../../assets/default_avatar.png'),
    },
    text: 'reacted to your story.',
    time: '3 HOURS AGO',
    previewImage: require('../../../assets/media__1779351253518.png'),
    badgeIcon: 'happy',
    badgeColor: '#8b5cf6',
    read: false,
  },
  {
    id: '5',
    type: 'follow',
    user: {
      name: 'Rohan Mehta',
      avatar: require('../../../assets/default_avatar.png'),
    },
    text: 'started following you.',
    time: '5 HOURS AGO',
    isFollowing: false,
    badgeIcon: 'person-add',
    badgeColor: '#10b981',
    read: false,
  },
];

const FILTERS = ['All', 'Reactions', 'Mentions', 'Circles'];

const mapApiNotification = (notif, currentUser) => {
  let badgeIcon = 'notifications-outline';
  let badgeColor = '#8b5cf6';
  
  const type = notif.type?.toLowerCase();
  if (type === 'like') {
    badgeIcon = 'heart';
    badgeColor = '#ec4899';
  } else if (type === 'mention') {
    badgeIcon = 'at';
    badgeColor = '#3b82f6';
  } else if (type === 'circle_join') {
    badgeIcon = 'people';
    badgeColor = '#4f6ef7';
  } else if (type === 'reaction') {
    badgeIcon = 'happy';
    badgeColor = '#8b5cf6';
  } else if (type === 'follow') {
    badgeIcon = 'person-add';
    badgeColor = '#10b981';
  }

  let formattedTime = 'Recently';
  if (notif.createdAt) {
    const diff = new Date() - new Date(notif.createdAt);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (minutes < 1) {
      formattedTime = 'JUST NOW';
    } else if (minutes < 60) {
      formattedTime = `${minutes} MINS AGO`;
    } else if (hours < 24) {
      formattedTime = `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
    } else {
      formattedTime = `${Math.floor(hours / 24)} DAY${Math.floor(hours / 24) > 1 ? 'S' : ''} AGO`;
    }
  }

  const isFollowing = currentUser?.following?.includes(notif.senderId) || false;

  return {
    id: notif.id || notif._id,
    type: notif.type,
    user: {
      name: notif.senderName || 'Someone',
      avatar: notif.senderAvatar ? { uri: notif.senderAvatar } : null,
    },
    senderId: notif.senderId,
    text: notif.text,
    time: formattedTime,
    previewImage: notif.postImage ? { uri: notif.postImage } : null,
    badgeIcon,
    badgeColor,
    read: notif.read,
    isFollowing,
    membersJoined: notif.membersJoined || null,
  };
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Daily Vibe Summary State
  const [vibeSummary, setVibeSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications(FALLBACK_NOTIFICATIONS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = listenToNotifications(currentUser.uid, (data) => {
      if (data) {
        setNotifications(data.map(notif => mapApiNotification(notif, currentUser)));
      } else {
        setNotifications([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, currentUser?.following]);

  // Fetch Daily Vibe Summary on manual user request
  const handleFetchDailySummary = async () => {
    setIsSummaryLoading(true);
    try {
      // In production, these would come from real user activity data
      const activityData = {
        followersCount: Math.floor(Math.random() * 15) + 1,
        reactionsCount: Math.floor(Math.random() * 50) + 5,
        commentsCount: Math.floor(Math.random() * 20) + 2,
        messagesCount: Math.floor(Math.random() * 30) + 3,
        circlesActive: Math.floor(Math.random() * 4) + 1,
        topEmoji: ['❤️', '🔥', '😂', '👏', '✨'][Math.floor(Math.random() * 5)],
      };
      const res = await getDailySummary(activityData);
      if (res.success && res.data) {
        setVibeSummary(res.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'AI Error',
          text2: res.error || 'Failed to fetch vibe summary.'
        });
      }
    } catch (err) {
      console.warn('Failed to fetch daily summary:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not fetch daily summary.'
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleFollowToggle = async (item) => {
    if (!currentUser?.uid) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, isFollowing: !n.isFollowing } : n
        )
      );
      return;
    }

    const targetUserId = item.senderId;
    if (!targetUserId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not found'
      });
      return;
    }

    const originallyFollowing = item.isFollowing;
    const nextFollowing = !originallyFollowing;

    // Optimistically update Redux state first so mapping is consistent
    const currentFollowing = currentUser?.following || [];
    const nextUserFollowing = originallyFollowing
      ? currentFollowing.filter(id => id !== targetUserId)
      : [...currentFollowing, targetUserId];

    dispatch(setUser({
      ...currentUser,
      following: nextUserFollowing
    }));

    try {
      let res;
      if (originallyFollowing) {
        res = await unfollowUser(targetUserId);
      } else {
        res = await followUser(targetUserId);
      }

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: originallyFollowing ? 'Unfollowed' : 'Following',
          text2: originallyFollowing 
            ? `You unfollowed ${item.user.name}` 
            : `You are now following ${item.user.name}`
        });
      } else {
        throw new Error(res.error || 'Action failed');
      }
    } catch (err) {
      // Revert Redux state on error
      dispatch(setUser({
        ...currentUser,
        following: currentFollowing
      }));
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Action failed'
      });
    }
  };

  const handleMarkAsRead = async () => {
    if (!currentUser?.uid) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'All fallback notifications marked as read.'
      });
      return;
    }
    try {
      const res = await markAllNotificationsRead(currentUser.uid);
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'All notifications marked as read.'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res.error || 'Failed to mark notifications as read.'
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message
      });
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'All') return true;
    const type = notif.type?.toLowerCase();
    if (activeFilter === 'Reactions') {
      return type === 'like' || type === 'reaction';
    }
    if (activeFilter === 'Mentions') {
      return type === 'mention';
    }
    if (activeFilter === 'Circles') {
      return type === 'circle_join';
    }
    return true;
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <Ionicons name="menu" size={28} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>VibeSpace</Text>
      <TouchableOpacity style={styles.headerButton} onPress={() => {
        if (currentUser?.uid) {
          setIsLoading(true);
          // Auto trigger fresh poll since interval will do it too
        }
      }}>
        <Ionicons name="notifications-outline" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filtersWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderNotificationItem = ({ item }) => {
    return (
      <View style={[styles.notificationCard, !item.read && { borderColor: 'rgba(79, 110, 247, 0.4)' }]}>
        {/* Left: Avatar with floating badge */}
        <View style={styles.avatarWrapper}>
          {item.user.avatar ? (
            <Image source={item.user.avatar} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(79, 110, 247, 0.15)' }]}>
              <Ionicons name="people" size={24} color="#4f6ef7" />
            </View>
          )}

          {/* Action icon badge overlay */}
          <View style={[styles.badgeOverlay, { backgroundColor: item.badgeColor }]}>
            <Ionicons name={item.badgeIcon} size={10} color="#ffffff" />
          </View>
        </View>

        {/* Center: Notification description & timestamp */}
        <View style={styles.textContainer}>
          <Text style={styles.descriptionText}>
            <Text style={styles.userNameText}>{item.user.name} </Text>
            {item.text}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        {/* Right: Visual Context (Thumbnail / Overlapping avatars / CTA) */}
        <View style={styles.rightContainer}>
          {item.type === 'like' && item.previewImage && (
            <Image source={item.previewImage} style={styles.previewImage} />
          )}

          {item.type === 'mention' && item.previewImage && (
            <Image source={item.previewImage} style={styles.previewImage} />
          )}

          {item.type === 'reaction' && item.previewImage && (
            <Image source={item.previewImage} style={styles.previewImage} />
          )}

          {item.type === 'circle_join' && item.membersJoined && (
            <View style={styles.overlappingAvatars}>
              {item.membersJoined.map((joinedAvatar, index) => (
                <Image
                  key={index}
                  source={typeof joinedAvatar === 'string' ? { uri: joinedAvatar } : joinedAvatar}
                  style={[
                    styles.miniAvatar,
                    { marginLeft: index > 0 ? -12 : 0, zIndex: 10 - index },
                  ]}
                />
              ))}
            </View>
          )}

          {item.type === 'follow' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleFollowToggle(item)}
              style={[
                styles.followButton,
                item.isFollowing && styles.followingButton,
              ]}
            >
              <Text style={styles.followButtonText}>
                {item.isFollowing ? 'FOLLOWING' : 'FOLLOW BACK'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a0533" />
      {renderHeader()}

      {/* Screen Title Row */}
      <View style={styles.screenTitleRow}>
        <Text style={styles.screenTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAsRead}>
          <Text style={styles.markAsReadText}>MARK AS READ</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Daily Vibe Summary Card */}
      {!isSummaryLoading && !vibeSummary && (
        <TouchableOpacity 
          style={styles.vibeSummaryCard} 
          onPress={handleFetchDailySummary}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(79, 110, 247, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.vibeSummaryGradient, { alignItems: 'center', paddingVertical: 20 }]}
          >
            <Ionicons name="sparkles" size={24} color="#a78bfa" style={{ marginBottom: 8 }} />
            <Text style={[styles.vibeSummaryTitle, { marginLeft: 0, marginBottom: 4 }]}>Unlock Today's Vibe Summary ✨</Text>
            <Text style={{ color: '#a78bfa', fontSize: 12, opacity: 0.8, textAlign: 'center' }}>Get a personalized daily digest of your activity</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {!isSummaryLoading && vibeSummary && (
        <View style={styles.vibeSummaryCard}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(79, 110, 247, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vibeSummaryGradient}
          >
            <View style={styles.vibeSummaryHeader}>
              <View style={styles.vibeSummaryTitleRow}>
                <Ionicons name="sparkles" size={18} color="#a78bfa" />
                <Text style={styles.vibeSummaryTitle}>Today's Vibe Check</Text>
              </View>
              {vibeSummary.day_rating && (
                <Text style={styles.vibeDayRating}>{vibeSummary.day_rating}</Text>
              )}
            </View>

            <Text style={styles.vibeSummaryText}>{vibeSummary.summary}</Text>

            {vibeSummary.highlight && (
              <View style={styles.vibeHighlightRow}>
                <Ionicons name="trophy-outline" size={14} color="#f59e0b" />
                <Text style={styles.vibeHighlightText}>{vibeSummary.highlight}</Text>
              </View>
            )}

            {vibeSummary.motivation && (
              <Text style={styles.vibeMotivation}>{vibeSummary.motivation}</Text>
            )}
          </LinearGradient>
        </View>
      )}

      {isSummaryLoading && (
        <View style={styles.vibeSummaryLoadingCard}>
          <ActivityIndicator size="small" color="#a78bfa" />
          <Text style={styles.vibeSummaryLoadingText}>Generating your vibe summary...</Text>
        </View>
      )}

      {/* Notification List */}
      {isLoading && notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="Your alerts for comments, follows, reactions and circles will appear here."
          icon="🔔"
        />
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(76, 40, 133, 0.3)',
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
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    ...FONTS.bold,
    color: '#ffffff',
  },
  markAsReadText: {
    fontSize: 12,
    ...FONTS.bold,
    color: '#b5c4ff', // Light lavender
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 16, 84, 0.4)',
    borderWidth: 1.2,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#b5c4ff', // Light lavender active background
    borderColor: '#b5c4ff',
  },
  filterText: {
    fontSize: 13,
    ...FONTS.medium,
    color: '#a78bfa',
  },
  filterTextActive: {
    color: '#1a0533', // Dark text inside active pill
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card || '#2d1054',
    borderRadius: SIZES.radiusLg || 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    minHeight: 80,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card || '#2d1054',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 18,
    ...FONTS.regular,
  },
  userNameText: {
    ...FONTS.bold,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.bold,
    marginTop: 4,
    opacity: 0.75,
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 50,
  },
  previewImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  overlappingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.card || '#2d1054',
  },
  followButton: {
    backgroundColor: 'rgba(45, 16, 84, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  followingButton: {
    backgroundColor: '#b5c4ff',
    borderColor: '#b5c4ff',
  },
  followButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Daily Vibe Summary */
  vibeSummaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: SIZES.radiusLg || 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  vibeSummaryGradient: {
    padding: 16,
  },
  vibeSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vibeSummaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeSummaryTitle: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
    marginLeft: 6,
  },
  vibeDayRating: {
    fontSize: 12,
    ...FONTS.bold,
    color: '#f59e0b',
  },
  vibeSummaryText: {
    fontSize: 13,
    color: '#e0d4ff',
    ...FONTS.regular,
    lineHeight: 20,
    marginBottom: 10,
  },
  vibeHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  vibeHighlightText: {
    fontSize: 12,
    color: '#f59e0b',
    ...FONTS.medium,
    marginLeft: 6,
    flex: 1,
  },
  vibeMotivation: {
    fontSize: 12,
    color: '#a78bfa',
    ...FONTS.medium,
    fontStyle: 'italic',
    marginTop: 2,
  },
  vibeSummaryLoadingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: SIZES.radiusLg || 16,
    backgroundColor: 'rgba(45, 16, 84, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vibeSummaryLoadingText: {
    color: '#a78bfa',
    fontSize: 12,
    ...FONTS.medium,
    marginLeft: 8,
  },
});