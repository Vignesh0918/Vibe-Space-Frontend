/**
 * nearbyVibeService.js
 * Handles fetching, creating, joining, and deleting nearby/location-based vibe bubbles.
 */

import apiClient from '../config/api';

/**
 * Maps nearby vibe documents to standard format with .id property.
 */
const mapNearbyVibeIds = (vibe) => {
  if (!vibe) return vibe;
  return {
    ...vibe,
    id: vibe._id || vibe.id,
  };
};

/**
 * Fetches nearby vibes within a given radius.
 * @param {number} lat - Latitude coordinates.
 * @param {number} lng - Longitude coordinates.
 * @param {number} radius - Search radius in kilometers.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getNearbyVibes(lat, lng, radius = 10) {
  try {
    const response = await apiClient.get('/nearby/vibes', {
      params: { lat, lng, radius }
    });
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(mapNearbyVibeIds);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Creates a nearby vibe bubble.
 * @param {object} vibeData - { lat, lng, emoji, title, tags, expiresInHours }
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createNearbyVibe(vibeData) {
  try {
    const response = await apiClient.post('/nearby/vibes', vibeData);
    if (response.data.success && response.data.data) {
      response.data.data = mapNearbyVibeIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Joins a nearby vibe bubble.
 * @param {string} vibeId - The target nearby vibe ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function joinNearbyVibe(vibeId) {
  try {
    const response = await apiClient.post(`/nearby/vibes/${vibeId}/join`);
    if (response.data.success && response.data.data) {
      response.data.data = mapNearbyVibeIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Deletes a nearby vibe bubble.
 * @param {string} vibeId - The target nearby vibe ID.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function deleteNearbyVibe(vibeId) {
  try {
    const response = await apiClient.delete(`/nearby/vibes/${vibeId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}
