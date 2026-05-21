/**
 * CircleDetailScreen.js
 * 
 * High-fidelity, premium Circle Detail screen for VibeSpace.
 * Features:
 * - Header with a back button, the circle name (e.g., "✨ Neon Nights"), and an options menu.
 * - Members row containing:
 *   - Overlapping avatars (Aarav, Priya, Ishaan, etc.)
 *   - Add member button ('+') with interactive ripple
 *   - "VIEW ALL" text button on the right
 * - Horizontal navigation tabs: POSTS, MEMBERS, CHAT
 * - Selected active indicator underline
 * - Tab contents:
 *   - POSTS: A sleek 3-column grid of image cards from the assets list
 *   - MEMBERS: A detailed user list with role badges and active status indicators
 *   - CHAT: An embedded group chat workspace with auto-delete indicators and sample logs
 */

import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  TextInput,
  StatusBar,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 32 - 16) / 3;

// Mock members
const MEMBERS_DATA = [
  { id: '1', name: 'Aarav Sharma', role: 'Creator', avatar: require('../../../assets/aarav_avatar.png'), isOnline: true },
  { id: '2', name: 'Priya Kapoor', role: 'Moderator', avatar: require('../../../assets/priya_avatar.png'), isOnline: true },
  { id: '3', name: 'Ishaan Verma', role: 'Member', avatar: require('../../../assets/ishaan_avatar.png'), isOnline: false },
  { id: '4', name: 'Esha Sen', role: 'Member', avatar: require('../../../assets/esha_avatar.png'), isOnline: true },
  { id: '5', name: 'Arjun Das', role: 'Member', avatar: require('../../../assets/arjun_avatar.png'), isOnline: false },
  { id: '6', name: 'Aria Mehta', role: 'Member', avatar: require('../../../assets/aria_avatar.png'), isOnline: true },
];

// Mock posts for 3-column grid
const POSTS_DATA = [
  { id: 'p1', image: require('../../../assets/post_swirl.png') },
  { id: 'p2', image: require('../../../assets/post_workstation.png') },
  { id: 'p3', image: require('../../../assets/concert_image.png') },
  { id: 'p4', image: require('../../../assets/cosmic_wave.png') },
  { id: 'p5', image: require('../../../assets/media__1779349699782.png') },
  { id: 'p6', image: require('../../../assets/media__1779350719876.png') },
  { id: 'p7', image: require('../../../assets/media__1779351405157.png') },
  { id: 'p8', image: require('../../../assets/media__1779352220248.png') },
  { id: 'p9', image: require('../../../assets/media__1779352232448.png') },
];

// Mock chat messages
const INITIAL_MESSAGES = [
  { id: 'm1', sender: 'Aarav Sharma', avatar: require('../../../assets/aarav_avatar.png'), text: 'Yo, anyone up for the concert tonight? 🎸', time: '6m ago', isMe: false },
  { id: 'm2', sender: 'Priya Kapoor', avatar: require('../../../assets/priya_avatar.png'), text: 'I am! Just finished setting up my workspace 💻', time: '4m ago', isMe: false },
  { id: 'm3', sender: 'Ishaan Verma', avatar: require('../../../assets/ishaan_avatar.png'), text: 'Count me in! Let\'s vibe out. 🔥', time: '2m ago', isMe: false },
  { id: 'm4', sender: 'You', avatar: null, text: 'Awesome! Let\'s meet outside the venue at 8. 🎟️', time: 'Just now', isMe: true },
];

