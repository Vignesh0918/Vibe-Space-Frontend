import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

/**
 * PlaceholderScreen Component
 * Used temporarily by all empty screens to display the screen name and handle
 * standard back navigation.
 * 
 * @param {object} props
 * @param {string} props.name - The screen name to be displayed
 */
export default function PlaceholderScreen({ name }) {
  const navigation = useNavigation();
  
  // Safely check if we can go back. If in a tab, canGoBack() might return true even if we shouldn't pop.
  // We check if navigation can go back in the current stack.
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.container}>
      {canGoBack && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={SIZES.iconMd || 24} color={COLORS.text || '#ffffff'} />
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <Ionicons 
          name="layers-outline" 
          size={SIZES.avatarLg || 64} 
          color={COLORS.primary || '#4f6ef7'} 
          style={styles.icon} 
        />
        <Text style={styles.text}>{name}</Text>
        <Text style={styles.subtext}>VibeSpace Navigation Placeholder</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#1a0533',
    padding: SIZES.spacingMd || 16,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: SIZES.spacingMd || 16,
    opacity: 0.8,
  },
  text: {
    color: COLORS.text || '#ffffff',
    fontSize: SIZES.xl || 20,
    ...FONTS.bold,
    textAlign: 'center',
    marginBottom: SIZES.spacingXs || 4,
  },
  subtext: {
    color: COLORS.textMuted || '#a78bfa',
    fontSize: SIZES.sm || 14,
    ...FONTS.regular,
    textAlign: 'center',
    opacity: 0.6,
  },
});
