/**
 * ChatListScreen.js
 * 
 * High-fidelity Messages Screen for VibeSpace matching the Figma mockup.
 * Features:
 * - Header with hamburger menu, "VibeSpace" logo, and notification bell.
 * - "Messages" section title + "3 NEW" badge.
 * - Frosted search bar: "Search chats..."
 * - Scrollable chat list items with:
 *   - Avatar with online status dot indicator.
 *   - Contact name + timestamp.
 *   - Last message preview with expiry hourglass / image icons.
 *   - Unread message count badge (blue pill).
 * - Floating "+" compose button (bottom-right).
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';

const { width } = Dimensions.get('window');

const CHATS = [
  {
    id: '1',
    name: 'Aria Vibe',
    avatar: require('../../../assets/aria_avatar.png'),
    lastMessage: 'Catch you at the neon rave...',
    time: '14:22',
    unread: 1,
    online: true,
    hasExpiry: true,
  },
  {
    id: '2',
    name: 'Tech Design Sq...',
    avatar: require('../../../assets/media__1779351405157.png'),
    lastMessage: 'Rohan: The glassmorphism update ...',
    time: 'Yesterday',
    unread: 0,
    online: false,
    isGroup: true,
  },
  {
    id: '3',
    name: 'Karan M.',
    avatar: require('../../../assets/arjun_avatar.png'),
    lastMessage: 'Check this secret concept... 🙂',
    time: '2h ago',
    unread: 0,
    online: false,
    hasExpiry: true,
  },
  {
    id: '4',
    name: 'Esha Digital',
    avatar: require('../../../assets/esha_avatar.png'),
    lastMessage: 'Shared a high-res NFT preview.',
    time: 'Wed',
    unread: 0,
    online: false,
    hasImage: true,
  },
  {
    id: '5',
    name: 'Vikram Singh',
    avatar: require('../../../assets/aarav_avatar.png'),
    lastMessage: "Let's connect next week.",
    time: 'Mon',
    unread: 0,
    online: false,
  },
];

export default function ChatListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');

  const filteredChats = CHATS.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.chatCard}
      onPress={() => navigation.navigate(SCREENS.CHAT, { chatId: item.id, chatName: item.name })}
    >
      {/* Avatar + Online Dot */}
      <View style={styles.avatarWrapper}>
        <Image source={item.avatar} style={styles.chatAvatar} />
        {item.online && <View style={styles.onlineDot} />}
      </View>

      {/* Text column */}
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>
          <View style={styles.chatMetaIcons}>
            {item.hasExpiry && (
              <Text style={styles.metaEmoji}>⏳</Text>
            )}
            {item.hasImage && (
              <Ionicons name="image-outline" size={15} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
            )}
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>VibeSpace</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <View style={styles.notifWrapper}>
            <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Title Row */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Messages</Text>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>3 NEW</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search chats..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id}
        renderItem={renderChatItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Compose FAB */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.fab, SHADOWS.medium]}
        onPress={() => alert('New message')}
      >
        <LinearGradient
          colors={['#8b5cf6', '#4f6ef7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerBtn: {
    padding: 4,
  },
  headerLogo: {
    fontSize: 22,
    ...FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(79, 110, 247, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  notifWrapper: { position: 'relative' },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 28,
    ...FONTS.bold,
    color: '#ffffff',
    marginRight: 12,
  },
  newBadge: {
    backgroundColor: 'rgba(79, 110, 247, 0.2)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(79, 110, 247, 0.4)',
  },
  newBadgeText: {
    fontSize: 11,
    ...FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.08)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  chatContent: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    ...FONTS.regular,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatPreview: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    ...FONTS.regular,
    marginRight: 8,
  },
  chatMetaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaEmoji: {
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  unreadText: {
    fontSize: 11,
    ...FONTS.bold,
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});