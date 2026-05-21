/**
 * validators.js
 * Contains regex validation rules for inputs (phone, username, OTP code, name).
 */

/**
 * Validates international phone number formatting (e.g. +12345678900).
 * @param {string} phone - Input string.
 * @returns {boolean}
 */
export function validatePhoneNumber(phone) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates usernames (3 to 15 characters, letters, numbers, and underscores only).
 * @param {string} username - Input string.
 * @returns {boolean}
 */
export function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
  return usernameRegex.test(username);
}

/**
 * Validates verification OTP code (exactly 6 digits).
 * @param {string} otp - Input string.
 * @returns {boolean}
 */
export function validateOTP(otp) {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}

/**
 * Validates display name (at least 2 characters).
 * @param {string} name - Input string.
 * @returns {boolean}
 */
export function validateName(name) {
  return !!name && name.trim().length >= 2;
}
