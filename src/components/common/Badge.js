/**
 * Badge.js
 * Numerical badge counter used for unread counts on chats, circles, and notifications.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

export default function Badge({
  count = 0,
  style = {},
  textStyle = {},
}) {
  if (count <= 0) return null;

  // Format count (e.g. 99+)
  const displayCount = count > 99 ? '99+' : count;

  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.text, textStyle]}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.secondary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: '#ffffff',
    fontSize: 10,
    ...FONTS.bold,
  },
});
