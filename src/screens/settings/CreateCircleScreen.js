/**
 * CreateCircleScreen.js
 * 
 * High-fidelity, premium Create Circle Screen for VibeSpace.
 * Matches Mockup 3:
 * - Back button navigation header with centered title "New Circle".
 * - "CHOOSE ICON" section featuring a large active icon badge and a horizontal list of selectable emojis.
 * - "CIRCLE NAME" text input with "What's the vibe?" placeholder.
 * - "SELECT THEME" swatches section with 6 colors, using a premium double border selected ring.
 * - "PRIVACY SETTINGS" card radio selectors: Open, Invite Only, Secret.
 * - "ADD MEMBERS" search friend list with checklist checkboxes (featuring Arjun K., Priya S., Rohan M.).
 * - "Create Circle" bottom lavender gradient button.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { createCircleThunk } from '../../store/slices/circleSlice';
import * as circleService from '../../services/circleService';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import apiClient from '../../config/api';

const EMOJIS = [
  { emoji: '🚀', id: 'rocket' },
  { emoji: '🔥', id: 'fire' },
  { emoji: '🎮', id: 'gamepad' },
  { emoji: '🎵', id: 'music' },
  { emoji: '🎨', id: 'palette' },
  { emoji: '🏀', id: 'basketball' },
  { emoji: '⛺', id: 'tent' },
  { emoji: '✨', id: 'sparkles' },
  { emoji: '🍿', id: 'popcorn' },
  { emoji: '👾', id: 'alien' },
  { emoji: '🌈', id: 'rainbow' },
  { emoji: '👥', id: 'hug' },
];

const THEMES = [
  { color: '#5c7cfa', id: 'blue' }, // Blue (Selected by default)
  { color: '#ff2e93', id: 'pink' },
  { color: '#b197fc', id: 'lavender' },
  { color: '#e03131', id: 'red' },
  { color: '#2d3748', id: 'dark' },
  { color: '#718096', id: 'grey' },
];

const DEFAULT_AVATAR = require('../../../assets/default_avatar.png');

export default function CreateCircleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const [selectedEmoji, setSelectedEmoji] = useState('🚀');
  const [circleName, setCircleName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('blue');
  const [privacy, setPrivacy] = useState('open'); // open, invite, secret
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState({});
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const searchTimerRef = useRef(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch users from backend when search query changes (with debounce)
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // If search is empty, load recommended/all users
    searchTimerRef.current = setTimeout(async () => {
      setIsLoadingUsers(true);
      try {
        const endpoint = searchQuery.trim()
          ? `/users/search?q=${encodeURIComponent(searchQuery.trim())}`
          : '/users/recommended';
        const response = await apiClient.get(endpoint);
        if (response.data?.success && Array.isArray(response.data.data)) {
          // Filter out the current user from the list
          const filteredUsers = response.data.data.filter(
            (u) => u.uid !== currentUser?.uid
          );
          setUsers(filteredUsers);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, currentUser?.uid]);

  const handleFriendToggle = (uid) => {
    setSelectedFriends(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a circle name' });
      return;
    }
    
    setIsCreating(true);
    try {
      const action = await dispatch(
        createCircleThunk({
          circleData: { name: circleName, type: 'Custom', description: '' },
          ownerId: currentUser.uid
        })
      );

      if (createCircleThunk.fulfilled.match(action)) {
        const createdCircle = action.payload;
        const circleId = createdCircle?._id || createdCircle?.id;
        
        if (circleId) {
          const selectedUserUids = Object.keys(selectedFriends).filter(uid => selectedFriends[uid]);
          if (selectedUserUids.length > 0) {
            await Promise.all(
              selectedUserUids.map(userUid => 
                circleService.addMemberToCircle(circleId, userUid)
              )
            );
          }
        }
        
        Toast.show({ type: 'success', text1: 'Success', text2: `Circle "${circleName}" created successfully!` });
        setTimeout(() => navigation.goBack(), 1000);
      } else {
        const errorMsg = action.payload || 'Failed to create circle';
        Toast.show({ type: 'error', text1: 'Error', text2: errorMsg });
      }
    } catch (error) {
      console.error('Error creating circle:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'An unexpected error occurred' });
    } finally {
      setIsCreating(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>New Circle</Text>
      
      {/* Empty space for alignment */}
      <View style={styles.headerButtonPlaceholder} />
    </View>
  );

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top,
        paddingBottom: isKeyboardVisible ? 0 : insets.bottom + 16
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={64}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
        {/* Choose Icon section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>CHOOSE ICON</Text>
          
          {/* Large active preview icon */}
          <View style={styles.iconPreviewContainer}>
            <LinearGradient
              colors={['#8b5cf6', '#4f6ef7']}
              style={styles.iconPreviewGradient}
            >
              <Text style={styles.iconPreviewText}>{selectedEmoji}</Text>
            </LinearGradient>
          </View>

          {/* Scrolling horizontal list */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojisScroll}
          >
            {EMOJIS.map((item) => {
              const isActive = selectedEmoji === item.emoji;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.emojiBtn, 
                    isActive && styles.emojiBtnActive
                  ]}
                  onPress={() => setSelectedEmoji(item.emoji)}
                >
                  <Text style={styles.emojiText}>{item.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Circle Name section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>CIRCLE NAME</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="What's the vibe?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.textInput}
              value={circleName}
              onChangeText={setCircleName}
            />
          </View>
        </View>

        {/* Select Theme section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>SELECT THEME</Text>
          <View style={styles.themesRow}>
            {THEMES.map((item) => {
              const isSelected = selectedTheme === item.id;
              return (
                <TouchableOpacity 
                  key={item.id}
                  activeOpacity={0.8}
                  style={[
                    styles.themeOuter,
                    isSelected && { borderColor: item.color }
                  ]}
                  onPress={() => setSelectedTheme(item.id)}
                >
                  <View style={[styles.themeInner, { backgroundColor: item.color }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Privacy Settings section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>PRIVACY SETTINGS</Text>
          
          {/* Open option */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.privacyCard, privacy === 'open' && styles.privacyCardActive]}
            onPress={() => setPrivacy('open')}
          >
            <View style={styles.privacyLeft}>
              {/* Radio button */}
              <View style={styles.radioOuter}>
                {privacy === 'open' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.privacyTextColumn}>
                <Text style={styles.privacyTitle}>Open</Text>
                <Text style={styles.privacySubtitle}>Anyone can find and join this circle.</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Invite Only option */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.privacyCard, privacy === 'invite' && styles.privacyCardActive]}
            onPress={() => setPrivacy('invite')}
          >
            <View style={styles.privacyLeft}>
              <View style={styles.radioOuter}>
                {privacy === 'invite' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.privacyTextColumn}>
                <Text style={styles.privacyTitle}>Invite Only</Text>
                <Text style={styles.privacySubtitle}>Users need an invite code to enter.</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Secret option */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.privacyCard, privacy === 'secret' && styles.privacyCardActive]}
            onPress={() => setPrivacy('secret')}
          >
            <View style={styles.privacyLeft}>
              <View style={styles.radioOuter}>
                {privacy === 'secret' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.privacyTextColumn}>
                <Text style={styles.privacyTitle}>Secret</Text>
                <Text style={styles.privacySubtitle}>Only members can see this circle exists.</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Add Members section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>ADD MEMBERS</Text>
          
          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
            <TextInput
              placeholder="Search friends..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Users list */}
          <View style={styles.friendsList}>
            {isLoadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#a78bfa" />
                <Text style={styles.loadingText}>Searching users...</Text>
              </View>
            ) : users.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {searchQuery.trim() ? 'No users found' : 'No users available'}
                </Text>
              </View>
            ) : (
              users.map((user) => {
                const isChecked = !!selectedFriends[user.uid];
                const avatarSource = user.photoURL
                  ? { uri: user.photoURL }
                  : DEFAULT_AVATAR;
                const displayName = user.displayName || user.username || 'Unknown User';
                return (
                  <TouchableOpacity 
                    key={user.uid}
                    activeOpacity={0.8}
                    style={styles.friendRow}
                    onPress={() => handleFriendToggle(user.uid)}
                  >
                    <View style={styles.friendLeft}>
                      <Image source={avatarSource} style={styles.friendAvatar} />
                      <View>
                        <Text style={styles.friendName}>{displayName}</Text>
                        {user.username && (
                          <Text style={styles.friendUsername}>@{user.username}</Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Checkbox badge on right */}
                    <View style={[
                      styles.checkboxOuter,
                      isChecked && styles.checkboxOuterChecked
                    ]}>
                      {isChecked && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Create Circle button */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.createBtn, SHADOWS.medium]}
          onPress={handleCreateCircle}
          disabled={isCreating}
        >
          <LinearGradient
            colors={['#a78bfa', '#60a5fa']} // Lavender/light-blue gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createBtnGradient}
          >
            {isCreating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.createBtnText}>Create Circle</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#1a0533',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.4)',
    backgroundColor: COLORS.background || '#1a0533',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    ...FONTS.bold,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.bold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  iconPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconPreviewGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconPreviewText: {
    fontSize: 40,
  },
  emojisScroll: {
    paddingVertical: 4,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emojiBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8b5cf6',
  },
  emojiText: {
    fontSize: 22,
  },
  inputWrapper: {
    backgroundColor: COLORS.input || '#3d1a6e',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textInput: {
    color: '#ffffff',
    fontSize: 15,
    ...FONTS.regular,
  },
  themesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 12,
  },
  themeInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  privacyCard: {
    backgroundColor: COLORS.card || '#2d1054',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    padding: 16,
    marginBottom: 10,
  },
  privacyCardActive: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: 'rgba(45, 16, 84, 0.6)',
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted || '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8b5cf6',
  },
  privacyTextColumn: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 2,
  },
  privacySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted || '#a78bfa',
    opacity: 0.8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input || '#3d1a6e',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
  },
  friendsList: {
    marginBottom: 8,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 16, 84, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.08)',
    padding: 12,
    marginBottom: 8,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  friendName: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#ffffff',
  },
  friendUsername: {
    fontSize: 11,
    color: 'rgba(167, 139, 250, 0.7)',
    marginTop: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 8,
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOuterChecked: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  createBtn: {
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 26,
    overflow: 'hidden',
  },
  createBtnGradient: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 16,
    ...FONTS.bold,
  },
});