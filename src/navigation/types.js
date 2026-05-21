/**
 * types.js
 * 
 * JSDoc specifications and PropTypes definitions for VibeSpace navigation routes.
 * Defines parameter schemas, route objects, and validations for screens.
 */

import PropTypes from 'prop-types';

/**
 * JSDoc definitions for VibeSpace Screen Parameters.
 * Use these as reference types when typing screen props.
 * 
 * @typedef {Object} ScreenParamList
 * 
 * @property {undefined} SplashScreen - Initial startup splash screen.
 * @property {undefined} OnboardingScreen - Initial sliders explaining app features.
 * @property {undefined} LoginScreen - Input phone number to request SMS verification.
 * 
 * @property {Object} OTPScreen - Input SMS verification code.
 * @property {string} OTPScreen.phoneNumber - The phone number OTP was sent to.
 * @property {Object} [OTPScreen.confirmation] - Firebase confirmation object.
 * 
 * @property {undefined} ProfileSetupScreen - Initial profile creation (display name, username, bio, mood).
 * 
 * @property {undefined} HomeScreen - Home Feed tab listing posts.
 * @property {undefined} AddPostScreen - Screen to publish new posts to specific circles.
 * @property {undefined} CirclesScreen - Tab displaying circles (Friends, Family, Work, Secret).
 * 
 * @property {Object} CircleDetailScreen - Feed and members list for a specific circle.
 * @property {string} CircleDetailScreen.circleId - Unique circle ID (e.g. friends, family, work, secret).
 * @property {string} CircleDetailScreen.circleName - Display title of the circle.
 * @property {string} CircleDetailScreen.circleColor - Hex color for circle theme visualization.
 * 
 * @property {Object} [CreateCircleScreen] - Screen to create/modify a custom circle.
 * @property {string} [CreateCircleScreen.circleId] - Circle ID if in edit mode.
 * 
 * @property {undefined} ChatListScreen - Tab view of DM channels and group chats.
 * 
 * @property {Object} ChatScreen - 1-on-1 direct message conversation screen.
 * @property {string} ChatScreen.chatId - Unique chat room ID.
 * @property {string} ChatScreen.otherUserId - Recipient's unique user ID.
 * @property {string} ChatScreen.otherUserName - Recipient's display name.
 * 
 * @property {Object} GroupChatScreen - Group messaging screen.
 * @property {string} GroupChatScreen.groupId - Unique group chat identifier.
 * @property {string} GroupChatScreen.groupName - Display title of the group.
 * 
 * @property {undefined} ProfileScreen - User profile, grid of posts, current status.
 * @property {undefined} SearchScreen - Search users, posts, and circles.
 * @property {undefined} NotificationsScreen - Activity logs, comments, circle invites.
 * @property {undefined} NearbyVibesScreen - Map screen displaying coordinates.
 * 
 * @property {Object} StoryViewerScreen - Fullscreen story renderer.
 * @property {string} StoryViewerScreen.storyId - The target story item ID.
 * @property {Array<string>} StoryViewerScreen.allStoryIds - Array of active story IDs in sequence.
 * 
 * @property {Object} PostDetailScreen - Detailed single post view.
 * @property {string} PostDetailScreen.postId - Unique identifier of the post.
 * 
 * @property {undefined} SettingsScreen - Global configurations, preferences.
 * @property {undefined} EditProfileScreen - Form to edit profile picture, name, bio.
 * @property {undefined} ChatExpiryScreen - Dynamic slider modifying global DM auto-deletion timers.
 */

// Navigation Prop Verification shapes (useful for screens receiving navigation/route)
export const NavigationPropTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired,
    canGoBack: PropTypes.func.isRequired,
  }).isRequired,
};

export const OTPScreenRouteProp = PropTypes.shape({
  params: PropTypes.shape({
    phoneNumber: PropTypes.string.isRequired,
    confirmation: PropTypes.object,
  }).isRequired,
}).isRequired;

export const CircleDetailScreenRouteProp = PropTypes.shape({
  params: PropTypes.shape({
    circleId: PropTypes.string.isRequired,
    circleName: PropTypes.string.isRequired,
    circleColor: PropTypes.string.isRequired,
  }).isRequired,
}).isRequired;

export const ChatScreenRouteProp = PropTypes.shape({
  params: PropTypes.shape({
    chatId: PropTypes.string.isRequired,
    otherUserId: PropTypes.string.isRequired,
    otherUserName: PropTypes.string.isRequired,
  }).isRequired,
}).isRequired;

export const GroupChatScreenRouteProp = PropTypes.shape({
  params: PropTypes.shape({
    groupId: PropTypes.string.isRequired,
    groupName: PropTypes.string.isRequired,
  }).isRequired,
}).isRequired;

export const StoryViewerScreenRouteProp = PropTypes.shape({
  params: PropTypes.shape({
    storyId: PropTypes.string.isRequired,
    allStoryIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
}).isRequired;

export const PostDetailScreenRouteProp = PropTypes.shape({
  params: PropTypes.shape({
    postId: PropTypes.string.isRequired,
  }).isRequired,
}).isRequired;
