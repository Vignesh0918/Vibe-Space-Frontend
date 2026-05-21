/**
 * chatSlice.js
 * Redux Toolkit slice managing chat rooms list, current active messages,
 * active chat selection, unread totals, and message broadcasting thunks.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as chatService from '../../services/chatService';

// Async thunk to fetch chats and aggregate unread total count
export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (userId, { rejectWithValue }) => {
    const chatsRes = await chatService.getUserChats(userId);
    if (!chatsRes.success) {
      return rejectWithValue(chatsRes.error);
    }
    const unreadRes = await chatService.getUnreadCount(userId);
    const unreadCount = unreadRes.success ? unreadRes.data : 0;
    return { chats: chatsRes.data, unreadCount };
  }
);

// Async thunk to send a message
export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessageThunk',
  async ({ chatId, senderId, text, mediaUrl, mediaType }, { rejectWithValue }) => {
    const result = await chatService.sendMessage(chatId, senderId, text, mediaUrl, mediaType);
    if (!result.success) {
      return rejectWithValue(result.error);
    }
    return result.data;
  }
);

const initialState = {
  chatRooms: [], // List of active chats the user is part of
  activeChat: null, // Selected chat room object
  activeMessages: [], // Messages in the open chat room
  unreadTotal: 0, // Total unread messages badge count
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatRooms: (state, action) => {
      state.chatRooms = action.payload;
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    setUnreadTotal: (state, action) => {
      state.unreadTotal = action.payload;
    },
    updateChatRoomLastMessage: (state, action) => {
      const { chatId, lastMessage } = action.payload;
      const index = state.chatRooms.findIndex(room => room.id === chatId);
      if (index !== -1) {
        state.chatRooms[index].lastMessage = lastMessage;
        // Re-sort list by lastMessage date descending
        state.chatRooms.sort((a, b) => {
          const dateA = a.lastMessage?.createdAt || '';
          const dateB = b.lastMessage?.createdAt || '';
          return dateB.localeCompare(dateA);
        });
      }
    },
    setActiveMessages: (state, action) => {
      state.activeMessages = action.payload;
    },
    addMessageToActive: (state, action) => {
      state.activeMessages = [...state.activeMessages, action.payload];
    },
    setChatLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setChatError: (state, action) => {
      state.error = action.payload;
    },
    clearChatState: (state) => {
      state.chatRooms = [];
      state.activeChat = null;
      state.activeMessages = [];
      state.unreadTotal = 0;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chats
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chatRooms = action.payload.chats;
        state.unreadTotal = action.payload.unreadCount;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      // Send Message Thunk
      .addCase(sendMessageThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        // Append message to list if active room matches
        state.activeMessages = [...state.activeMessages, action.payload];
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  }
});

export const { 
  setChatRooms, setActiveChat, setUnreadTotal, updateChatRoomLastMessage, 
  setActiveMessages, addMessageToActive, setChatLoading, setChatError, clearChatState
} = chatSlice.actions;

export default chatSlice.reducer;
