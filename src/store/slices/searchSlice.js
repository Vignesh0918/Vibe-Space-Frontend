/**
 * searchSlice.js
 * Redux Toolkit slice managing unified search queries and caches.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as searchService from '../../services/searchService';

// Async thunk to execute search
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async ({ query, type, page, limit }, { rejectWithValue }) => {
    const result = await searchService.search(query, type, page, limit);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data; // { users: [], circles: [], posts: [], vibes: [] }
  }
);

const initialState = {
  query: '',
  results: {
    users: [],
    circles: [],
    posts: [],
    vibes: [],
  },
  isLoading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setResults: (state, action) => {
      state.results = action.payload;
    },
    clearSearch: (state) => {
      state.query = '';
      state.results = {
        users: [],
        circles: [],
        posts: [],
        vibes: [],
      };
      state.error = null;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.results = action.payload || { users: [], circles: [], posts: [], vibes: [] };
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export const { setQuery, setResults, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
