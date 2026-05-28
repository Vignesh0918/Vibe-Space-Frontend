import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';

/**
 * SongOverlay Component
 * Glassmorphic overlay pill rendering song details on top of post/story image previews.
 * 
 * @param {object} props
 * @param {object} props.song - Song metadata block { title, artist, artwork, previewUrl }.
 * @param {boolean} props.isPlaying - Optional playing indicator.
 * @param {function} props.onPress - Tap action handler to preview the song.
 */
export default function SongOverlay({ song, isPlaying = false, onPress }) {
  if (!song) return null;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [song]);

  const { title, artist, artwork } = song;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.75 : 1}
        onPress={onPress}
        disabled={!onPress}
        style={styles.pill}
      >
        <Ionicons
          name={isPlaying ? "musical-notes" : "musical-note-outline"}
          size={16}
          color={isPlaying ? "#00f0ff" : "#ffffff"}
          style={styles.musicIcon}
        />

        {artwork ? (
          <Image source={{ uri: artwork }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.placeholderArtwork]}>
            <Ionicons name="musical-note" size={10} color="#ffffff" />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {artist}
          </Text>
        </View>

        {onPress && song.previewUrl && (
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={12}
            color="#ffffff"
            style={styles.playStateIcon}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    zIndex: 99,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: 260,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  musicIcon: {
    marginRight: 8,
  },
  artwork: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  placeholderArtwork: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    ...FONTS.medium,
  },
  artist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    ...FONTS.regular,
    marginTop: 1,
  },
  playStateIcon: {
    marginLeft: 6,
    opacity: 0.85,
  },
});
