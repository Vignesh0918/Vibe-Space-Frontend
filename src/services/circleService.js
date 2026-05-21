/**
 * circleService.js
 * Manages creation of user Circles, loading circle memberships, and
 * updating list participants in real-time.
 */

import apiClient from '../config/api';

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
