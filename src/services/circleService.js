/**
 * circleService.js
 * Manages creation of user Circles, loading circle memberships, and
 * updating list participants in real-time.
 */

import apiClient from '../config/api';
import { uploadFile } from './storageService';

/**
 * Creates a new custom circle in MongoDB via Express API.
 * @param {object} circleData - Circle information (name, type, description, etc.).
 * @param {string} ownerId - Creator user ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createCircle(circleData, ownerId) {
  try {
    const response = await apiClient.post('/circles', circleData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Pre-populates default circles (Friends, Family, Work, Secret) for new signups.
 * @param {string} userId - Unique user ID.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function createDefaultCircles(userId) {
  try {
    const response = await apiClient.post('/circles/defaults');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets all circles that the user is a member of.
 * @param {string} userId - User ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getUserCircles(userId) {
  try {
    const response = await apiClient.get(`/circles/user/${userId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches details of a single circle.
 * @param {string} circleId - Circle ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getCircleDetails(circleId) {
  try {
    const response = await apiClient.get(`/circles/${circleId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Adds a user to a specific circle.
 * @param {string} circleId - Circle ID.
 * @param {string} userId - User ID to add.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function addMemberToCircle(circleId, userId) {
  try {
    const response = await apiClient.post(`/circles/${circleId}/members`, { userId });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Removes a user from a specific circle.
 * @param {string} circleId - Circle ID.
 * @param {string} userId - User ID to remove.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeMemberFromCircle(circleId, userId) {
  try {
    const response = await apiClient.delete(`/circles/${circleId}/members/${userId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Deletes a circle.
 * @param {string} circleId - ID of circle to delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCircle(circleId) {
  try {
    const response = await apiClient.delete(`/circles/${circleId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Subscribes to real-time changes of user's circles by polling the server.
 * @param {string} userId - User ID.
 * @param {function} callback - Callback function triggered on circle updates.
 * @returns {function} Unsubscribe listener function.
 */
export function listenToUserCircles(userId, callback) {
  let active = true;
  let intervalId = null;
  let previousDataJson = '';

  const check = async () => {
    try {
      const res = await getUserCircles(userId);
      if (res.success && active) {
        // Map document _id to id to keep frontend code compatible
        const mappedData = (res.data || []).map(circle => ({
          ...circle,
          id: circle._id || circle.id
        }));

        const currentDataJson = JSON.stringify(mappedData);
        if (currentDataJson !== previousDataJson) {
          previousDataJson = currentDataJson;
          callback(mappedData);
        }
      }
    } catch (err) {
      console.warn('Error polling user circles:', err);
    }
  };

  check();
  intervalId = setInterval(check, 5000);

  return () => {
    active = false;
    if (intervalId) clearInterval(intervalId);
  };
}

/**
 * Updates an existing Circle.
 * Handles local file upload for the avatar if needed.
 * @param {string} circleId - Target circle ID.
 * @param {object} data - Updated circle fields (name, description, type, isPublic, tags, avatar).
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function updateCircle(circleId, data) {
  try {
    const updateData = { ...data };
    if (updateData.avatar && (updateData.avatar.startsWith('file://') || updateData.avatar.startsWith('content://'))) {
      const uploadRes = await uploadFile(updateData.avatar, `circles/${circleId}/avatar`);
      if (uploadRes.success) {
        updateData.avatar = uploadRes.data;
      } else {
        return { success: false, error: `Failed to upload circle avatar: ${uploadRes.error}` };
      }
    }
    const response = await apiClient.put(`/circles/${circleId}`, updateData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Generates an invite code for a circle.
 * @param {string} circleId - Target circle ID.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function generateInviteCode(circleId) {
  try {
    const response = await apiClient.post(`/circles/${circleId}/invite`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Joins a circle by invite code.
 * @param {string} inviteCode - The 8-character invite code.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function joinCircleByCode(inviteCode) {
  try {
    const response = await apiClient.post('/circles/join', { inviteCode });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets all user profile members of a specific circle.
 * @param {string} circleId - Circle ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getCircleMembers(circleId) {
  try {
    const response = await apiClient.get(`/circles/${circleId}/members`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Retrieves public recommended circles that the user is not a member of.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getRecommendedCircles() {
  try {
    const response = await apiClient.get('/circles/recommended');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

