/**
 * vibeService.js
 * Handles Vibe creation, feed fetching, reactions, and deletion.
 */

import apiClient from '../config/api';

/**
 * Maps MongoDB Vibe documents (_id) to standard ID properties.
 */
const mapVibeIds = (vibe) => {
  if (!vibe) return vibe;
  return {
    ...vibe,
    id: vibe._id || vibe.id,
  };
};

/**
 * Creates a new vibe (expires in 24 hours).
 * @param {object} vibeData - { mood, text, songTitle, songArtist, circleIds }
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createVibe(vibeData) {
  try {
    const response = await apiClient.post('/vibes', vibeData);
    if (response.data.success && response.data.data) {
      response.data.data = mapVibeIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches the active vibes feed for circles the user belongs to.
 * @param {string} userId - Target user ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getVibesFeed(userId) {
  try {
    const response = await apiClient.get(`/vibes/feed/${userId}`);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(mapVibeIds);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets details of a single vibe.
 * @param {string} vibeId - Target vibe ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getVibeDetails(vibeId) {
  try {
    const response = await apiClient.get(`/vibes/${vibeId}`);
    if (response.data.success && response.data.data) {
      response.data.data = mapVibeIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Deletes a vibe.
 * @param {string} vibeId - Vibe ID.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function deleteVibe(vibeId) {
  try {
    const response = await apiClient.delete(`/vibes/${vibeId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Toggles an emoji reaction on a vibe.
 * @param {string} vibeId - Target vibe ID.
 * @param {string} emoji - Emoji symbol.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function reactToVibe(vibeId, emoji) {
  try {
    const response = await apiClient.post(`/vibes/${vibeId}/react`, { emoji });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Real-time listener for the active vibes feed via polling.
 * @param {string} userId - Current user ID.
 * @param {function} callback - Callback function triggered on new feed state.
 * @returns {function} Unsubscribe function.
 */
export function listenToVibesFeed(userId, callback) {
  let active = true;
  let intervalId = null;
  let previousDataJson = '';

  const check = async () => {
    try {
      const res = await getVibesFeed(userId);
      if (res.success && active) {
        const vibes = res.data || [];
        const currentDataJson = JSON.stringify(vibes);
        if (currentDataJson !== previousDataJson) {
          previousDataJson = currentDataJson;
          callback(vibes);
        }
      }
    } catch (err) {
      console.warn('Error polling vibes feed:', err);
    }
  };

  check();
  intervalId = setInterval(check, 6000); // Poll vibes feed every 6 seconds

  return () => {
    active = false;
    if (intervalId) clearInterval(intervalId);
  };
}
