/**
 * Avatar.js
 * Renders user profile images with support for:
 * - Initials fallback if image is missing (using name hash color)
 * - Online indicator dot (bottom-right)
 * - Mood status emoji (top-right)
 * - Story highlight ring (outer LinearGradient border)
 */

import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

export default function Avatar({
  uri,
  size = 'md',
  name = '',
  showOnline = false,
  mood = '',
  hasStory = false,
  style = {},
}) {
  // Map size keys to actual numerical dimensions
  const dims = {
    sm: SIZES.avatarSm,
    md: SIZES.avatarMd,
    lg: SIZES.avatarLg,
    xl: SIZES.avatarXl,
  };
  const avatarSize = dims[size] || dims.md;
  
  // Font sizes for initials
  const fontSizes = {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 36,
  };
  const fontSize = fontSizes[size] || fontSizes.md;

  // Extracts initials from a user's display name
  const getInitials = (nameStr) => {
    if (!nameStr) return 'VS';
    const clean = nameStr.trim();
    if (!clean) return 'VS';
    const parts = clean.split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generates a deterministic color based on the name hash
  const getColorByName = (nameStr) => {
    if (!nameStr) return COLORS.primary;
    let hash = 0;
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [COLORS.primary, COLORS.secondary, '#10b981', '#3b82f6', '#ec4899', '#f59e0b'];
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const initialsBgColor = getColorByName(name);

  // Render the core profile item (image or text initials)
  const renderAvatarContent = (innerSize) => {
    if (uri) {
      return (
        <Image
          source={{ uri }}
          style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
        />
      );
    }

    return (
      <View style={[
        styles.initialsContainer, 
        { width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: initialsBgColor }
      ]}>
        <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
      </View>
    );
  };

  // If there is an active story, wrap the avatar inside a LinearGradient ring
  const renderBody = () => {
    if (hasStory) {
      const outerBorderWidth = size === 'xl' ? 4 : 3;
      const innerSize = avatarSize - (outerBorderWidth * 2);
      
      return (
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientRing, 
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, padding: outerBorderWidth }
          ]}
        >
          <View style={[
            styles.innerContainer,
            { width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor: COLORS.background }
          ]}>
            {renderAvatarContent(innerSize - 2)}
          </View>
        </LinearGradient>
      );
    }

    return renderAvatarContent(avatarSize);
  };

  // Dimensions of indicator badges based on size
  const indicatorSize = size === 'sm' ? 10 : size === 'md' ? 14 : size === 'lg' ? 18 : 24;
  const moodSize = size === 'sm' ? 16 : size === 'md' ? 22 : size === 'lg' ? 26 : 32;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      {renderBody()}
      
      {/* Mood Emoji Indicator */}
      {mood && (
        <View style={[
          styles.moodBadge, 
          { 
            width: moodSize, 
            height: moodSize, 
            borderRadius: moodSize / 2,
            top: -2,
            right: -2,
          }
        ]}>
          <Text style={{ fontSize: moodSize * 0.6 }}>{mood}</Text>
        </View>
      )}

      {/* Online Status Indicator */}
      {showOnline && (
        <View style={[
          styles.onlineIndicator, 
          { 
            width: indicatorSize, 
            height: indicatorSize, 
            borderRadius: indicatorSize / 2,
            borderColor: COLORS.background,
            borderWidth: size === 'sm' ? 1.5 : 2,
            bottom: 0,
            right: 0,
          }
        ]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#ffffff',
    ...FONTS.bold,
  },
  gradientRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#10b981', // green status dot
  },
  moodBadge: {
    position: 'absolute',
    backgroundColor: '#2d1054',
    borderWidth: 1,
    borderColor: '#4c2885',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
