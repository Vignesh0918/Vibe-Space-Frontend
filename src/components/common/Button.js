/**
 * Button.js
 * Reusable pressable button component that handles multiple styles, sizes, and states.
 * Colors: primary gradient (blue-purple), secondary (card), outline, danger.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  style = {},
  textStyle = {},
}) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  // Determine button height and spacing based on size
  let paddingVertical = SIZES.spacingSm;
  let fontSize = SIZES.sm;
  let height = SIZES.buttonHeight;

  if (size === 'sm') {
    paddingVertical = SIZES.spacingXs;
    fontSize = SIZES.xs;
    height = 36;
  } else if (size === 'lg') {
    paddingVertical = SIZES.spacingMd;
    fontSize = SIZES.lg;
    height = 60;
  }

  // Render internal button content (text + optional icon/loader)
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          color={isOutline || isSecondary ? COLORS.primary : '#ffffff'} 
          size="small" 
        />
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[
          styles.text, 
          { fontSize },
          isOutline && { color: COLORS.primary },
          isSecondary && { color: COLORS.primary },
          textStyle
        ]}>
          {title}
        </Text>
      </View>
    );
  };

  const buttonStyle = [
    styles.button,
    { height, borderRadius: SIZES.radiusMd },
    isSecondary && styles.secondaryButton,
    isOutline && styles.outlineButton,
    isDanger && styles.dangerButton,
    (disabled || loading) && styles.disabledButton,
    style
  ];

  if (isPrimary && !disabled && !loading) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8}
        style={style}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={buttonStyle}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={buttonStyle}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: COLORS.card,
    borderColor: 'transparent',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SIZES.spacingSm,
  },
  text: {
    color: '#ffffff',
    ...FONTS.bold,
    textAlign: 'center',
  },
});
