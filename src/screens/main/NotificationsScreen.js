import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    type: 'like',
    user: {
      name: 'Alex Rivera',
      avatar: require('../../../assets/arjun_avatar.png'),
    },
    text: 'liked your post from last night.',
    time: '2 MINS AGO',
    previewImage: require('../../../assets/concert_image.png'),
    badgeIcon: 'heart',
    badgeColor: '#ec4899',
  },
  {
    id: '2',
    type: 'mention',
    user: {
      name: 'Sarah Chen',
      avatar: require('../../../assets/priya_avatar.png'),
    },
    text: 'mentioned you in a comment.',
    time: '15 MINS AGO',
    previewImage: require('../../../assets/post_workstation.png'),
    badgeIcon: 'at',
    badgeColor: '#3b82f6',
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
      require('../../../assets/aarav_avatar.png'),
      require('../../../assets/esha_avatar.png'),
    ],
    badgeIcon: 'people',
    badgeColor: '#4f6ef7',
  },
  {
    id: '4',
    type: 'reaction',
    user: {
      name: 'Maya Patel',
      avatar: require('../../../assets/esha_avatar.png'),
    },
    text: 'reacted to your story.',
    time: '3 HOURS AGO',
    previewImage: require('../../../assets/media__1779351253518.png'),
    badgeIcon: 'happy',
    badgeColor: '#8b5cf6',
  },
  {
    id: '5',
    type: 'follow',
    user: {
      name: 'Rohan Mehta',
      avatar: require('../../../assets/ishaan_avatar.png'),
    },
    text: 'started following you.',
    time: '5 HOURS AGO',
    isFollowing: false,
    badgeIcon: 'person-add',
    badgeColor: '#10b981',
  },
];

const FILTERS = ['All', 'Reactions', 'Mentions', 'Circles'];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handleFollowToggle = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFollowing: !item.isFollowing } : item
      )
    );
  };

  const handleMarkAsRead = () => {
    alert('All notifications marked as read.');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
        <Ionicons name="menu" size={28} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>VibeSpace</Text>
      <TouchableOpacity style={styles.headerButton} onPress={() => alert('Notifications refresh')}>
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
      <View style={styles.notificationCard}>
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
                  source={joinedAvatar}
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
              onPress={() => handleFollowToggle(item.id)}
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

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
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
});