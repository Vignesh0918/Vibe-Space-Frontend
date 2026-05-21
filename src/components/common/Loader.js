/**
 * Loader.js
 * Loading indicator centered in the view, supporting full screen overlay mode.
 */

import React from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function Loader({
  overlay = false,
  color = COLORS.primary,
  size = 'large',
}) {
  const containerStyle = overlay ? styles.overlayContainer : styles.standardContainer;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  standardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});
