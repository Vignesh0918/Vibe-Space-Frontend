/**
 * chatService.js
 * Handles DM and Group chat room creation, real-time message broadcasting via polling,
 * media file uploads (voice/images), disappearing messages,
 * read status indicators, and total unread count aggregation.
 */

import { auth } from './firebase';
import { uploadVoiceMessage, uploadFile, deleteFile } from './storageService';
import apiClient, { API_URL } from '../config/api';

// --- WebSocket Client Integration ---
let ws = null;
let isWsAuthenticated = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_BASE = 2000;

const messageListeners = new Map(); // chatId -> Set of callbacks
const userChatsListeners = new Set(); // Set of callbacks

const activeMessagesCache = new Map(); // chatId -> Array of messages
let userChatsCache = [];
let currentUserIdForChats = null;

function getWebSocketUrl() {
  const base = API_URL;
  return base.replace(/^http/, 'ws');
}

function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  const url = getWebSocketUrl();
  console.log('[WS Client] Connecting to:', url);

  try {
    ws = new WebSocket(url);
  } catch (err) {
    console.warn('[WS Client] WebSocket construction failed:', err);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[WS Client] WebSocket connected. Authenticating...');
    reconnectAttempts = 0;
    sendWsAuth();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWSMessage(data);
    } catch (err) {
      console.warn('[WS Client] Failed parsing socket message:', err);
    }
  };

  ws.onclose = (event) => {
    console.log(`[WS Client] Connection closed: code=${event.code}, reason=${event.reason}`);
    isWsAuthenticated = false;
    scheduleReconnect();
  };

  ws.onerror = (err) => {
    console.warn('[WS Client] WebSocket error:', err.message || err);
  };
}

async function sendWsAuth() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    let token;
    try {
      token = await currentUser.getIdToken();
    } catch {
      token = currentUser.uid;
    }

    ws.send(JSON.stringify({
      type: 'auth',
      token
    }));
  } catch (error) {
    console.warn('[WS Client] Token retrieval failed:', error);
  }
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn('[WS Client] Maximum reconnect attempts reached.');
    return;
  }

  if (reconnectTimer) clearTimeout(reconnectTimer);

  const delay = Math.min(30000, RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts));
  reconnectAttempts++;

  reconnectTimer = setTimeout(() => {
    connectWebSocket();
  }, delay);
}

function sendJoinRoom(chatId) {
  if (ws && ws.readyState === WebSocket.OPEN && isWsAuthenticated) {
    ws.send(JSON.stringify({
      type: 'join',
      chatId
    }));
  }
}

function sendLeaveRoom(chatId) {
  if (ws && ws.readyState === WebSocket.OPEN && isWsAuthenticated) {
    ws.send(JSON.stringify({
      type: 'leave',
      chatId
    }));
  }
}

function handleWSMessage(data) {
  switch (data.type) {
    case 'authenticated':
      if (data.success) {
        console.log('[WS Client] WebSocket authenticated.');
        isWsAuthenticated = true;
        // Join room if already listening
        if (messageListeners.size > 0) {
          Array.from(messageListeners.keys()).forEach(sendJoinRoom);
        }
      } else {
        console.warn('[WS Client] WebSocket authentication rejected:', data.error);
        isWsAuthenticated = false;
      }
      break;

    case 'new_message': {
      const { chatId, message } = data;
      const mappedMsg = {
        ...message,
        id: message._id || message.id
      };

      if (activeMessagesCache.has(chatId)) {
        const list = activeMessagesCache.get(chatId);
        if (!list.some(m => m.id === mappedMsg.id)) {
          const updated = [...list, mappedMsg];
          activeMessagesCache.set(chatId, updated);
          triggerMessageCallbacks(chatId, updated);
        }
      }
      triggerUserChatsUpdate();
      break;
    }

    case 'edit_message': {
      const { chatId, message } = data;
      const mappedMsg = {
        ...message,
        id: message._id || message.id
      };
      if (activeMessagesCache.has(chatId)) {
        const list = activeMessagesCache.get(chatId);
        const updated = list.map(m => m.id === mappedMsg.id ? mappedMsg : m);
        activeMessagesCache.set(chatId, updated);
        triggerMessageCallbacks(chatId, updated);
      }
      break;
    }

    case 'delete_message': {
      const { chatId, messageId } = data;
      if (activeMessagesCache.has(chatId)) {
        const list = activeMessagesCache.get(chatId);
        const updated = list.filter(m => m.id !== messageId && m._id !== messageId);
        activeMessagesCache.set(chatId, updated);
        triggerMessageCallbacks(chatId, updated);
      }
      break;
    }

    case 'react_message': {
      const { chatId, messageId, reactions } = data;
      if (activeMessagesCache.has(chatId)) {
        const list = activeMessagesCache.get(chatId);
        const updated = list.map(m => {
          if (m.id === messageId || m._id === messageId) {
            return { ...m, reactions };
          }
          return m;
        });
        activeMessagesCache.set(chatId, updated);
        triggerMessageCallbacks(chatId, updated);
      }
      break;
    }

    default:
      break;
  }
}

