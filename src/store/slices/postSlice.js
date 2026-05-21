/**
 * postSlice.js
 * Redux Toolkit slice managing post feeds, timelines, pagination limits,
 * and dispatching Firestore updates.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as postService from '../../services/postService';

// Async thunk to fetch home feed
export const fetchHomeFeed = createAsyncThunk(
  'post/fetchHomeFeed',
  async (circleIds, { rejectWithValue }) => {
    const result = await postService.getHomeFeed(circleIds, null, 10);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data; // { posts, lastDoc }
  }
);

// Async thunk to fetch more posts (pagination)
export const fetchMorePosts = createAsyncThunk(
  'post/fetchMorePosts',
  async (circleIds, { getState, rejectWithValue }) => {
    const { post } = getState();
    const { lastDoc, hasMore } = post;
    
    if (!hasMore || !lastDoc) {
      return { posts: [], lastDoc: lastDoc };
    }

    const result = await postService.getHomeFeed(circleIds, lastDoc, 10);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data; // { posts, lastDoc }
  }
);

// Async thunk to create a post
export const createPostThunk = createAsyncThunk(
  'post/createPostThunk',
  async (postData, { rejectWithValue }) => {
    const result = await postService.createPost(postData);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data;
  }
);

// Async thunk to toggle a reaction
export const toggleReactionThunk = createAsyncThunk(
  'post/toggleReactionThunk',
  async ({ postId, emoji, userId, userName, userAvatar }, { rejectWithValue }) => {
    const result = await postService.toggleReaction(postId, emoji, userId, userName, userAvatar);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return { postId, emoji, userId };
  }
);

const initialState = {
  feedPosts: [], // Posts currently loaded for the active feed
  userPosts: [], // Posts by the current user
  lastDoc: null, // Document snapshot of last visible item
  hasMore: true, // Pagination boundary flag
  isLoading: false,
  error: null,
};

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    setFeedPosts: (state, action) => {
      state.feedPosts = action.payload;
    },
    appendFeedPosts: (state, action) => {
      state.feedPosts = [...state.feedPosts, ...action.payload];
    },
    setUserPosts: (state, action) => {
      state.userPosts = action.payload;
    },
    addPostToFeed: (state, action) => {
      state.feedPosts = [action.payload, ...state.feedPosts];
    },
    updatePostInFeed: (state, action) => {
      const index = state.feedPosts.findIndex(post => post.id === action.payload.id);
      if (index !== -1) {
        state.feedPosts[index] = { ...state.feedPosts[index], ...action.payload };
      }
    },
    setPostLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setPostError: (state, action) => {
      state.error = action.payload;
    },
    clearPostState: (state) => {
      state.feedPosts = [];
      state.userPosts = [];
      state.lastDoc = null;
      state.hasMore = true;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Home Feed
      .addCase(fetchHomeFeed.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHomeFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feedPosts = action.payload.posts;
        state.lastDoc = action.payload.lastDoc;
        state.hasMore = action.payload.posts.length === 10;
      })
      .addCase(fetchHomeFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Fetch More Posts
      .addCase(fetchMorePosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMorePosts.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.posts.length > 0) {
          state.feedPosts = [...state.feedPosts, ...action.payload.posts];
          state.lastDoc = action.payload.lastDoc;
          state.hasMore = action.payload.posts.length === 10;
        } else {
          state.hasMore = false;
        }
      })
      .addCase(fetchMorePosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Create Post
      .addCase(createPostThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPostThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feedPosts = [action.payload, ...state.feedPosts];
        state.userPosts = [action.payload, ...state.userPosts];
      })
      .addCase(createPostThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Toggle Reaction
      .addCase(toggleReactionThunk.fulfilled, (state, action) => {
        const { postId, emoji, userId } = action.payload;
        const updateReactions = (posts) => {
          const post = posts.find(p => p.id === postId);
          if (post) {
            if (!post.reactions) post.reactions = {};
            if (!post.reactions[emoji]) post.reactions[emoji] = [];
            const index = post.reactions[emoji].indexOf(userId);
            if (index > -1) {
              post.reactions[emoji] = post.reactions[emoji].filter(id => id !== userId);
            } else {
              post.reactions[emoji] = [...post.reactions[emoji], userId];
            }
          }
        };
        updateReactions(state.feedPosts);
        updateReactions(state.userPosts);
      });
  }
});

export const { 
  setFeedPosts, appendFeedPosts, setUserPosts, 
  addPostToFeed, updatePostInFeed, setPostLoading, 
  setPostError, clearPostState 
} = postSlice.actions;

export default postSlice.reducer;
