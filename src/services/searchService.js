/**
 * searchService.js
 * Handles Unified, User, Circle, and Post searches.
 */

import apiClient from '../config/api';

/**
 * Maps items' IDs inside search results.
 */
const mapSearchIds = (results) => {
  if (!results) return results;
  const mapped = { ...results };
  if (mapped.users) {
    mapped.users = mapped.users.map(u => ({ ...u, id: u._id || u.id }));
  }
  if (mapped.circles) {
    mapped.circles = mapped.circles.map(c => ({ ...c, id: c._id || c.id }));
  }
  if (mapped.posts) {
    mapped.posts = mapped.posts.map(p => ({ ...p, id: p._id || p.id }));
  }
  if (mapped.vibes) {
    mapped.vibes = mapped.vibes.map(v => ({ ...v, id: v._id || v.id }));
  }
  return mapped;
};

/**
 * Performs a unified search query.
 * @param {string} query - The search query term.
 * @param {string} type - Search type ('all' | 'users' | 'circles' | 'posts' | 'vibes').
 * @param {number} page - Pagination page number.
 * @param {number} limit - Number of results per page.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function search(query, type = 'all', page = 1, limit = 10) {
  try {
    const response = await apiClient.get('/search', {
      params: { q: query, type, page, limit }
    });
    if (response.data.success && response.data.data) {
      response.data.data = mapSearchIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Searches across all categories.
 */
export function searchAll(query, page = 1, limit = 10) {
  return search(query, 'all', page, limit);
}

/**
 * Searches for users.
 */
export function searchUsers(query, page = 1, limit = 10) {
  return search(query, 'users', page, limit);
}

/**
 * Searches for circles.
 */
export function searchCircles(query, page = 1, limit = 10) {
  return search(query, 'circles', page, limit);
}

/**
 * Searches for posts.
 */
export function searchPosts(query, page = 1, limit = 10) {
  return search(query, 'posts', page, limit);
}
