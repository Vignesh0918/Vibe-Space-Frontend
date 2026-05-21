/**
 * notificationService.js
 * Manages user activity alerts (comments, reactions, messages) using MongoDB via Express,
 * loading notifications history, real-time alerting, and read badge states.
 */

import apiClient from '../config/api';

/**
 * Creates an activity alert notification for a recipient user.
 * @param {object} notificationData - Metadata (userId, type, senderId, senderName, senderAvatar, postId, postImage, text).
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function createNotification(notificationData) {
  try {
    const { userId } = notificationData;
    if (!userId) return { success: false, error: 'Recipient userId is required' };

    const response = await apiClient.post('/notifications', notificationData);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Fetches all notifications for a user, ordered by creation time (newest first).
 * @param {string} userId - User ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getUserNotifications(userId) {
  try {
    const response = await apiClient.get(`/notifications/user/${userId}`);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(notif => ({
        ...notif,
        id: notif._id || notif.id
      }));
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Marks a specific notification as read.
 * @param {string} userId - Recipient user ID (unused in Mongoose router but kept for signature compatibility).
 * @param {string} notificationId - Notification ID.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markNotificationRead(userId, notificationId) {
  try {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Marks all notifications for a user as read.
 * @param {string} userId - Recipient user ID.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markAllNotificationsRead(userId) {
  try {
    const response = await apiClient.post(`/notifications/user/${userId}/read-all`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Subscribes to real-time changes in a user's notifications.
 * @param {string} userId - User ID.
 * @param {function} callback - Callback function triggered on updates.
 * @returns {function} Unsubscribe listener function.
 */
export function listenToNotifications(userId, callback) {
  let active = true;
  let intervalId = null;
  let previousDataJson = '';

  const check = async () => {
    try {
      const res = await getUserNotifications(userId);
      if (res.success && active) {
        const currentDataJson = JSON.stringify(res.data);
        if (currentDataJson !== previousDataJson) {
          previousDataJson = currentDataJson;
          callback(res.data);
        }
      }
    } catch (err) {
      console.warn('Error polling notifications:', err);
    }
  };

  check();
  intervalId = setInterval(check, 5000);

  return () => {
    active = false;
    if (intervalId) clearInterval(intervalId);
  };
}

/**
 * Fetches the user's unread notification count.
 * @param {string} userId - User ID.
 * @returns {Promise<{success: boolean, data?: number, error?: string}>}
 */
export async function getUnreadNotificationCount(userId) {
  try {
    const res = await getUserNotifications(userId);
    if (res.success && res.data) {
      const unreadCount = res.data.filter(n => !n.read).length;
      return { success: true, data: unreadCount };
    }
    return { success: false, error: res.error || 'Failed to fetch unread count' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
