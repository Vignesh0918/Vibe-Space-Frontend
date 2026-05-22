/**
 * helpers.js
 * Contains generic helper functions for text formatting, ID generation, and style resolvers.
 */

import { COLORS } from '../constants/theme';

/**
 * Truncates string content with an ellipsis if it exceeds the maximum length.
 * @param {string} text - Target string.
 * @param {number} maxLength - Character threshold.
 * @returns {string}
 */
export function truncateText(text, maxLength = 30) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Generates a mock alphanumeric random string key.
 * @returns {string}
 */
export function generateRandomId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Resolves color styling matching the Circle type.
 * @param {string} type - 'friends', 'family', 'work', or 'secret'.
 * @returns {string} Hex color.
 */
export function getCircleBadgeColor(type) {
  if (!type) return COLORS.primary;
  return COLORS.circles[type.toLowerCase()] || COLORS.primary;
}

/**
 * Debounces a function.
 * @param {function} fn - The function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {function} Debounced function.
 */
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Formats byte sizes to human-readable strings (e.g. "2.4 MB").
 * @param {number} bytes - Number of bytes.
 * @returns {string} Formatted size.
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generates an 8-character uppercase alphanumeric invite code.
 * @returns {string}
 */
export function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Resolves online status string.
 * @param {string|Date} lastSeen - Timestamp when user was last online.
 * @param {boolean} isOnline - Whether user is currently active.
 * @returns {string}
 */
export function getOnlineStatus(lastSeen, isOnline) {
  if (isOnline) return 'Online';
  if (!lastSeen) return 'Offline';

  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now - date;

  if (isNaN(diffMs)) return 'Offline';

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