function triggerMessageCallbacks(chatId, messages) {
  const callbacks = messageListeners.get(chatId);
  if (callbacks) {
    callbacks.forEach(cb => cb(messages));
  }
}

async function triggerUserChatsUpdate() {
  if (userChatsListeners.size === 0) return;
  if (!currentUserIdForChats) return;

  try {
    const res = await getUserChats(currentUserIdForChats);
    if (res.success) {
      userChatsCache = res.data || [];
      userChatsListeners.forEach(cb => cb(userChatsCache));
    }
  } catch (err) {
    console.warn('[WS Client] Failed to refresh user chats list:', err);
  }
}

// Track user authentication lifecycle to open/close socket
auth.onAuthStateChanged((user) => {
  if (user) {
    connectWebSocket();
  } else {
    if (ws) {
      ws.close(1000, 'User logged out');
      ws = null;
    }
    isWsAuthenticated = false;
  }
});

/**
 * Maps MongoDB chat/message documents to frontend models.
 */
const mapChatIds = (chat) => {
  if (!chat) return chat;
  return {
    ...chat,
    id: chat._id || chat.id,
  };
};

/**
 * Gets an existing DM room or creates a new one.
 * @param {string} userId1 - Sender or Receiver ID.
 * @param {string} userId2 - Sender or Receiver ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getOrCreateDMChat(userId1, userId2) {
  try {
    const currentUid = auth.currentUser?.uid;
    const recipientId = userId1 === currentUid ? userId2 : userId1;

    const response = await apiClient.post('/chats/dm', { recipientId });
    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Creates a new Group Chat.
 * @param {string} name - Name of the group chat.
 * @param {string} creatorId - Creator user ID.
 * @param {string[]} participantIds - Array of other participant user IDs.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createGroupChat(name, creatorId, participantIds) {
  try {
    const response = await apiClient.post('/chats/group', { name, participantIds });
    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Sends a message in a chat room.
 * Uploads inline media assets first, computes expiresAt if chat has expiry,
 * and increments unread count for recipients.
 * @param {string} chatId - Target chat ID.
 * @param {string} senderId - ID of the sender.
 * @param {string} text - Text message content.
 * @param {string} mediaUrl - Optional local file URI to upload.
 * @param {string} mediaType - Optional media type ('image' or 'voice').
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendMessage(chatId, senderId, text, mediaUrl = '', mediaType = '') {
  try {
    let finalMediaUrl = mediaUrl;
    
    // Upload media asset inline if provided
    if (finalMediaUrl && (finalMediaUrl.startsWith('file://') || finalMediaUrl.startsWith('content://'))) {
      if (mediaType === 'voice') {
        const uploadRes = await uploadVoiceMessage(finalMediaUrl, senderId);
        if (uploadRes.success) {
          finalMediaUrl = uploadRes.data;
        } else {
          return { success: false, error: `Failed to upload voice message: ${uploadRes.error}` };
        }
      } else if (mediaType === 'image') {
        const uploadRes = await uploadFile(finalMediaUrl, `chats/${chatId}`, 10 * 1024 * 1024);
        if (uploadRes.success) {
          finalMediaUrl = uploadRes.data;
        } else {
          return { success: false, error: `Failed to upload image: ${uploadRes.error}` };
        }
      }
    }

    const response = await apiClient.post(`/chats/${chatId}/messages`, {
      text,
      mediaUrl: finalMediaUrl,
      mediaType,
    });

    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Subscribes to real-time message changes in a chat room by polling the Express server.
 * Filters out expired messages dynamically based on client clock.
 * @param {string} chatId - Target chat ID.
 * @param {function} callback - Callback triggered with list of messages.
 * @returns {function} Unsubscribe function.
 */
