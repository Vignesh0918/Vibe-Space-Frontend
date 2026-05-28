/**
 * aiService.js
 * Frontend service layer for VibeSpace AI features.
 * Calls the backend /api/ai/* endpoints via the shared apiClient.
 */

import apiClient from '../config/api';

/**
 * Generates an AI caption for an image.
 * @param {string} imageBase64 - Base64-encoded image data (without data: prefix).
 * @param {string} mimeType - Image MIME type (e.g. 'image/jpeg').
 * @param {string} circleType - Circle context ('Friends', 'Family', 'Work', 'Secret').
 * @returns {Promise<{success: boolean, data?: {caption, hashtags, mood, alt_captions}, error?: string}>}
 */
export async function generateAICaption(imageBase64, mimeType = 'image/jpeg', circleType = 'Friends') {
  try {
    const response = await apiClient.post('/ai/caption', {
      imageBase64,
      mimeType,
      circleType,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets smart reply suggestions for a chat message.
 * @param {string} lastMessage - The last received message text.
 * @param {string} senderName - Name of the message sender.
 * @param {boolean} isGroup - Whether this is a group chat.
 * @returns {Promise<{success: boolean, data?: {replies: Array<{text, type}>}, error?: string}>}
 */
export async function getSmartReplies(lastMessage, senderName, isGroup = false) {
  try {
    const response = await apiClient.post('/ai/smart-reply', {
      lastMessage,
      senderName,
      isGroup,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Detects mood from a post caption.
 * @param {string} caption - Post caption text.
 * @returns {Promise<{success: boolean, data?: {detected_mood, mood_emoji, confidence, should_update_profile, vibe_comment, secondary_mood}, error?: string}>}
 */
export async function detectMood(caption) {
  try {
    const response = await apiClient.post('/ai/detect-mood', {
      caption,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Generates creative circle name suggestions.
 * @param {string} circleType - Type of circle.
 * @param {string} selectedEmoji - Emoji chosen by user.
 * @param {string} privacy - Privacy level ('Open', 'Invite Only', 'Secret').
 * @param {number} memberCount - Expected member count.
 * @returns {Promise<{success: boolean, data?: {suggestions: Array<{name, vibe, emoji_match}>, best_pick}, error?: string}>}
 */
export async function generateCircleNames(circleType, selectedEmoji = '✨', privacy = 'Invite Only', memberCount = 5) {
  try {
    const response = await apiClient.post('/ai/circle-names', {
      circleType,
      selectedEmoji,
      privacy,
      memberCount,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets an AI-generated daily vibe summary.
 * @param {object} activityData - Object with followersCount, reactionsCount, commentsCount, messagesCount, circlesActive, topEmoji.
 * @returns {Promise<{success: boolean, data?: {summary, highlight, motivation, day_rating}, error?: string}>}
 */
export async function getDailySummary(activityData) {
  try {
    const response = await apiClient.post('/ai/daily-summary', activityData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Generates catchy title suggestions for nearby vibes.
 * @param {string} vibeEmoji - Selected vibe emoji.
 * @param {string} locationHint - Location context or 'Unknown'.
 * @param {string} timeOfDay - 'Morning', 'Afternoon', 'Evening', or 'Night'.
 * @param {string[]} userTags - Tags entered by the user.
 * @returns {Promise<{success: boolean, data?: {suggestions: string[], best_match: string}, error?: string}>}
 */
export async function suggestVibeTitles(vibeEmoji, locationHint = 'Unknown', timeOfDay = 'Evening', userTags = []) {
  try {
    const response = await apiClient.post('/ai/vibe-titles', {
      vibeEmoji,
      locationHint,
      timeOfDay,
      userTags,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}
