/**
 * storyService.js
 * Manages publishing 24-hour stories, fetching stories grouped by creator,
 * recording views, and cleanups of expired stories.
 */

import { uploadStoryMedia } from './storageService';
import apiClient from '../config/api';

/**
 * Publishes a new story to a specific circle.
 * Uploads media asset first if it is local.
 * @param {object} storyData - Metadata (userId, userName, userAvatar, mediaUrl, circleId).
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createStory(storyData) {
  try {
    const { userId, mediaUrl } = storyData;
    let finalMediaUrl = mediaUrl || '';

    // Upload media if local path
    if (finalMediaUrl && (finalMediaUrl.startsWith('file://') || finalMediaUrl.startsWith('content://'))) {
      const uploadRes = await uploadStoryMedia(finalMediaUrl, userId);
      if (uploadRes.success) {
        finalMediaUrl = uploadRes.data;
      } else {
        return { success: false, error: `Failed to upload story media: ${uploadRes.error}` };
      }
    }

    const response = await apiClient.post('/stories', {
      ...storyData,
      mediaUrl: finalMediaUrl,
    });

    if (response.data.success && response.data.data) {
      response.data.data = {
        ...response.data.data,
        id: response.data.data._id || response.data.data.id
      };
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches non-expired active stories for a list of circles, grouped by poster.
 * @param {string[]} circleIds - Array of Circle IDs.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getCircleStories(circleIds) {
  try {
    if (!circleIds || circleIds.length === 0) {
      return { success: true, data: [] };
    }

    const response = await apiClient.get('/stories/circles', {
      params: {
        circleIds: circleIds.join(','),
      }
    });

    if (response.data.success && response.data.data) {
      const groups = response.data.data.map(group => {
        return {
          ...group,
          stories: (group.stories || []).map(story => ({
            ...story,
            id: story._id || story.id
          }))
        };
      });
      return { success: true, data: groups };
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Records that a user has viewed a story.
 * @param {string} storyId - ID of story being viewed.
 * @param {string} userId - ID of viewer.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markStoryViewed(storyId, userId) {
  try {
    const response = await apiClient.post(`/stories/${storyId}/view`, { userId });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Admin utility to batch-delete expired stories.
 * MongoDB TTL handles auto-expiration; this invokes backend cleanup as a fallback.
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function deleteExpiredStories() {
  try {
    const response = await apiClient.delete('/stories/expired');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets all active stories by a specific user.
 * @param {string} userId - Target user ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getUserStories(userId) {
  try {
    const response = await apiClient.get(`/stories/user/${userId}`);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(story => ({
        ...story,
        id: story._id || story.id
      }));
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets single story by ID.
 * @param {string} storyId - Story ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getStoryById(storyId) {
  try {
    const response = await apiClient.get(`/stories/${storyId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Deletes user's own story and its Cloudinary media.
 * @param {string} storyId - Story ID to delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteStory(storyId) {
  try {
    const response = await apiClient.delete(`/stories/${storyId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets viewers list for a story (owner only).
 * @param {string} storyId - Story ID.
 * @returns {Promise<{success: boolean, data?: array, totalViews?: number, error?: string}>}
 */
export async function getStoryViewers(storyId) {
  try {
    const response = await apiClient.get(`/stories/${storyId}/viewers`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

