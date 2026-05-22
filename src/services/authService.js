/**
 * authService.js
 * Handles Google Sign-in authentication, MongoDB user profile management via Express API,
 * online presence updates, and session state tracking.
 */

import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { uploadFile } from './storageService';
import apiClient from '../config/api';



/**
 * Signs in with a simulated Google account.
 * Since Expo Go doesn't support native Google Sign-In, we use anonymous Firebase auth
 * to generate a valid UID and token, then attach the Google profile details.
 * 
 * @param {object} googleUser - Simulated Google user profile { displayName, email, photoURL }.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function loginWithGoogle(googleUser) {
  try {
    const anonResult = await signInAnonymously(auth);
    const user = anonResult.user;
    return {
      success: true,
      data: {
        uid: user.uid,
        displayName: googleUser.displayName,
        email: googleUser.email,
        photoURL: googleUser.photoURL,
        phoneNumber: null,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Checks if a username is valid and available in MongoDB.
 * Rules: lowercase, 3-20 characters, alphanumeric and underscore only.
 * @param {string} username - Target username.
 * @returns {Promise<{success: boolean, available?: boolean, error?: string}>}
 */
export async function checkUsernameAvailable(username) {
  try {
    const response = await apiClient.get(`/users/check-username/${username}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Creates a user profile document in MongoDB via Express API.
 * Triggers default circles initialization on creation.
 * @param {string} userId - Unique user ID.
 * @param {object} profileData - Fields such as username, bio, photoURL, and initial mood.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createUserProfile(userId, profileData) {
  try {
    const username = profileData.username;
    if (!username) {
      return { success: false, error: 'Username is required' };
    }

    // Check photoURL and upload if it's local
    let finalPhotoURL = profileData.photoURL || '';
    if (finalPhotoURL && (finalPhotoURL.startsWith('file://') || finalPhotoURL.startsWith('content://'))) {
      const uploadRes = await uploadFile(finalPhotoURL, `profiles/${userId}`);
      if (uploadRes.success) {
        finalPhotoURL = uploadRes.data;
      } else {
        return { success: false, error: `Failed to upload profile photo: ${uploadRes.error}` };
      }
    }

    const response = await apiClient.post('/users', {
      ...profileData,
      photoURL: finalPhotoURL,
    });

    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches user profile data from MongoDB via Express API.
 * @param {string} userId - Unique user ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getUserProfile(userId) {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Updates specific fields in the user's MongoDB profile via Express API.
 * Integrates profile image uploading before document save if photoURL is local.
 * @param {string} userId - Unique user ID.
 * @param {object} data - Object containing fields to update.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function updateUserProfile(userId, data) {
  try {
    const updateData = { ...data };

    // Check photoURL and upload if it's local
    if (updateData.photoURL && (updateData.photoURL.startsWith('file://') || updateData.photoURL.startsWith('content://'))) {
      const uploadRes = await uploadFile(updateData.photoURL, `profiles/${userId}`);
      if (uploadRes.success) {
        updateData.photoURL = uploadRes.data;
      } else {
        return { success: false, error: `Failed to upload profile photo: ${uploadRes.error}` };
      }
    }

    const response = await apiClient.put(`/users/${userId}`, updateData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Updates the user's online status in MongoDB via Express API.
 * @param {string} userId - Unique user ID.
 * @param {boolean} isOnline - Online state.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateOnlineStatus(userId, isOnline) {
  try {
    if (!userId) return { success: false, error: 'User ID is required' };
    const response = await apiClient.post(`/users/${userId}/online`, { isOnline });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Signs the current user out, flagging them offline first.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function logout() {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updateOnlineStatus(currentUser.uid, false);
    }
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Listens to authentication state changes.
 * @param {function} callback - Callback function triggered on auth change.
 * @returns {function} Unsubscribe listener function.
 */
export function listenAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Follows a user in MongoDB.
 * @param {string} targetUserId - The ID of the user to follow.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function followUser(targetUserId) {
  try {
    const response = await apiClient.post(`/users/${targetUserId}/follow`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Unfollows a user in MongoDB.
 * @param {string} targetUserId - The ID of the user to unfollow.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function unfollowUser(targetUserId) {
  try {
    const response = await apiClient.delete(`/users/${targetUserId}/follow`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches followers for a user.
 * @param {string} userId - Target user ID.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getUserFollowers(userId) {
  try {
    const response = await apiClient.get(`/users/${userId}/followers`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches users followed by a user.
 * @param {string} userId - Target user ID.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getUserFollowing(userId) {
  try {
    const response = await apiClient.get(`/users/${userId}/following`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches recommended users for discovery.
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getRecommendedUsers() {
  try {
    const response = await apiClient.get('/users/recommended');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

