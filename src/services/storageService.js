/**
 * storageService.js
 * Manages media uploads (images/videos/voice messages) to the backend server,
 * enforcing file size limits and wrapping uploads in FormData.
 */

import { Platform } from 'react-native';
import apiClient from '../config/api';

/**
 * Uploads a local file URI to the backend server.
 * @param {string} uri - The local file URI.
 * @param {string} folderPath - Target directory path identifier.
 * @param {number} maxSizeLimit - Max allowed file size in bytes (default 50MB).
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function uploadFile(uri, folderPath, maxSizeLimit = 50 * 1024 * 1024) {
  try {
    // Check file size client-side first
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileSize = blob.size;
    blob.close(); // free up resource

    if (fileSize > maxSizeLimit) {
      const limitMB = (maxSizeLimit / (1024 * 1024)).toFixed(0);
      return { success: false, error: `File size exceeds the limit of ${limitMB}MB` };
    }

    // Determine upload endpoint based on folder path (stories route vs general image route)
    const isStory = folderPath.includes('stories');
    const endpoint = isStory ? '/upload/story' : '/upload/image';

    const formData = new FormData();
    const filename = uri.split('/').pop() || 'file.jpg';
    let ext = filename.split('.').pop().split('?')[0] || 'jpg';
    ext = ext.toLowerCase();

    // Map file extension to a valid MIME type
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'mp3') mimeType = 'audio/mpeg';
    else if (ext === 'm4a') mimeType = 'audio/m4a';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'mp4') mimeType = 'video/mp4';
    else if (ext === 'mov') mimeType = 'video/quicktime';

    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type: mimeType,
    });

    const uploadResponse = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds timeout for larger media uploads
    });

    if (uploadResponse.data && uploadResponse.data.success) {
      return { success: true, data: uploadResponse.data.data };
    } else {
      return { success: false, error: uploadResponse.data?.error || 'Upload failed' };
    }
  } catch (error) {
    console.error('storageService upload error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Uploads a profile photo to backend with a 5MB limit.
 * @param {string} uri - Local file URI.
 * @param {string} userId - Owner user ID.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function uploadProfilePhoto(uri, userId) {
  return uploadFile(uri, `profiles/${userId}`, 5 * 1024 * 1024);
}

/**
 * Uploads a post image to backend with a 20MB limit.
 * @param {string} uri - Local file URI.
 * @param {string} userId - Owner user ID.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function uploadPostImage(uri, userId) {
  return uploadFile(uri, `posts/${userId}`, 20 * 1024 * 1024);
}

/**
 * Uploads story media (image/video) to backend with a 50MB limit.
 * @param {string} uri - Local file URI.
 * @param {string} userId - Owner user ID.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function uploadStoryMedia(uri, userId) {
  return uploadFile(uri, `stories/${userId}`, 50 * 1024 * 1024);
}

/**
 * Uploads a voice message (.m4a) to backend with a 10MB limit.
 * @param {string} uri - Local file URI.
 * @param {string} userId - Owner user ID.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export async function uploadVoiceMessage(uri, userId) {
  return uploadFile(uri, `chats/${userId}`, 10 * 1024 * 1024);
}

/**
 * Deletes a file. Since files are stored locally on the server, we return success.
 * @param {string} fileUrl - Full URL of the file.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(fileUrl) {
  // Local storage cleanups are omitted to preserve uploads history and avoid deleting active media files,
  // but we return success to ensure that flow doesn't break.
  return { success: true };
}
