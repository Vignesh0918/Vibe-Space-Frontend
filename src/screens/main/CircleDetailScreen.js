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

import React, { useState, useRef, useEffect } from 'react';
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
  FlatList,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import * as circleService from '../../services/circleService';
import apiClient from '../../config/api';
import Toast from 'react-native-toast-message';
import CustomAlertModal from '../../components/common/CustomAlertModal';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 32 - 16) / 3;

const DEFAULT_AVATAR = require('../../../assets/default_avatar.png');

export default function CircleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const chatScrollRef = useRef(null);
  const currentUser = useSelector((state) => state.auth.user);

  // Params
  const { circleId, circleName, circleColor } = route.params || { 
    circleId: null,
    circleName: 'Friends', 
    circleColor: '#10b981' 
  };

  // State
  const [activeTab, setActiveTab] = useState('CHAT'); // CHAT, MEMBERS
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [circleOwnerId, setCircleOwnerId] = useState(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Add Member Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [addingUserUid, setAddingUserUid] = useState(null);
  const searchTimerRef = useRef(null);

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title, message, buttons) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons
    });
  };

  // Derived Title
  const displayTitle = circleName || 'Circle';
  const themeColor = circleColor || '#8b5cf6';

  // Fetch real members
  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await circleService.getCircleMembers(circleId);
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
      }
    } catch (err) {
      console.error('Error fetching circle members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Fetch circle details and members on mount
  useEffect(() => {
    if (!circleId) return;

    // Fetch circle details to get ownerId
    const fetchCircleDetails = async () => {
      try {
        const res = await circleService.getCircleDetails(circleId);
        if (res.success && res.data) {
          setCircleOwnerId(res.data.ownerId);
        }
      } catch (err) {
        console.error('Error fetching circle details:', err);
      }
    };

    fetchCircleDetails();
    fetchMembers();
  }, [circleId]);

  // Search users for adding to circle (with debounce)
  useEffect(() => {
    if (!showAddMemberModal) {
      setSearchedUsers([]);
      setSearchQuery('');
      return;
    }

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsLoadingSearch(true);
      try {
        const endpoint = searchQuery.trim()
          ? `/users/search?q=${encodeURIComponent(searchQuery.trim())}`
          : '/users/recommended';
        const response = await apiClient.get(endpoint);
        if (response.data?.success && Array.isArray(response.data.data)) {
          // Filter out current user
          const filteredUsers = response.data.data.filter(
            (u) => u.uid !== currentUser?.uid
          );
          setSearchedUsers(filteredUsers);
        } else {
          setSearchedUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setSearchedUsers([]);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, showAddMemberModal, currentUser?.uid]);

  const handleAddMemberPress = () => {
    if (circleOwnerId && currentUser?.uid !== circleOwnerId) {
      Toast.show({
        type: 'error',
        text1: 'Restricted',
        text2: 'Only the circle owner can add members.',
        position: 'bottom',
      });
      return;
    }
    setShowAddMemberModal(true);
  };

  const handleAddUserToCircle = async (userUid, displayName) => {
    setAddingUserUid(userUid);
    try {
      const res = await circleService.addMemberToCircle(circleId, userUid);
      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Member Added',
          text2: `${displayName} has been added to the circle.`,
          position: 'bottom',
        });
        await fetchMembers();
        // Update local list
        setSearchedUsers(prev => prev.filter(u => u.uid !== userUid));
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to Add',
          text2: res.error || 'Could not add member.',
          position: 'bottom',
        });
      }
    } catch (err) {
      console.error('Error adding user to circle:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'An error occurred.',
        position: 'bottom',
      });
    } finally {
      setAddingUserUid(null);
    }
  };

  const handleCircleOptions = () => {
    const isOwner = currentUser?.uid === circleOwnerId;
    
    showAlert(
      'Circle Options',
      'What would you like to do?',
      [
        {
          text: isOwner ? 'Delete Circle' : 'Leave Circle',
          style: 'destructive',
          onPress: () => {
            if (isOwner) {
              confirmDeleteCircle();
            } else {
              confirmLeaveCircle();
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const confirmDeleteCircle = () => {
    showAlert(
      'Delete Circle',
      'Are you sure you want to delete this circle? This action cannot be undone and will delete all messages and posts.',
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await circleService.deleteCircle(circleId);
              if (res.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Circle Deleted',
                  text2: 'The circle has been successfully deleted.',
                  position: 'bottom',
                  positionValue: 50,
                });
                navigation.goBack();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Deletion Failed',
                  text2: res.error || 'Could not delete the circle.',
                  position: 'bottom',
                  positionValue: 50,
                });
              }
            } catch (err) {
              console.error('Error deleting circle:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'An error occurred.',
                position: 'bottom',
                positionValue: 50,
              });
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const confirmLeaveCircle = () => {
    showAlert(
      'Leave Circle',
      'Are you sure you want to leave this circle?',
      [
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await circleService.removeMemberFromCircle(circleId, currentUser.uid);
              if (res.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Circle Left',
                  text2: 'You have left the circle.',
                  position: 'bottom',
                  positionValue: 50,
                });
                navigation.goBack();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Failed to Leave',
                  text2: res.error || 'Could not leave the circle.',
                  position: 'bottom',
                  positionValue: 50,
                });
              }
            } catch (err) {
              console.error('Error leaving circle:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'An error occurred.',
                position: 'bottom',
                positionValue: 50,
              });
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Helper to determine member role
  const getMemberRole = (memberUid) => {
    if (memberUid === circleOwnerId) return 'Creator';
    return 'Member';
  };

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
        onPress={handleCircleOptions}
      >
        <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderMembersRow = () => (
    <View style={styles.membersRowSection}>
      <View style={styles.membersHeaderRow}>
        <Text style={styles.membersTitle}>Members <Text style={{ color: themeColor }}>({members.length})</Text></Text>
        <TouchableOpacity onPress={() => setActiveTab('MEMBERS')}>
          <Text style={[styles.viewAllText, { color: themeColor }]}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.avatarsWrapperRow}>
        {/* Plus Button to add member */}
        <TouchableOpacity 
          style={[styles.addMemberButton, { borderColor: `${themeColor}60` }]}
          onPress={handleAddMemberPress}
        >
          <Ionicons name="add" size={20} color={themeColor} />
        </TouchableOpacity>

        {/* Stacked overlapping avatars */}
        <View style={styles.avatarsOverlappingContainer}>
          {members.slice(0, 5).map((member, index) => {
            const avatarSource = member.photoURL
              ? { uri: member.photoURL }
              : DEFAULT_AVATAR;
            return (
              <View 
                key={member.uid || member._id} 
                style={[
                  styles.overlappingAvatarContainer, 
                  { marginLeft: index === 0 ? 0 : -14, zIndex: 10 - index }
                ]}
              >
                <Image source={avatarSource} style={styles.overlappingAvatar} />
                {member.isOnline && (
                  <View style={[styles.onlineIndicatorBadge, { backgroundColor: themeColor }]} />
                )}
              </View>
            );
          })}
          {members.length > 5 && (
            <View style={[styles.moreAvatarsBadge, { marginLeft: -14, zIndex: 1 }]}>
              <Text style={styles.moreAvatarsText}>+{members.length - 5}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderTabs = () => {
    const tabs = ['CHAT', 'MEMBERS'];
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
      case 'MEMBERS':
        return (
          <View style={styles.membersListContainer}>
            {isLoadingMembers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#a78bfa" />
                <Text style={styles.loadingText}>Loading members...</Text>
              </View>
            ) : members.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No members found</Text>
              </View>
            ) : (
              members.map((member) => {
                const avatarSource = member.photoURL
                  ? { uri: member.photoURL }
                  : DEFAULT_AVATAR;
                const displayName = member.displayName || member.username || 'Unknown User';
                const role = getMemberRole(member.uid);
                return (
                  <TouchableOpacity
                    key={member.uid || member._id}
                    style={styles.memberListItem}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate(SCREENS.USER_PROFILE, { userId: member.uid })}
                  >
                    <View style={styles.memberLeftInfo}>
                      <View style={styles.memberAvatarContainer}>
                        <Image source={avatarSource} style={styles.memberAvatar} />
                        {member.isOnline && (
                          <View style={[styles.memberOnlineStatus, { backgroundColor: themeColor }]} />
                        )}
                      </View>
                      <View style={styles.memberTextDetails}>
                        <Text style={styles.memberName}>{displayName}</Text>
                        <Text style={styles.memberStatusText}>
                          {member.username ? `@${member.username}` : (member.isOnline ? 'Online' : 'Offline')}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.roleBadge, { backgroundColor: `${themeColor}15`, borderColor: `${themeColor}40` }]}>
                      <Text style={[styles.roleBadgeText, { color: themeColor }]}>{role}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
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

  const renderAddMemberModal = () => {
    return (
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchWrapper}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" style={styles.modalSearchIcon} />
              <TextInput
                placeholder="Search users..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.modalSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Users list */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
            >
              {isLoadingSearch ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color={themeColor} />
                  <Text style={styles.modalLoadingText}>Searching...</Text>
                </View>
              ) : searchedUsers.length === 0 ? (
                <View style={styles.modalLoadingContainer}>
                  <Text style={styles.modalLoadingText}>
                    {searchQuery.trim() ? 'No users found' : 'Type to search or select recommended'}
                  </Text>
                </View>
              ) : (
                searchedUsers.map((user) => {
                  const isMemberAlready = members.some(m => m.uid === user.uid);
                  const avatarSource = user.photoURL
                    ? { uri: user.photoURL }
                    : DEFAULT_AVATAR;
                  const displayName = user.displayName || user.username || 'Unknown User';
                  const isAdding = addingUserUid === user.uid;

                  return (
                    <View key={user.uid} style={styles.modalUserRow}>
                      <View style={styles.modalUserLeft}>
                        <Image source={avatarSource} style={styles.modalUserAvatar} />
                        <View>
                          <Text style={styles.modalUserName}>{displayName}</Text>
                          {user.username && (
                            <Text style={styles.modalUserUsername}>@{user.username}</Text>
                          )}
                        </View>
                      </View>

                      {isMemberAlready ? (
                        <View style={[styles.joinedBadge, { borderColor: `${themeColor}40` }]}>
                          <Text style={[styles.joinedBadgeText, { color: themeColor }]}>Joined</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          disabled={isAdding}
                          style={[styles.addButton, { backgroundColor: themeColor }]}
                          onPress={() => handleAddUserToCircle(user.uid, displayName)}
                        >
                          {isAdding ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.addButtonText}>Add</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
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

      {renderAddMemberModal()}

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={customAlert.visible}
        onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    width: '100%',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16022b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 48,
    paddingHorizontal: 16,
    margin: 16,
  },
  modalSearchIcon: {
    marginRight: 10,
  },
  modalSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 8,
  },
  modalUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  modalUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  modalUserName: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#ffffff',
  },
  modalUserUsername: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  joinedBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  joinedBadgeText: {
    fontSize: 12,
    ...FONTS.bold,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.bold,
  },
});