export default function CircleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const chatScrollRef = useRef(null);

  // Params
  const { circleName, circleColor } = route.params || { 
    circleName: 'Friends', 
    circleColor: '#10b981' 
  };

  // State
  const [activeTab, setActiveTab] = useState('POSTS'); // POSTS, MEMBERS, CHAT
  const [chatMessages, setChatMessages] = useState(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState('');

  // Derived Title matching Screen 4 spec
  const displayTitle = circleName === 'Friends' ? '✨ Neon Nights' : circleName;
  const themeColor = circleColor || '#8b5cf6';

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: `m_${Date.now()}`,
      sender: 'You',
      avatar: null,
      text: newMessage,
      time: 'Just now',
      isMe: true,
    };
    setChatMessages([...chatMessages, msg]);
    setNewMessage('');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{displayTitle}</Text>
      
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => alert('Circle settings clicked')}
      >
        <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderMembersRow = () => (
    <View style={styles.membersRowSection}>
      <View style={styles.membersHeaderRow}>
        <Text style={styles.membersTitle}>Members <Text style={{ color: themeColor }}>({MEMBERS_DATA.length})</Text></Text>
        <TouchableOpacity onPress={() => setActiveTab('MEMBERS')}>
          <Text style={[styles.viewAllText, { color: themeColor }]}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.avatarsWrapperRow}>
        {/* Plus Button to add member */}
        <TouchableOpacity 
          style={[styles.addMemberButton, { borderColor: `${themeColor}60` }]}
          onPress={() => alert('Invite new member to circle')}
        >
          <Ionicons name="add" size={20} color={themeColor} />
        </TouchableOpacity>

        {/* Stacked overlapping avatars */}
        <View style={styles.avatarsOverlappingContainer}>
          {MEMBERS_DATA.slice(0, 5).map((member, index) => (
            <View 
              key={member.id} 
              style={[
                styles.overlappingAvatarContainer, 
                { marginLeft: index === 0 ? 0 : -14, zIndex: 10 - index }
              ]}
            >
              <Image source={member.avatar} style={styles.overlappingAvatar} />
              {member.isOnline && (
                <View style={[styles.onlineIndicatorBadge, { backgroundColor: themeColor }]} />
              )}
            </View>
          ))}
          {MEMBERS_DATA.length > 5 && (
            <View style={[styles.moreAvatarsBadge, { marginLeft: -14, zIndex: 1 }]}>
              <Text style={styles.moreAvatarsText}>+{MEMBERS_DATA.length - 5}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderTabs = () => {
    const tabs = ['POSTS', 'MEMBERS', 'CHAT'];
    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity 
              key={tab}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                isActive && { color: '#ffffff', ...FONTS.bold }
              ]}>
                {tab}
              </Text>
              {isActive && (
                <View style={[styles.activeTabUnderline, { backgroundColor: themeColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'POSTS':
        return (
          <View style={styles.postsGrid}>
            {POSTS_DATA.map((post) => (
              <TouchableOpacity 
                key={post.id}
                style={styles.gridItemTouch}
                activeOpacity={0.9}
                onPress={() => navigation.navigate(SCREENS.POST_DETAIL, { postId: post.id })}
              >
                <Image source={post.image} style={styles.gridItemImage} />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'MEMBERS':
        return (
          <View style={styles.membersListContainer}>
            {MEMBERS_DATA.map((member) => (
              <View key={member.id} style={styles.memberListItem}>
                <View style={styles.memberLeftInfo}>
                  <View style={styles.memberAvatarContainer}>
                    <Image source={member.avatar} style={styles.memberAvatar} />
                    {member.isOnline && (
                      <View style={[styles.memberOnlineStatus, { backgroundColor: themeColor }]} />
                    )}
                  </View>
                  <View style={styles.memberTextDetails}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberStatusText}>{member.isOnline ? 'Online' : 'Offline'}</Text>
                  </View>
                </View>

                <View style={[styles.roleBadge, { backgroundColor: `${themeColor}15`, borderColor: `${themeColor}40` }]}>
                  <Text style={[styles.roleBadgeText, { color: themeColor }]}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'CHAT':
        return (
          <View style={styles.chatSectionContainer}>
            {/* Expiry Header Banner */}
            <View style={styles.expiryBanner}>
              <Ionicons name="timer-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.expiryBannerText}>Messages in this circle expire after 24 hours</Text>
            </View>

            {/* Message Stream */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatMessagesScroll}
              ref={chatScrollRef}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.map((msg) => (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageWrapper,
                    msg.isMe ? styles.messageWrapperMe : styles.messageWrapperOther
                  ]}
                >
                  {!msg.isMe && (
                    <Image source={msg.avatar} style={styles.messageAvatar} />
                  )}
                  
                  <View style={styles.messageContent}>
                    {!msg.isMe && (
                      <Text style={styles.messageSenderName}>{msg.sender}</Text>
                    )}
                    <View style={[
                      styles.messageBubble,
                      msg.isMe 
                        ? [styles.messageBubbleMe, { backgroundColor: themeColor }] 
                        : styles.messageBubbleOther
                    ]}>
                      <Text style={styles.messageText}>{msg.text}</Text>
                    </View>
                    <Text style={[
                      styles.messageTime,
                      msg.isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                    ]}>
                      {msg.time}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Chat Input row */}
            <View style={styles.chatInputRow}>
              <TextInput
                placeholder="Message in Neon Nights..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.chatTextInput}
                value={newMessage}
                onChangeText={setNewMessage}
              />
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.chatSendButton, { backgroundColor: themeColor }]}
                onPress={handleSendMessage}
              >
                <Ionicons name="send" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
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

      {/* Main viewport is scrollable for Posts/Members tabs, but Chat fits viewport */}
      {activeTab === 'CHAT' ? (
        <View style={{ flex: 1 }}>
          {renderMembersRow()}
          {renderTabs()}
          <View style={{ flex: 1 }}>
            {renderTabContent()}
          </View>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {renderMembersRow()}
          {renderTabs()}
          {renderTabContent()}
        </ScrollView>
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
    paddingHorizontal: SIZES.spacingMd || 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.4)',
  },
  headerTitle: {
    fontSize: 20,
    ...FONTS.bold,
    color: '#ffffff',
  },
  headerButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  membersRowSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  membersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 12,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  avatarsWrapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMemberButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarsOverlappingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  overlappingAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1a0533',
    position: 'relative',
  },
  overlappingAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  onlineIndicatorBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#1a0533',
  },
  moreAvatarsBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2d1054',
    borderWidth: 2,
    borderColor: '#1a0533',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAvatarsText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.bold,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    ...FONTS.bold,
    color: COLORS.textMuted || '#a78bfa',
    letterSpacing: 0.5,
  },
  activeTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2.5,
    borderRadius: 1.5,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  gridItemTouch: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0c0317',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  membersListContainer: {
    paddingHorizontal: 16,
  },
  memberListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 16, 84, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  memberLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  memberOnlineStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#1a0533',
  },
  memberTextDetails: {
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#ffffff',
  },
  memberStatusText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10,
    ...FONTS.bold,
  },
  chatSectionContainer: {
    flex: 1,
    backgroundColor: '#0d031c',
  },
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  expiryBannerText: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.8,
    ...FONTS.medium,
  },
  chatMessagesScroll: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageWrapperOther: {
    alignSelf: 'flex-start',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    marginLeft: 4,
  },
  messageSenderName: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 4,
    ...FONTS.bold,
  },
  messageBubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  messageBubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 4,
  },
  messageBubbleMe: {
    borderTopRightRadius: 4,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(26, 5, 51, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  chatTextInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    color: '#ffffff',
    marginRight: 10,
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});