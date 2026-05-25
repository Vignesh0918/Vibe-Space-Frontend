/**
 * ChatListScreen.js
 * 
 * High-fidelity, real-time Messages Screen for VibeSpace.
 * Connects directly to backend API via chatService polling,
 * renders Swipeable ChatListItems, and includes a Compose modal
 * to start chats with followed/recommended users.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import { auth } from '../../services/firebase';
import { listenToUserChats, leaveOrDeleteChat, getOrCreateDMChat } from '../../services/chatService';
import { getUserFollowing, getRecommendedUsers } from '../../services/authService';
import ChatListItem from '../../components/chat/ChatListItem';
import EmptyState from '../../components/common/EmptyState';
import SideDrawer from '../../components/common/SideDrawer';

const { width } = Dimensions.get('window');

export default function ChatListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.uid;

  // States
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Compose modal states
  const [isComposeVisible, setIsComposeVisible] = useState(false);
  const [composeSearchText, setComposeSearchText] = useState('');
  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Poll chats real-time
  useEffect(() => {
    if (!currentUserId) return;

    setIsLoading(true);
    const unsubscribe = listenToUserChats(currentUserId, (updatedChats) => {
      setChats(updatedChats);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Load contacts for compose
  const handleOpenCompose = async () => {
    setIsComposeVisible(true);
    setIsLoadingContacts(true);
    try {
      // Get following list first, then recommended users
      const followRes = await getUserFollowing(currentUserId);
      if (followRes.success) {
        setContacts(followRes.data || []);
      } else {
        // Fallback to recommended
        const recRes = await getRecommendedUsers();
        if (recRes.success) {
          setContacts(recRes.data || []);
        }
      }
    } catch (err) {
      console.warn('Failed to load contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleStartChat = async (targetUser) => {
    setIsComposeVisible(false);
    setIsLoading(true);
    try {
      const res = await getOrCreateDMChat(currentUserId, targetUser.uid || targetUser._id);
      setIsLoading(false);
      if (res.success && res.data) {
        navigation.navigate(SCREENS.CHAT, {
          chatId: res.data.id,
          chatName: targetUser.displayName,
        });
      } else {
        Alert.alert('Error', res.error || 'Could not start chat room.');
      }
    } catch (err) {
      setIsLoading(false);
      Alert.alert('Error', err.message);
    }
  };

  const handleLeaveOrDelete = async (chat) => {
    Alert.alert(
      chat.isGroup ? 'Leave Group' : 'Delete Chat',
      `Are you sure you want to ${chat.isGroup ? 'leave' : 'delete'} this chat?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: chat.isGroup ? 'Leave' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await leaveOrDeleteChat(chat.id);
              if (!res.success) {
                Alert.alert('Error', res.error || 'Failed to exit chat.');
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  // Filter local chats by search
  const filteredChats = chats.filter(c => {
    // Search by room name
    let matchName = c.name || '';
    // If DM, search by other participant details
    if (!c.isGroup) {
      const otherUser = c.participantDetails?.find(p => p.uid !== currentUserId);
      if (otherUser) {
        matchName = otherUser.displayName || '';
      }
    }
    const lastMsgText = c.lastMessage?.text || '';
    
    return (
      matchName.toLowerCase().includes(searchText.toLowerCase()) ||
      lastMsgText.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const filteredContacts = contacts.filter(contact =>
    contact.displayName?.toLowerCase().includes(composeSearchText.toLowerCase()) ||
    contact.username?.toLowerCase().includes(composeSearchText.toLowerCase())
  );

  // Compute overall new messages badge count
  const newMessagesCount = chats.reduce((acc, c) => {
    const userUnread = c.unreadCounts?.[currentUserId] || 0;
    return acc + userUnread;
  }, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setIsDrawerOpen(true)}>
          <Ionicons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>VibeSpace</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.NOTIFICATIONS })}>
          <View style={styles.notifWrapper}>
            <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Title Row */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Messages</Text>
        {newMessagesCount > 0 && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{newMessagesCount} NEW</Text>
          </View>
        )}
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

      {/* Loading state */}
      {isLoading && chats.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              currentUserId={currentUserId}
              onPress={() => navigation.navigate(SCREENS.CHAT, { 
                chatId: item.id, 
                chatName: item.isGroup 
                  ? item.name 
                  : (item.participantDetails?.find(p => p.uid !== currentUserId)?.displayName || 'Chat')
              })}
              onDeleteOrLeave={handleLeaveOrDelete}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title="No chats active"
              description="Create a new DM to start vibing with others!"
              icon="💬"
            />
          }
        />
      )}

      {/* Compose FAB */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.fab, SHADOWS.medium]}
        onPress={handleOpenCompose}
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

      {/* Compose Chat Selection Modal */}
      <Modal
        visible={isComposeVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsComposeVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Conversation</Text>
              <TouchableOpacity onPress={() => setIsComposeVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal search bar */}
            <View style={styles.modalSearchBar}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search by name or username..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.modalSearchInput}
                value={composeSearchText}
                onChangeText={setComposeSearchText}
              />
            </View>

            {isLoadingContacts ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="medium" color={COLORS.primary} />
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.uid || item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => handleStartChat(item)}
                  >
                    <Image 
                      source={item.photoURL ? { uri: item.photoURL } : require('../../../assets/aarav_avatar.png')} 
                      style={styles.contactAvatar}
                    />
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.displayName}</Text>
                      <Text style={styles.contactUsername}>{item.username || '@vibe_user'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.contactsList}
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>No matching users found.</Text>
                  </View>
                }
              />
            )}
            </View>
          </View>
        </Modal>

        <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    ...FONTS.medium,
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

  /* Compose Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 2, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '75%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderTopWidth: 1.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
    margin: 16,
    paddingHorizontal: 16,
    height: 44,
  },
  modalSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  modalLoading: {
    paddingVertical: 40,
    justifyContent: 'center',
  },
  contactsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
  },
  contactUsername: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    ...FONTS.medium,
  },
});