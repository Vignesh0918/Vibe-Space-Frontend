/**
 * HomeStack.js
 * 
 * Exports the 4 sub-stack navigators: HomeStack, CirclesStack, ChatsStack, and ProfileStack.
 * Uses horizontal sliding animations, no headers, and active swipe-back gestures.
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SCREENS } from '../constants';
import { COLORS } from '../constants/theme';

// Screen imports
import HomeScreen from '../screens/main/HomeScreen';
import StoryViewerScreen from '../screens/main/StoryViewerScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import NearbyVibesScreen from '../screens/main/NearbyVibesScreen';
import SearchScreen from '../screens/main/SearchScreen';
import PostDetailScreen from '../screens/main/PostDetailScreen';

import CirclesScreen from '../screens/main/CirclesScreen';
import CircleDetailScreen from '../screens/main/CircleDetailScreen';
import CreateCircleScreen from '../screens/settings/CreateCircleScreen';

import ChatListScreen from '../screens/main/ChatListScreen';
import ChatScreen from '../screens/main/ChatScreen';
import GroupChatScreen from '../screens/main/GroupChatScreen';

import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ChatExpiryScreen from '../screens/settings/ChatExpiryScreen';

const Stack = createStackNavigator();

const defaultScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  cardStyle: { backgroundColor: COLORS.background || '#1a0533' }
};

/**
 * 1. Home Sub-Stack
 */
export function HomeStack() {
  return (
    <Stack.Navigator initialRouteName={SCREENS.HOME} screenOptions={defaultScreenOptions}>
      <Stack.Screen name={SCREENS.HOME} component={HomeScreen} />
      <Stack.Screen name={SCREENS.STORY_VIEWER} component={StoryViewerScreen} />
      <Stack.Screen name={SCREENS.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={SCREENS.SEARCH} component={SearchScreen} />
      <Stack.Screen name={SCREENS.NEARBY_VIBES} component={NearbyVibesScreen} />
      <Stack.Screen name={SCREENS.POST_DETAIL} component={PostDetailScreen} />
    </Stack.Navigator>
  );
}

/**
 * 2. Circles Sub-Stack
 */
export function CirclesStack() {
  return (
    <Stack.Navigator initialRouteName={SCREENS.CIRCLES} screenOptions={defaultScreenOptions}>
      <Stack.Screen name={SCREENS.CIRCLES} component={CirclesScreen} />
      <Stack.Screen name={SCREENS.CIRCLE_DETAIL} component={CircleDetailScreen} />
      <Stack.Screen name={SCREENS.CREATE_CIRCLE} component={CreateCircleScreen} />
    </Stack.Navigator>
  );
}

/**
 * 3. Chats Sub-Stack
 */
export function ChatsStack() {
  return (
    <Stack.Navigator initialRouteName={SCREENS.CHAT_LIST} screenOptions={defaultScreenOptions}>
      <Stack.Screen name={SCREENS.CHAT_LIST} component={ChatListScreen} />
      <Stack.Screen name={SCREENS.CHAT} component={ChatScreen} />
      <Stack.Screen name={SCREENS.GROUP_CHAT} component={GroupChatScreen} />
    </Stack.Navigator>
  );
}

/**
 * 4. Profile Sub-Stack
 */
export function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName={SCREENS.PROFILE} screenOptions={defaultScreenOptions}>
      <Stack.Screen name={SCREENS.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={SCREENS.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
      <Stack.Screen name={SCREENS.CHAT_EXPIRY} component={ChatExpiryScreen} />
    </Stack.Navigator>
  );
}

// Default export is HomeStack for backwards compatibility in navigation configurations
export default HomeStack;
