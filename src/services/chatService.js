/**
 * chatService.js
 * Handles DM and Group chat room creation, real-time message broadcasting via polling,
 * media file uploads (voice/images), disappearing messages,
 * read status indicators, and total unread count aggregation.
 */

import { auth } from './firebase';
import { uploadVoiceMessage, uploadFile, deleteFile } from './storageService';
import apiClient from '../config/api';

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
  let active = true;
  let intervalId = null;
  let previousDataJson = '';

  const check = async () => {
    try {
      const response = await apiClient.get(`/chats/${chatId}/messages`);
      if (response.data.success && active) {
        const messages = (response.data.data || []).map(msg => ({
          ...msg,
          id: msg._id || msg.id
        }));

        const currentDataJson = JSON.stringify(messages);
        if (currentDataJson !== previousDataJson) {
          previousDataJson = currentDataJson;
          callback(messages);
        }
      }
    } catch (err) {
      console.warn('Error polling chat messages:', err);
    }
  };

  check();
  // Poll every 3 seconds for messages for immediate feedback in active chat
  intervalId = setInterval(check, 3000);

  return () => {
    active = false;
    if (intervalId) clearInterval(intervalId);
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
  let active = true;
  let intervalId = null;
  let previousDataJson = '';

  const check = async () => {
    try {
      const res = await getUserChats(userId);
      if (res.success && active) {
        const chats = res.data || [];
        const currentDataJson = JSON.stringify(chats);
        if (currentDataJson !== previousDataJson) {
          previousDataJson = currentDataJson;
          callback(chats);
        }
      }
    } catch (err) {
      console.warn('Error polling user chats:', err);
    }
  };

  check();
  intervalId = setInterval(check, 4000);

  return () => {
    active = false;
    if (intervalId) clearInterval(intervalId);
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
