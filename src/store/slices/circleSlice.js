/**
 * circleSlice.js
 * Redux Toolkit slice governing user circles list and active circle details.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as circleService from '../../services/circleService';

// Async thunk to fetch circles for a user
export const fetchCircles = createAsyncThunk(
  'circle/fetchCircles',
  async (userId, { rejectWithValue }) => {
    const result = await circleService.getUserCircles(userId);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data;
  }
);

// Async thunk to create a new circle
export const createCircleThunk = createAsyncThunk(
  'circle/createCircleThunk',
  async ({ circleData, ownerId }, { rejectWithValue }) => {
    const result = await circleService.createCircle(circleData, ownerId);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data;
  }
);

// Async thunk to add a member to a circle
export const addMemberThunk = createAsyncThunk(
  'circle/addMemberThunk',
  async ({ circleId, userId }, { rejectWithValue }) => {
    const result = await circleService.addMemberToCircle(circleId, userId);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return { circleId, userId };
  }
);

const initialState = {
  circles: [], // List of user-joined circles
  activeCircle: null, // Detailed circle data currently in view
  isLoading: false,
  error: null,
};

const circleSlice = createSlice({
  name: 'circle',
  initialState,
  reducers: {
    setCircles: (state, action) => {
      state.circles = action.payload;
    },
    addCircle: (state, action) => {
      state.circles = [action.payload, ...state.circles];
    },
    setActiveCircle: (state, action) => {
      state.activeCircle = action.payload;
    },
    updateCircleMembers: (state, action) => {
      const { circleId, members } = action.payload;
      // Update in list
      const index = state.circles.findIndex(c => c.id === circleId);
      if (index !== -1) {
        state.circles[index].members = members;
      }
      // Update in active circle if matched
      if (state.activeCircle && state.activeCircle.id === circleId) {
        state.activeCircle.members = members;
      }
    },
    setCircleLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCircleError: (state, action) => {
      state.error = action.payload;
    },
    clearCircleState: (state) => {
      state.circles = [];
      state.activeCircle = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Circles
      .addCase(fetchCircles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCircles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.circles = action.payload;
      })
      .addCase(fetchCircles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Create Circle
      .addCase(createCircleThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCircleThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.circles = [action.payload, ...state.circles];
      })
      .addCase(createCircleThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Add Member Thunk
      .addCase(addMemberThunk.fulfilled, (state, action) => {
        const { circleId, userId } = action.payload;
        // Update in list
        const index = state.circles.findIndex(c => c.id === circleId);
        if (index !== -1) {
          if (!state.circles[index].members.includes(userId)) {
            state.circles[index].members.push(userId);
          }
        }
        // Update in active
        if (state.activeCircle && state.activeCircle.id === circleId) {
          if (!state.activeCircle.members.includes(userId)) {
            state.activeCircle.members.push(userId);
          }
        }
      });
  }
});

export const { 
  setCircles, addCircle, setActiveCircle, 
  updateCircleMembers, setCircleLoading, setCircleError, clearCircleState 
} = circleSlice.actions;

export default circleSlice.reducer;
