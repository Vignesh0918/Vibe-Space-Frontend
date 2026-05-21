/**
 * userSlice.js
 * Redux Toolkit slice that governs profile details (username, name, avatar, bio, current mood)
 * synced with user Firestore records.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';

// Async thunk to fetch user profile
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId, { rejectWithValue }) => {
    const result = await authService.getUserProfile(userId);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data;
  }
);

// Async thunk to save or update profile data
export const saveProfile = createAsyncThunk(
  'user/saveProfile',
  async ({ userId, profileData }, { rejectWithValue }) => {
    const result = await authService.createUserProfile(userId, profileData);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data;
  }
);

const initialState = {
  profile: null, // name, username, bio, photoURL, mood
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Save Profile
      .addCase(saveProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setProfile, updateProfile, clearProfile } = userSlice.actions;
export default userSlice.reducer;
