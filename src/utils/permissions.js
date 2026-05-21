/**
 * permissions.js
 * Centralized utility for requesting hardware permissions (Camera, Media Library, and Location)
 * using Expo APIs.
 */

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

/**
 * Requests device camera permission.
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export async function requestCameraPermission() {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return { success: status === 'granted', status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Requests device media library / photo gallery permissions.
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export async function requestMediaLibraryPermission() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return { success: status === 'granted', status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Requests device location permission.
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return { success: status === 'granted', status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