export function listenToMessages(chatId, callback) {
  // Ensure WebSocket is connected
  connectWebSocket();

  let active = true;
  let fallbackInterval = null;

  const fetchHttp = async () => {
    try {
      const response = await apiClient.get(`/chats/${chatId}/messages`);
      if (response.data.success && active) {
        const messages = (response.data.data || []).map(msg => ({
          ...msg,
          id: msg._id || msg.id
        }));
        activeMessagesCache.set(chatId, messages);
        callback(messages);
      }
    } catch (err) {
      console.warn('Error fetching messages (fallback):', err);
    }
  };

  // Perform initial fetch
  fetchHttp();

  // Register listener callback
  if (!messageListeners.has(chatId)) {
    messageListeners.set(chatId, new Set());
  }
  messageListeners.get(chatId).add(callback);

  // Send WebSocket join room request
  sendJoinRoom(chatId);

  // Set up safe HTTP polling fallback if WebSocket disconnects
  fallbackInterval = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !isWsAuthenticated) {
      console.log('[WS Client] WS not active. Executing fallback HTTP poll...');
      fetchHttp();
    }
  }, 5000);

  return () => {
    active = false;
    if (fallbackInterval) clearInterval(fallbackInterval);

    const callbacks = messageListeners.get(chatId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        messageListeners.delete(chatId);
        activeMessagesCache.delete(chatId);
        sendLeaveRoom(chatId);
      }
    }
  };
}

/**
 * Retrieves all chat rooms that a user participates in.
 * @param {string} userId - User ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getUserChats(userId) {
  try {
    const response = await apiClient.get(`/chats/user/${userId}`);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(mapChatIds);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Subscribes to real-time changes of the user's active chats.
 * @param {string} userId - User ID.
 * @param {function} callback - Callback triggered with updated list of chats.
 * @returns {function} Unsubscribe function.
 */
export function listenToUserChats(userId, callback) {
  currentUserIdForChats = userId;
  connectWebSocket();

  let active = true;
  let fallbackInterval = null;

  const fetchHttp = async () => {
    try {
      const res = await getUserChats(userId);
      if (res.success && active) {
        userChatsCache = res.data || [];
        callback(userChatsCache);
      }
    } catch (err) {
      console.warn('Error fetching user chats (fallback):', err);
    }
  };

  fetchHttp();

  userChatsListeners.add(callback);

  // Set up safe HTTP polling fallback if WebSocket disconnects
  fallbackInterval = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !isWsAuthenticated) {
      fetchHttp();
    }
  }, 6000);

  return () => {
    active = false;
    if (fallbackInterval) clearInterval(fallbackInterval);
    userChatsListeners.delete(callback);
  };
}

