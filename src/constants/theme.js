/**
 * theme.js
 * Defins the visual styling constants for VibeSpace.
 * Color scheme: primary (#4f6ef7), secondary (#8b5cf6), background (#1a0533).
 */

export const COLORS = {
  primary: '#4f6ef7',     // Electric Blue
  secondary: '#8b5cf6',   // Purple/Violet
  background: '#1a0533',  // Dark Deep Purple
  card: '#2d1054',        // Deep Plum/Purple
  input: '#3d1a6e',       // Light Plum/Purple
  text: '#ffffff',        // White
  textMuted: '#a78bfa',   // Lavender Muted Text
  success: '#10b981',     // Emerald Green
  danger: '#ef4444',      // Rose Red
  warning: '#f59e0b',     // Amber Yellow
  border: '#4c2885',      // Deep Purple Border
  overlay: 'rgba(26, 5, 51, 0.75)', // Translucent Dark Overlay
  online: '#10b981',      // Online green
  offline: '#6b7280',     // Offline gray
  gold: '#eab308',        // Star gold
  neon: '#a78bfa',        // Purple neon glow

  // Circle-specific colors
  circles: {
    friends: '#10b981',   // Emerald
    family: '#3b82f6',    // Blue
    work: '#f59e0b',      // Amber
    secret: '#ec4899',    // Pink
  },

  // Chat bubble colors
  chat: {
    senderBubble: '#4f6ef7',
    receiverBubble: '#2d1054',
    senderText: '#ffffff',
    receiverText: '#ffffff',
  }
};

export const SIZES = {
  // Font sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  huge: 32,

  // Spacing
  spacingXs: 4,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 24,
  spacingXl: 32,

  // Border Radii
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusFull: 999,

  // Component heights
  buttonHeight: 52,
  inputHeight: 52,

  // Avatar sizes
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 96,

  // Icon sizes
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,

  // Story sizes
  storySize: 64
};

export const FONTS = {
  regular: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  }
};

export const SHADOWS = {
  small: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  }
};
