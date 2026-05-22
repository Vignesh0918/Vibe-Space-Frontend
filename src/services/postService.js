/**
 * postService.js
 * Manages post uploads, querying feeds for circles, adding emojis,
 * comment threads, and deleting posts with respective cloud assets.
 */

import { uploadPostImage, deleteFile } from './storageService';
import apiClient from '../config/api';

/**
 * Maps MongoDB MongoDB documents (_id) to standard ID to maintain compatibility with front-end components.
 */
const mapPostIds = (post) => {
  if (!post) return post;
  return {
    ...post,
    id: post._id || post.id,
  };
};

/**
 * Creates a new post in MongoDB via Express API.
 * Uploads local image URI first if it exists, and increments user and circle post counts.
 * @param {object} postData - Post metadata (caption, imageURL, circleId, userId, userName, userAvatar).
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createPost(postData) {
  try {
    const { userId, imageURL } = postData;
    let finalImageURL = imageURL || '';
    
    // Upload image if it is a local path
    if (finalImageURL && (finalImageURL.startsWith('file://') || finalImageURL.startsWith('content://'))) {
      const uploadRes = await uploadPostImage(finalImageURL, userId);
      if (uploadRes.success) {
        finalImageURL = uploadRes.data;
      } else {
        return { success: false, error: `Failed to upload post image: ${uploadRes.error}` };
      }
    }

    const response = await apiClient.post('/posts', {
      ...postData,
      imageURL: finalImageURL,
    });

    if (response.data.success && response.data.data) {
      response.data.data = mapPostIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Retrieves paginated feed posts for all circles a user belongs to.
 * @param {string[]} circleIds - Array of circle IDs.
 * @param {object} lastDoc - MongoDB ID string of last post to start after.
 * @param {number} limitCount - Count of posts per page.
 * @returns {Promise<{success: boolean, data?: {posts: array, lastDoc: any}, error?: string}>}
 */
export async function getHomeFeed(circleIds, lastDoc = null, limitCount = 10) {
  try {
    if (!circleIds || circleIds.length === 0) {
      return { success: true, data: { posts: [], lastDoc: null } };
    }

    const response = await apiClient.get('/posts/feed', {
      params: {
        circleIds: circleIds.join(','),
        lastId: lastDoc,
        limit: limitCount
      }
    });

    if (response.data.success && response.data.data) {
      const { posts, lastDoc: nextLastDoc } = response.data.data;
      return {
        success: true,
        data: {
          posts: posts.map(mapPostIds),
          lastDoc: nextLastDoc
        }
      };
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Retrieves paginated posts from a specific circle.
 * @param {string} circleId - ID of the circle.
 * @param {object} lastDoc - MongoDB ID string of last post to start after.
 * @param {number} limitCount - Count of posts per page.
 * @returns {Promise<{success: boolean, data?: {posts: array, lastDoc: any}, error?: string}>}
 */
export async function getCirclePosts(circleId, lastDoc = null, limitCount = 10) {
  try {
    const response = await apiClient.get(`/posts/circle/${circleId}`, {
      params: {
        lastId: lastDoc,
        limit: limitCount
      }
    });

    if (response.data.success && response.data.data) {
      const { posts, lastDoc: nextLastDoc } = response.data.data;
      return {
        success: true,
        data: {
          posts: posts.map(mapPostIds),
          lastDoc: nextLastDoc
        }
      };
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets all posts created by a specific user.
 * @param {string} userId - User ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getUserPosts(userId) {
  try {
    const response = await apiClient.get(`/posts/user/${userId}`);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(mapPostIds);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Toggles a user's reaction emoji on a post.
 * Sends a notification if a reaction is added.
 * @param {string} postId - Target post ID.
 * @param {string} emoji - Reaction emoji symbol (e.g. '❤️').
 * @param {string} userId - Reacting user's ID.
 * @param {string} userName - Reacting user's display name.
 * @param {string} userAvatar - Reacting user's avatar.
 * @returns {Promise<{success: boolean, action?: string, error?: string}>}
 */
export async function toggleReaction(postId, emoji, userId, userName, userAvatar) {
  try {
    const response = await apiClient.post(`/posts/${postId}/react`, {
      emoji,
      userName,
      userAvatar
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Adds a comment to a post, increments comment count, and triggers an activity notification.
 * @param {string} postId - Post ID.
 * @param {string} userId - Commmenter's user ID.
 * @param {string} userName - Commenter's name.
 * @param {string} userAvatar - Commenter's profile photo.
 * @param {string} text - Comment text content.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function addComment(postId, userId, userName, userAvatar, text) {
  try {
    const response = await apiClient.post(`/posts/${postId}/comment`, {
      userName,
      userAvatar,
      text
    });

    if (response.data.success && response.data.data) {
      response.data.data = {
        ...response.data.data,
        id: response.data.data._id || response.data.data.id
      };
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Retrieves comments for a post in chronological order.
 * @param {string} postId - Target post ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getComments(postId) {
  try {
    const response = await apiClient.get(`/posts/${postId}/comments`);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(comment => ({
        ...comment,
        id: comment._id || comment.id
      }));
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Deletes a post from MongoDB via Express, deletes comments, deletes cloud media assets.
 * @param {string} postId - Post ID to delete.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePost(postId) {
  try {
    const postRes = await apiClient.get(`/posts/${postId}`);
    if (postRes.data.success && postRes.data.data) {
      const post = postRes.data.data;
      if (post.imageURL) {
        await deleteFile(post.imageURL).catch(err => console.warn("Failed to delete post image file: ", err));
      }
    }
    
    const response = await apiClient.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Gets a single post by ID.
 * @param {string} postId - Post ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getPostDetails(postId) {
  try {
    const response = await apiClient.get(`/posts/${postId}`);
    if (response.data.success && response.data.data) {
      response.data.data = mapPostIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Toggles bookmark status for a post.
 * @param {string} postId - Target post ID.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function bookmarkPost(postId) {
  try {
    const response = await apiClient.post(`/posts/${postId}/bookmark`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Retrieves bookmarked posts for a user.
 * @param {string} userId - User ID.
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getBookmarkedPosts(userId) {
  try {
    const response = await apiClient.get(`/posts/bookmarked/${userId}`);
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(mapPostIds);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Retrieves trending posts (top reacted posts).
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getTrendingPosts() {
  try {
    const response = await apiClient.get('/posts/trending');
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map(mapPostIds);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

/**
 * Edits the caption of a post.
 * @param {string} postId - Target post ID.
 * @param {string} caption - New caption text.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function editPost(postId, caption) {
  try {
    const response = await apiClient.put(`/posts/${postId}`, { caption });
    if (response.data.success && response.data.data) {
      response.data.data = mapPostIds(response.data.data);
    }
    return response.data;
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