/**
 * Marks messages in a chat as read by resetting the user's unread counter and appending to readBy list.
 * @param {string} chatId - Target chat ID.
 * @param {string} userId - ID of the user reading the messages.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markMessagesRead(chatId, userId) {
  try {
    const response = await apiClient.post(`/chats/${chatId}/read`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Sets the default message expiry hours for a chat room.
 * @param {string} chatId - Target chat ID.
 * @param {number} hours - Expiry in hours.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setChatExpiry(chatId, hours) {
  try {
    const response = await apiClient.post(`/chats/${chatId}/expiry`, { hours });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Deletes a single message and deletes its media attachment if it exists.
 * @param {string} chatId - Chat room ID.
 * @param {string} messageId - Message document ID.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteMessage(chatId, messageId) {
  try {
    // Find the message details locally/via API to delete the media asset
    const responseMsgs = await apiClient.get(`/chats/${chatId}/messages`);
    if (responseMsgs.data.success && responseMsgs.data.data) {
      const targetMsg = responseMsgs.data.data.find(m => (m._id || m.id) === messageId);
      if (targetMsg && targetMsg.mediaUrl) {
        await deleteFile(targetMsg.mediaUrl).catch(err => console.warn("Failed to delete message media:", err));
      }
    }

    const response = await apiClient.delete(`/chats/${chatId}/messages/${messageId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Aggregates and returns the user's total unread message count across all chats.
 * @param {string} userId - User ID.
 * @returns {Promise<{success: boolean, data?: number, error?: string}>}
 */
export async function getUnreadCount(userId) {
  try {
    const response = await apiClient.get('/chats/unread/count');
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets details of a single chat room.
 * @param {string} chatId - Target chat ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getChatDetails(chatId) {
  try {
    const response = await apiClient.get(`/chats/${chatId}`);
    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Updates a group chat name and/or avatar.
 * Handles local file upload for the avatar if needed.
 * @param {string} chatId - Target chat ID.
 * @param {string} name - Group name.
 * @param {string} groupAvatar - Local URI or web URL of the avatar image.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function updateGroupChat(chatId, name, groupAvatar = '') {
  try {
    let finalAvatarUrl = groupAvatar;
    if (finalAvatarUrl && (finalAvatarUrl.startsWith('file://') || finalAvatarUrl.startsWith('content://'))) {
      const uploadRes = await uploadFile(finalAvatarUrl, `chats/${chatId}/avatar`);
      if (uploadRes.success) {
        finalAvatarUrl = uploadRes.data;
      } else {
        return { success: false, error: `Failed to upload avatar: ${uploadRes.error}` };
      }
    }
    const response = await apiClient.put(`/chats/${chatId}`, { name, groupAvatar: finalAvatarUrl });
    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Leaves or deletes a chat room.
 * @param {string} chatId - Target chat ID.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function leaveOrDeleteChat(chatId) {
  try {
    const response = await apiClient.delete(`/chats/${chatId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Adds a user to a group chat room.
 * @param {string} chatId - Target chat ID.
 * @param {string} userId - User ID to add.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function addMemberToGroupChat(chatId, userId) {
  try {
    const response = await apiClient.post(`/chats/${chatId}/members`, { userId });
    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Removes a user from a group chat room.
 * @param {string} chatId - Target chat ID.
 * @param {string} userId - User ID to remove.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function removeMemberFromGroupChat(chatId, userId) {
  try {
    const response = await apiClient.delete(`/chats/${chatId}/members/${userId}`);
    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Edits a message text.
 * Only possible within 15 minutes of creation (checked on backend).
 * @param {string} chatId - Chat room ID.
 * @param {string} messageId - Message ID.
 * @param {string} text - New message text.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function editMessage(chatId, messageId, text) {
  try {
    const response = await apiClient.put(`/chats/${chatId}/messages/${messageId}`, { text });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches all messages containing media attachments for a chat room.
 * @param {string} chatId - Target chat ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getChatMedia(chatId) {
  try {
    const response = await apiClient.get(`/chats/${chatId}/media`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Pins a message in a chat room.
 * @param {string} chatId - Target chat ID.
 * @param {string} messageId - Message ID to pin.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function pinMessage(chatId, messageId) {
  try {
    const response = await apiClient.post(`/chats/${chatId}/pin/${messageId}`);
    if (response.data.success && response.data.data) {
      response.data.data = mapChatIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Toggles a user's emoji reaction on a message.
 * @param {string} chatId - Chat room ID.
 * @param {string} messageId - Message ID.
 * @param {string} emoji - Reaction emoji.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function reactToMessage(chatId, messageId, emoji) {
  try {
    const response = await apiClient.post(`/chats/${chatId}/messages/${messageId}/react`, { emoji });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

