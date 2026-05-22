import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';

/**
 * StoryCircle Component
 * Displays a single story bubble:
 * - Differentiates own add-story button vs regular active stories.
 * - Displays glowing radial gradients.
 * - Renders names nicely beneath.
 */
export default function StoryCircle({ item, onPress, isUploading }) {
  const { name, avatar, isUser, borderColors = ['#8b5cf6', '#ec4899'] } = item;

  if (isUser) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.storyWrapper}
        onPress={onPress}
        disabled={isUploading}
      >
        <View style={styles.userStoryOuter}>
          <View style={styles.userStoryInner}>
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.primary || '#8b5cf6'} />
            ) : (
              <Ionicons name="add" size={24} color={COLORS.primary || '#8b5cf6'} />
            )}
          </View>
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          {isUploading ? 'Sharing...' : 'Your Story'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Determine avatar source
  const hasAvatar = !!avatar;
  const avatarSource = typeof avatar === 'number' || (avatar && typeof avatar === 'object')
    ? avatar
    : { uri: avatar || 'https://via.placeholder.com/150' };

  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.storyWrapper} onPress={onPress}>
      <LinearGradient
        colors={borderColors}
        style={styles.storyRingGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.storyImageContainer}>
          {hasAvatar ? (
            <Image source={avatarSource} style={styles.storyAvatar} />
          ) : (
            <View style={[styles.storyAvatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarInitial}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      <Text style={styles.storyName} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  storyWrapper: {
    alignItems: 'center',
    marginRight: 14,
    width: 68,
  },
  userStoryOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  userStoryInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(45, 16, 84, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  storyImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.background || '#1a0533',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    backgroundColor: '#4c2885',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  storyName: {
    fontSize: 11,
    color: '#ffffff',
    ...FONTS.medium,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 2,
  },
});