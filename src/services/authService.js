/**
 * authService.js
 * Handles Firebase Phone Authentication, MongoDB user profile management via Express API,
 * online presence updates, and session state tracking.
 * 
 * Supports dual-mode phone auth:
 * - Firebase mode: Uses signInWithPhoneNumber with a mock app verifier (works with
 *   Firebase Console test phone numbers).
 * - Mock/Dev mode: Falls back to anonymous sign-in with OTP code '123456' for local
 *   testing when Firebase phone auth is not configured or fails.
 */

import { signInWithPhoneNumber, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { uploadFile } from './storageService';
import apiClient from '../config/api';

// Module-level state to track the current OTP session
let _confirmationResult = null;
let _authMode = 'firebase'; // 'firebase' | 'mock'
let _pendingPhoneNumber = null;

/**
 * Creates a minimal mock application verifier that satisfies Firebase's
 * signInWithPhoneNumber interface. Works with Firebase Console test phone numbers.
 */
function createMockVerifier() {
  return {
    type: 'recaptcha',
    verify: () => Promise.resolve('mock-recaptcha-token'),
  };
}

/**
 * Sends an OTP to the given phone number.
 * Attempts Firebase signInWithPhoneNumber first. If it fails (e.g. recaptcha issues
 * in Expo Go), falls back to mock mode for development.
 * 
 * @param {string} phoneNumber - User's phone number with country code (e.g. '+919876543210').
 * @returns {Promise<{success: boolean, mode?: string, error?: string}>}
 */
export async function sendOTP(phoneNumber) {
  try {
    _pendingPhoneNumber = phoneNumber;
    const mockVerifier = createMockVerifier();
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, mockVerifier);
    _confirmationResult = confirmation;
    _authMode = 'firebase';
    return { success: true, mode: 'firebase' };
  } catch (error) {
    console.warn('Firebase phone auth failed, switching to mock mode:', error.message);
    // Fall back to mock mode for development/testing
    _confirmationResult = null;
    _authMode = 'mock';
    return { success: true, mode: 'mock' };
  }
}

/**
 * Confirms the OTP code entered by the user.
 * In Firebase mode, uses the confirmation result from sendOTP.
 * In mock mode, accepts '123456' and signs in anonymously to get a valid Firebase UID.
 * 
 * @param {string} otp - The 6-digit OTP code entered by the user.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function verifyOTP(otp) {
  try {
    if (_authMode === 'firebase' && _confirmationResult) {
      const result = await _confirmationResult.confirm(otp);
      const user = result.user;
      _confirmationResult = null;
      return {
        success: true,
        data: {
          uid: user.uid,
          phoneNumber: user.phoneNumber || _pendingPhoneNumber,
        },
      };
    }

    // Mock mode: accept '123456' for dev testing
    if (otp !== '123456') {
      return { success: false, error: 'Invalid verification code. Use 123456 for testing.' };
    }

    // Sign in anonymously to get a real Firebase UID and valid ID token
    const anonResult = await signInAnonymously(auth);
    const user = anonResult.user;
    return {
      success: true,
      data: {
        uid: user.uid,
        phoneNumber: _pendingPhoneNumber || '+910000000000',
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

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
