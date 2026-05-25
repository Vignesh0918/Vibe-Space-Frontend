/**
 * authSlice.js
 * Redux Toolkit slice managing authentication status, user references,
 * and dispatching Firebase auth requests via thunks.
 * 
 * Supports:
 * - Phone OTP login (Firebase + mock fallback)
 * - Google Sign-In (simulated via anonymous Firebase auth)
 * - MongoDB profile synchronization
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';



// Async thunk to sign in with Google.
// Checks MongoDB for existing profile after authentication.
// Returns { profileExists, userData } to help the screen decide navigation.
export const loginWithGoogleThunk = createAsyncThunk(
  'auth/loginWithGoogleThunk',
  async ({ googleUser }, { dispatch, rejectWithValue }) => {
    const result = await authService.loginWithGoogle(googleUser);
    if (!result.success) {
      return rejectWithValue(result.error);
    }

    const { uid, displayName, email, photoURL } = result.data;

    // Check if user has a MongoDB profile by UID first
    try {
      let profileResult = await authService.getUserProfile(uid);
      
      // If not found by UID, check if we can locate them by email
      if ((!profileResult.success || !profileResult.data) && email) {
        const emailSearch = await authService.getUserProfileByEmail(email);
        if (emailSearch.success && emailSearch.data) {
          // Profile exists under this email! Let's trigger a UID sync to link it
          const syncRes = await authService.syncProfileUid(email);
          if (syncRes.success) {
            profileResult = syncRes;
          }
        }
      }

      if (profileResult.success && profileResult.data) {
        // Existing user — log them in fully
        const profileData = {
          uid: profileResult.data.uid, // use the updated/synced UID
          displayName: profileResult.data.displayName,
          username: profileResult.data.username,
          photoURL: profileResult.data.photoURL,
          bio: profileResult.data.bio,
          mood: profileResult.data.mood,
          email,
        };
        dispatch(setUser(profileData));
        return { profileExists: true, userData: profileData };
      }
    } catch (error) {
      console.warn('Profile check by UID/email failed:', error.message || error);
    }

    // New user — return Google credentials for profile setup
    return {
      profileExists: false,
      userData: { uid, displayName, email, photoURL },
    };
  }
);

// Async thunk to sign in with a real Google account.
// Checks MongoDB for existing profile after authentication.
export const loginWithRealGoogleThunk = createAsyncThunk(
  'auth/loginWithRealGoogleThunk',
  async (_, { dispatch, rejectWithValue }) => {
    const result = await authService.loginWithRealGoogle();
    if (!result.success) {
      return rejectWithValue(result.error);
    }

    const { uid, displayName, email, photoURL } = result.data;

    // Check if user has a MongoDB profile by UID first
    try {
      let profileResult = await authService.getUserProfile(uid);
      
      // If not found by UID, check if we can locate them by email
      if ((!profileResult.success || !profileResult.data) && email) {
        const emailSearch = await authService.getUserProfileByEmail(email);
        if (emailSearch.success && emailSearch.data) {
          // Profile exists under this email! Let's trigger a UID sync to link it
          const syncRes = await authService.syncProfileUid(email);
          if (syncRes.success) {
            profileResult = syncRes;
          }
        }
      }

      if (profileResult.success && profileResult.data) {
        // Existing user — log them in fully
        const profileData = {
          uid: profileResult.data.uid, // use the updated/synced UID
          displayName: profileResult.data.displayName,
          username: profileResult.data.username,
          photoURL: profileResult.data.photoURL,
          bio: profileResult.data.bio,
          mood: profileResult.data.mood,
          email,
        };
        dispatch(setUser(profileData));
        return { profileExists: true, userData: profileData };
      }
    } catch (error) {
      console.warn('Profile check by UID/email failed:', error.message || error);
    }

    // New user — return Google credentials for profile setup
    return {
      profileExists: false,
      userData: { uid, displayName, email, photoURL },
    };
  }
);

// Async thunk to log out
export const logoutThunk = createAsyncThunk(
  'auth/logoutThunk',
  async (_, { dispatch, rejectWithValue }) => {
    const result = await authService.logout();
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    dispatch(clearUser());
    return null;
  }
);

const initialState = {
  isLoggedIn: false,
  user: null, // Holds uid, phoneNumber, displayName, username, etc.
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.isLoggedIn = !!action.payload;
      state.user = action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Google Login
      .addCase(loginWithGoogleThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogleThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(loginWithGoogleThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Real Google Login
      .addCase(loginWithRealGoogleThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithRealGoogleThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(loginWithRealGoogleThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Logout
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setUser, clearUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
