/**
 * locationService.js
 * Configures Expo Location permissions, queries client geo-coordinates,
 * updates user geolocation via Express API to MongoDB, and calculates Haversine
 * distances to discover "Nearby Vibes" within a set radius.
 */

import * as Location from 'expo-location';
import apiClient from '../config/api';

/**
 * Requests device location permission from the user.
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export async function requestLocationPermissions() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return { success: status === 'granted', status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves the current GPS location coordinates.
 * @returns {Promise<{success: boolean, data?: {latitude: number, longitude: number}, error?: string}>}
 */
export async function getCurrentLocation() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const permissionReq = await requestLocationPermissions();
      if (!permissionReq.success) {
        return { success: false, error: 'Location permission was denied' };
      }
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { 
      success: true, 
      data: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates a user's location coordinates in MongoDB via Express API.
 * @param {string} userId - Target user ID (unused in Mongoose but kept for signature compatibility).
 * @param {number} latitude - Current latitude coordinate.
 * @param {number} longitude - Current longitude coordinate.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateUserLocation(userId, latitude, longitude) {
  try {
    if (!userId) return { success: false, error: 'User ID is required' };
    const response = await apiClient.post('/users/location', { latitude, longitude });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Computes the distance (in kilometers) between two GPS points using the Haversine formula.
 * @param {number} lat1 - Latitude of coordinate 1.
 * @param {number} lon1 - Longitude of coordinate 1.
 * @param {number} lat2 - Latitude of coordinate 2.
 * @param {number} lon2 - Longitude of coordinate 2.
 * @returns {number} Distance in kilometers.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Converts degrees to radians.
 * @param {number} deg - Degrees.
 * @returns {number} Radians.
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Queries all users and filters them locally using the Haversine formula to return nearby active users.
 * @param {string} currentUserId - ID of the searching user.
 * @param {number} currentLat - Latitude of the search anchor.
 * @param {number} currentLon - Longitude of the search anchor.
 * @param {number} radiusInKm - Search radius threshold in kilometers (default 10km).
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getNearbyUsers(currentUserId, currentLat, currentLon, radiusInKm = 10) {
  try {
    const maxDistanceInMeters = radiusInKm * 1000;
    const response = await apiClient.get('/users/nearby/search', {
      params: {
        latitude: currentLat,
        longitude: currentLon,
        maxDistance: maxDistanceInMeters
      }
    });

    if (response.data.success && response.data.data) {
      const users = (response.data.data || []).map(u => {
        let lat = null;
        let lon = null;
        if (u.location && u.location.coordinates) {
          lon = u.location.coordinates[0];
          lat = u.location.coordinates[1];
        }

        const distance = calculateDistance(currentLat, currentLon, lat, lon);

        return {
          ...u,
          id: u.uid || u._id,
          // Convert GeoJSON structure back to latitude/longitude for components
          location: { latitude: lat, longitude: lon },
          distance: parseFloat(distance.toFixed(2)),
        };
      });

      // Sort by distance ascending
      users.sort((a, b) => a.distance - b.distance);

      return { success: true, data: users };
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}
