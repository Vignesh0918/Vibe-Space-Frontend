/**
 * index.js
 * Exports application metadata, configuration constants, and screen names.
 */

export const APP_NAME = 'VibeSpace';
export const APP_VERSION = '1.0.0';

// Circle Configurations
export const CIRCLE_TYPES = {
  FRIENDS: 'friends',
  FAMILY: 'family',
  WORK: 'work',
  SECRET: 'secret',
};

export const CIRCLE_CONFIG = {
  [CIRCLE_TYPES.FRIENDS]: {
    label: 'Friends',
    emoji: '🤗',
    color: '#10b981',
  },
  [CIRCLE_TYPES.FAMILY]: {
    label: 'Family',
    emoji: '👨‍👩‍👧‍👦',
    color: '#3b82f6',
  },
  [CIRCLE_TYPES.WORK]: {
    label: 'Work',
    emoji: '💼',
    color: '#f59e0b',
  },
  [CIRCLE_TYPES.SECRET]: {
    label: 'Secret',
    emoji: '🕵️‍♂️',
    color: '#ec4899',
  },
};

// Chat Message Expiry Options (value in hours)
export const EXPIRY_OPTIONS = [
  { label: 'Never Expire', value: 0, icon: 'lock-open-outline' },
  { label: '24 Hours', value: 24, icon: 'time-outline' },
  { label: '7 Days', value: 168, icon: 'calendar-outline' },
  { label: '30 Days', value: 720, icon: 'archive-outline' },
];

// Emoji Reactions for Posts
export const REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👏'];

// Mood Options for Profile Status
export const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🔥', label: 'Hyped' },
  { emoji: '🤯', label: 'Stressed' },
  { emoji: '😇', label: 'Chill' },
  { emoji: '💻', label: 'Coding' },
  { emoji: '🍿', label: 'Chilling' },
  { emoji: '✈️', label: 'Traveling' },
];

// Screen Name Constants
export const SCREENS = {
  // Auth Navigator Stack
  SPLASH: 'SplashScreen',
  ONBOARDING: 'OnboardingScreen',
  LOGIN: 'LoginScreen',
  PROFILE_SETUP: 'ProfileSetupScreen',

  // Main Navigator Tab / Root Stacks
  HOME_TAB: 'HomeTab',
  CIRCLES_TAB: 'CirclesTab',
  ADD_POST_TAB: 'AddPostTab',
  CHATS_TAB: 'ChatsTab',
  PROFILE_TAB: 'ProfileTab',

  // Main Stack Screens
  HOME: 'HomeScreen',
  ADD_POST: 'AddPostScreen',
  CIRCLES: 'CirclesScreen',
  CIRCLE_DETAIL: 'CircleDetailScreen',
  CHAT_LIST: 'ChatListScreen',
  CHAT: 'ChatScreen',
  GROUP_CHAT: 'GroupChatScreen',
  PROFILE: 'ProfileScreen',
  SEARCH: 'SearchScreen',
  NOTIFICATIONS: 'NotificationsScreen',
  NEARBY_VIBES: 'NearbyVibesScreen',
  STORY_VIEWER: 'StoryViewerScreen',
  POST_DETAIL: 'PostDetailScreen',
  VIBE_DETAIL: 'VibeDetailScreen',
  USER_PROFILE: 'UserProfileScreen',
  FOLLOWERS: 'FollowersScreen',
  FOLLOWING: 'FollowingScreen',
  BOOKMARKS: 'BookmarksScreen',

  // Settings Stack Screens
  SETTINGS: 'SettingsScreen',
  EDIT_PROFILE: 'EditProfileScreen',
  CHAT_EXPIRY: 'ChatExpiryScreen',
  CREATE_CIRCLE: 'CreateCircleScreen',
};

// Pagination and App Defaults
export const FEED_PAGE_SIZE = 10;
export const CHAT_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 400;
export const STORY_DURATION_MS = 5000;
export const VOICE_MAX_DURATION_S = 60;

