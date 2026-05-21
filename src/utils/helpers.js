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
