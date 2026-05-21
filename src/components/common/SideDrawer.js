/**
 * SideDrawer.js
 * 
 * High-fidelity, custom sliding navigation drawer overlay for VibeSpace.
 * Features:
 * - 60fps hardware-accelerated left slide-in/out animations using Animated.
 * - Backdrop fade-in with touch-to-dismiss behavior.
 * - Glassmorphic layout utilizing custom theme colors and linear gradients.
 * - Active Redux user profile header displaying custom photo, displayName/username, and dynamic mood badge.
 * - Direct navigation mappings switching seamlessly between the application stacks.
 * - Full Redux-connected logout thunk trigger.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logoutThunk } from '../../store/slices/authSlice';
import { SCREENS } from '../../constants';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

export default function SideDrawer({ isOpen, onClose }) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const currentUser = useSelector((state) => state.auth.user);
  
  const [isRendered, setIsRendered] = useState(isOpen);
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsRendered(false);
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRendered(false);
      onClose();
    });
  };

  const handleNavigate = (screenName) => {
    handleClose();
    
    // Slight timeout allows drawer to slide out of viewport before swapping screen stacks
    setTimeout(() => {
      if (screenName === SCREENS.HOME) {
        navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.HOME });
      } else if (screenName === SCREENS.CIRCLES) {
        navigation.navigate(SCREENS.CIRCLES_TAB, { screen: SCREENS.CIRCLES });
      } else if (screenName === SCREENS.CREATE_CIRCLE) {
        navigation.navigate(SCREENS.CIRCLES_TAB, { screen: SCREENS.CREATE_CIRCLE });
      } else if (screenName === SCREENS.NEARBY_VIBES) {
        navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.NEARBY_VIBES });
      } else if (screenName === SCREENS.PROFILE) {
        navigation.navigate(SCREENS.PROFILE_TAB, { screen: SCREENS.PROFILE });
      } else if (screenName === SCREENS.CHAT_EXPIRY) {
        navigation.navigate(SCREENS.PROFILE_TAB, { screen: SCREENS.CHAT_EXPIRY });
      } else if (screenName === SCREENS.SETTINGS) {
        navigation.navigate(SCREENS.PROFILE_TAB, { screen: SCREENS.SETTINGS });
      } else {
        navigation.navigate(screenName);
      }
    }, 280);
  };

  const handleLogout = () => {
    handleClose();
    setTimeout(() => {
      dispatch(logoutThunk());
    }, 280);
  };

  if (!isRendered) {
    return null;
  }

  // Fallback defaults for guest or development states
  const displayName = currentUser?.displayName || 'Alex Vibe';
  const usernameText = currentUser?.username || '@alex_digital';
  const userBio = currentUser?.bio || 'Curating the future of digital aesthetics. Late night dreamer, neon seeker.';
  const rawVibe = currentUser?.vibe || 'glow';
  
  // Resolve avatar photo source
  let avatarSource = require('../../../assets/aarav_avatar.png'); // Default Aarav Avatar
  if (currentUser?.photoURL) {
    avatarSource = typeof currentUser.photoURL === 'string' 
      ? { uri: currentUser.photoURL } 
      : currentUser.photoURL;
  }

  // Resolve Vibe status emoji and label
  const vibeMap = {
    chill: { emoji: '🌙', label: 'Chill' },
    hype: { emoji: '🔥', label: 'Hype' },
    arty: { emoji: '🎨', label: 'Arty' },
    beat: { emoji: '🎧', label: 'Beat' },
    glow: { emoji: '✨', label: 'Glow' },
  };
  const activeVibe = vibeMap[rawVibe.toLowerCase()] || { emoji: '🔥', label: 'Hyped' };

  const menuItems = [
    { label: 'Feed / Home', icon: 'sparkles-outline', screen: SCREENS.HOME },
    { label: 'Circles Manager', icon: 'people-outline', screen: SCREENS.CIRCLES },
    { label: 'Create Circle', icon: 'add-circle-outline', screen: SCREENS.CREATE_CIRCLE },
    { label: 'Nearby Vibes Map', icon: 'map-outline', screen: SCREENS.NEARBY_VIBES },
    { label: 'Chat Expiry Settings', icon: 'hourglass-outline', screen: SCREENS.CHAT_EXPIRY },
    { label: 'Settings', icon: 'settings-outline', screen: SCREENS.SETTINGS },
  ];

  return (
    <Modal
      transparent
      visible={isRendered}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Transparent Backdrop Fades In */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Drawer Container */}
        <Animated.View 
          style={[
            styles.drawerContainer, 
            { 
              width: DRAWER_WIDTH,
              transform: [{ translateX: slideAnim }],
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16)
            }
          ]}
        >
          <LinearGradient
            colors={['#1a0533', '#2d1054']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Header Close button */}
          <View style={styles.closeHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* User Profile Card Section */}
          <TouchableOpacity 
            style={styles.profileCard} 
            activeOpacity={0.85} 
            onPress={() => handleNavigate(SCREENS.PROFILE)}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#4f6ef7']}
                style={styles.avatarGradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInner}>
                  <Image source={avatarSource} style={styles.avatarImage} />
                </View>
              </LinearGradient>
              <View style={styles.moodBadgeContainer}>
                <Text style={styles.moodEmoji}>{activeVibe.emoji}</Text>
              </View>
            </View>

            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.profileHandle} numberOfLines={1}>{usernameText}</Text>
            
            {/* Styled Vibe Capsule */}
            <View style={styles.vibeCapsule}>
              <Text style={styles.vibeText}>{activeVibe.emoji} {activeVibe.label}</Text>
            </View>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={styles.divider} />

          {/* Navigation Menu List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuScroll}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleNavigate(item.screen)}
              >
                <View style={styles.menuIconWrapper}>
                  <Ionicons name={item.icon} size={22} color={COLORS.textMuted} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.25)" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom Logout Options */}
          <View style={styles.footerContainer}>
            <View style={styles.divider} />
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>VibeSpace v1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 2, 22, 0.65)',
  },
  drawerContainer: {
    height: '100%',
    backgroundColor: '#1a0533',
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 16,
  },
  closeHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    height: 40,
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarGradientRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    backgroundColor: '#1a0533',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  moodBadgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2d1054',
    borderWidth: 2,
    borderColor: '#4c2885',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 14,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 18,
    ...FONTS.bold,
    textAlign: 'center',
  },
  profileHandle: {
    color: COLORS.textMuted,
    fontSize: 13,
    ...FONTS.regular,
    marginTop: 2,
    textAlign: 'center',
  },
  vibeCapsule: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  vibeText: {
    color: '#ffffff',
    fontSize: 11,
    ...FONTS.medium,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(76, 40, 133, 0.4)',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  menuScroll: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  menuIconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.medium,
    flex: 1,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginTop: 4,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    ...FONTS.bold,
    marginLeft: 12,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 16,
  },
});
