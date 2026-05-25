/**
 * navigation/index.js
 * 
 * Root navigator coordinating the top-level Auth and Main flows.
 * Renders the NavigationContainer with custom theme configurations,
 * coordinates 2-second splash loading, monitors Firebase auth status,
 * and sets up deep linking configurations.
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { listenAuthState } from '../services/authService';
import { setUser, clearUser } from '../store/slices/authSlice';
import { navigationRef } from '../utils/navigationRef';
import { SCREENS } from '../constants';
import { COLORS } from '../constants/theme';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/auth/SplashScreen';

// Custom App Navigation Theme
const AppTheme = {
  dark: true,
  colors: {
    primary: COLORS.primary || '#4f6ef7',
    background: COLORS.background || '#1a0533',
    card: COLORS.card || '#2d1054',
    text: COLORS.text || '#ffffff',
    border: COLORS.border || 'rgba(255,255,255,0.1)',
    notification: COLORS.primary || '#4f6ef7',
  },
};

// Deep linking configurations for push notifications and external routing
const linking = {
  prefixes: ['vibespace://', 'https://vibespace.app'],
  config: {
    screens: {
      // Mapping screen keys to URL paths
      [SCREENS.HOME_TAB]: {
        screens: {
          [SCREENS.HOME]: 'home',
          [SCREENS.STORY_VIEWER]: 'story/:storyId',
          [SCREENS.POST_DETAIL]: 'post/:postId',
          [SCREENS.NOTIFICATIONS]: 'notifications',
          [SCREENS.SEARCH]: 'search',
        }
      },
      [SCREENS.CIRCLES_TAB]: {
        screens: {
          [SCREENS.CIRCLES]: 'circles',
          [SCREENS.CIRCLE_DETAIL]: 'circle/:circleId',
          [SCREENS.CREATE_CIRCLE]: 'create-circle',
        }
      },
      [SCREENS.ADD_POST_TAB]: 'add-post',
      [SCREENS.CHATS_TAB]: {
        screens: {
          [SCREENS.CHAT_LIST]: 'chats',
          [SCREENS.CHAT]: 'chat/:chatId',
          [SCREENS.GROUP_CHAT]: 'group-chat/:groupId',
        }
      },
      [SCREENS.PROFILE_TAB]: {
        screens: {
          [SCREENS.PROFILE]: 'profile',
          [SCREENS.EDIT_PROFILE]: 'edit-profile',
          [SCREENS.SETTINGS]: 'settings',
          [SCREENS.CHAT_EXPIRY]: 'chat-expiry',
        }
      }
    }
  }
};

export default function RootNavigator() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    let firebaseCheckComplete = false;
    let splashDelayComplete = false;

    // Transition away from splash screen once both conditions are met
    const tryFinished = () => {
      if (firebaseCheckComplete && splashDelayComplete) {
        setIsInitializing(false);
      }
    };

    // 1. Force splash display for at least 2 seconds
    const timer = setTimeout(() => {
      splashDelayComplete = true;
      tryFinished();
    }, 2000);

    // 2. Listen to Firebase Auth state updates and verify MongoDB profile
    const unsubscribe = listenAuthState(async (user) => {
      if (user) {
        try {
          const { getUserProfile } = require('../services/authService');
          const profileResult = await getUserProfile(user.uid);
          if (profileResult.success && profileResult.data) {
            // User has a MongoDB profile — log them in fully
            dispatch(setUser({
              uid: user.uid,
              phoneNumber: user.phoneNumber || profileResult.data.phoneNumber,
              displayName: profileResult.data.displayName,
              username: profileResult.data.username,
              photoURL: profileResult.data.photoURL,
              bio: profileResult.data.bio,
              mood: profileResult.data.mood,
            }));
          } else {
            // Firebase user exists but no MongoDB profile — keep on auth flow
            dispatch(clearUser());
          }
        } catch {
          // API error — don't block the user, keep them on auth flow
          dispatch(clearUser());
        }
      } else {
        dispatch(clearUser());
      }
      firebaseCheckComplete = true;
      tryFinished();
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [dispatch]);


  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={AppTheme} ref={navigationRef} linking={linking}>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

/*
NAVIGATION TEST CHECKLIST:
✅ App opens → SplashScreen shows for 2 seconds
✅ First time user → Onboarding → Login → OTP → ProfileSetup → Home
✅ Returning user (logged in) → directly to Home (skip auth)
✅ Home tab → tap Stories → StoryViewer opens full screen (no tab bar)
✅ Home tab → tap Notifications bell → NotificationsScreen opens
✅ Center Add button → AddPostScreen opens
✅ Chats tab → tap a chat → ChatScreen opens
✅ Profile tab → tap Settings → SettingsScreen opens
✅ Settings → Chat Expiry → ChatExpiryScreen opens
✅ Circles tab → tap a circle → CircleDetailScreen opens
✅ CircleDetail → Create Circle → CreateCircleScreen opens
✅ Logout → Redux isLoggedIn = false → auto redirect to Login
✅ Hardware back button works on Android correctly
✅ Swipe back gesture works on iOS correctly
*/
