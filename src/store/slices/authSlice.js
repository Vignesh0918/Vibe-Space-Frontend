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

/**
 * Async thunk to request OTP for a phone number.
 * Returns a serializable status: { success, mode: 'firebase' | 'mock' }
 */
export const loginWithPhone = createAsyncThunk(
  'auth/loginWithPhone',
  async ({ phoneNumber }, { rejectWithValue }) => {
    const result = await authService.sendOTP(phoneNumber);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return { success: true, mode: result.mode };
  }
);

/**
 * Async thunk to verify OTP code.
 * Checks MongoDB for existing profile after verification.
 * Returns { profileExists, userData } to help the screen decide navigation.
 */
export const verifyOTPThunk = createAsyncThunk(
  'auth/verifyOTPThunk',
  async ({ otp }, { dispatch, rejectWithValue }) => {
    const result = await authService.verifyOTP(otp);
    if (!result.success) {
      return rejectWithValue(result.error);
    }

    const { uid, phoneNumber } = result.data;

    // Check if user has a MongoDB profile
    try {
      const profileResult = await authService.getUserProfile(uid);
      if (profileResult.success && profileResult.data) {
        // Existing user — log them in fully
        const profileData = {
          uid,
          phoneNumber,
          displayName: profileResult.data.displayName,
          username: profileResult.data.username,
          photoURL: profileResult.data.photoURL,
          bio: profileResult.data.bio,
          mood: profileResult.data.mood,
        };
        dispatch(setUser(profileData));
        return { profileExists: true, userData: profileData };
      }
    } catch {
      // Profile doesn't exist or API error — treat as new user
    }

    // New user — return credentials but don't set isLoggedIn yet
    return {
      profileExists: false,
      userData: { uid, phoneNumber },
    };
  }
);

/**
 * Async thunk to sign in with Google.
 * Checks MongoDB for existing profile after authentication.
 * Returns { profileExists, userData } to help the screen decide navigation.
 */
export const loginWithGoogleThunk = createAsyncThunk(
  'auth/loginWithGoogleThunk',
  async ({ googleUser }, { dispatch, rejectWithValue }) => {
    const result = await authService.loginWithGoogle(googleUser);
    if (!result.success) {
      return rejectWithValue(result.error);
    }

    const { uid, displayName, email, photoURL } = result.data;

    // Check if user has a MongoDB profile
    try {
      const profileResult = await authService.getUserProfile(uid);
      if (profileResult.success && profileResult.data) {
        // Existing user — log them in fully
        const profileData = {
          uid,
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
    } catch {
      // Profile doesn't exist — treat as new user
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
      // Phone Login (Send OTP)
      .addCase(loginWithPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithPhone.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(loginWithPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // OTP verification
      .addCase(verifyOTPThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTPThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyOTPThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
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
