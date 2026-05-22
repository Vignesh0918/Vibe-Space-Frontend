/**
 * vibeSlice.js
 * Redux Toolkit slice managing active vibes feed from circles.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as vibeService from '../../services/vibeService';

// Async thunk to fetch vibes feed
export const fetchVibesFeed = createAsyncThunk(
  'vibe/fetchVibesFeed',
  async ({ userId }, { rejectWithValue }) => {
    const result = await vibeService.getVibesFeed(userId);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data || [];
  }
);

// Async thunk to create a new vibe
export const createVibeThunk = createAsyncThunk(
  'vibe/createVibeThunk',
  async ({ mood, text, songTitle, songArtist, circleIds }, { rejectWithValue }) => {
    const result = await vibeService.createVibe({ mood, text, songTitle, songArtist, circleIds });
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data;
  }
);

// Async thunk to delete a vibe
export const deleteVibeThunk = createAsyncThunk(
  'vibe/deleteVibeThunk',
  async ({ vibeId }, { rejectWithValue }) => {
    const result = await vibeService.deleteVibe(vibeId);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return vibeId;
  }
);

const initialState = {
  feed: [],
  isLoading: false,
  error: null,
};

const vibeSlice = createSlice({
  name: 'vibe',
  initialState,
  reducers: {
    setVibes: (state, action) => {
      state.feed = action.payload;
    },
    addVibe: (state, action) => {
      // Append at the beginning
      state.feed = [action.payload, ...state.feed];
    },
    removeVibe: (state, action) => {
      state.feed = state.feed.filter(v => v.id !== action.payload);
    },
    clearVibeState: (state) => {
      state.feed = [];
      state.error = null;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch feed
      .addCase(fetchVibesFeed.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVibesFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feed = action.payload;
      })
      .addCase(fetchVibesFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Create vibe
      .addCase(createVibeThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createVibeThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feed = [action.payload, ...state.feed];
      })
      .addCase(createVibeThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Delete vibe
      .addCase(deleteVibeThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteVibeThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feed = state.feed.filter(v => v.id !== action.payload);
      })
      .addCase(deleteVibeThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export const { setVibes, addVibe, removeVibe, clearVibeState } = vibeSlice.actions;
export default vibeSlice.reducer;
