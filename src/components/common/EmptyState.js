/**
 * EmptyState.js
 * Visual placeholder shown when feeds, chats, notifications, or lists have no records.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import Button from './Button';

export default function EmptyState({
  title = 'No vibes yet',
  description = 'Start sharing with your circles or initiate a conversation!',
  icon = '💬',
  actionTitle = '',
  onActionPress = null,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          size="sm"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacingLg,
    backgroundColor: 'transparent',
    minHeight: 300,
  },
  icon: {
    fontSize: 48,
    marginBottom: SIZES.spacingSm,
  },
  title: {
    color: '#ffffff',
    fontSize: SIZES.lg,
    ...FONTS.bold,
    textAlign: 'center',
    marginBottom: SIZES.spacingXs,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: SIZES.sm,
    ...FONTS.regular,
    textAlign: 'center',
    marginBottom: SIZES.spacingMd,
    lineHeight: 20,
  },
  actionButton: {
    width: 'auto',
    paddingHorizontal: SIZES.spacingLg,
  },
});
