/**
 * authService.js
 * Handles Google Sign-in authentication, MongoDB user profile management via Express API,
 * online presence updates, and session state tracking.
 */

import { signOut, onAuthStateChanged, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { uploadFile } from './storageService';
import apiClient from '../config/api';





/**
 * Signs in with a real Google account using native SDK and Firebase.
 * Dynamically imports GoogleSignin to prevent bundle/runtime crash in standard Expo Go environments.
 * 
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function loginWithRealGoogle() {
  try {
    let GoogleSignin;
    try {
      GoogleSignin = require('@react-native-google-signin/google-signin/lib/module/signIn/GoogleSignin').GoogleSignin;
    } catch (e) {
      throw new Error('Google Sign-In is only supported on a native development build. Please build the native app binary first.');
    }

    // Dynamically retrieve Web Client ID from downloaded google-services.json
    let webClientId = undefined;
    try {
      const googleServices = require('../../google-services.json');
      const clients = googleServices?.client || [];
      for (const client of clients) {
        const oauthClients = client?.oauth_client || [];
        const webClient = oauthClients.find(oc => oc.client_type === 3);
        if (webClient && webClient.client_id) {
          webClientId = webClient.client_id;
          break;
        }
      }
    } catch (err) {
      console.warn('[GoogleSignin] Could not parse google-services.json for webClientId. Using config fallback.');
    }

    if (!webClientId) {
      throw new Error('Web Client ID not found. Make sure you enabled Google Sign-In in Firebase Console and replaced google-services.json.');
    }

    GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
    });

    await GoogleSignin.hasPlayServices();
    const signInResult = await GoogleSignin.signIn();
    
    // Support both new and old Google Sign-In SDK return formats
    const idToken = signInResult.data?.idToken || signInResult.idToken;
    if (!idToken) {
      throw new Error('Google Sign-In returned no ID Token.');
    }

    // Authenticate with Firebase using Google credentials
    const credential = GoogleAuthProvider.credential(idToken);
    const firebaseResult = await signInWithCredential(auth, credential);
    const user = firebaseResult.user;

    return {
      success: true,
      data: {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'VibeSpace User',
        email: user.email,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber || null,
      },
    };
  } catch (error) {
    console.error('Real Google Sign-In error:', error);
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

    // Also sign out from native Google Sign-In if available
    try {
      const GoogleSignin = require('@react-native-google-signin/google-signin/lib/module/signIn/GoogleSignin').GoogleSignin;
      if (GoogleSignin) {
        let webClientId = undefined;
        try {
          const googleServices = require('../../google-services.json');
          const clients = googleServices?.client || [];
          for (const client of clients) {
            const oauthClients = client?.oauth_client || [];
            const webClient = oauthClients.find(oc => oc.client_type === 3);
            if (webClient && webClient.client_id) {
              webClientId = webClient.client_id;
              break;
            }
          }
        } catch (err) {
          // ignore
        }
        if (webClientId) {
          GoogleSignin.configure({
            webClientId,
            offlineAccess: true,
          });
        }
        await GoogleSignin.signOut();
      }
    } catch (googleError) {
      console.log('Google Sign-out skipped or failed (probably not in native environment):', googleError);
    }

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

/**
 * Fetches user profile data from MongoDB by email.
 * @param {string} email - User's email address.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getUserProfileByEmail(email) {
  try {
    const cleanEmail = encodeURIComponent(email.trim().toLowerCase());
    const response = await apiClient.get(`/users/email/${cleanEmail}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Syncs the existing MongoDB profile for an email to a new Firebase UID.
 * @param {string} email - User's email address.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function syncProfileUid(email) {
  try {
    const response = await apiClient.post('/users/sync-uid', { email });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

