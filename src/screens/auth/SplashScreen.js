import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

/**
 * SplashScreen
 * Displays a premium space-themed gradient background with a pulsing, glowing VibeSpace logo.
 * Since it is rendered during RootNavigator initialization, it functions as a pure presenter
 * to avoid any React Navigation hooks running outside a NavigationContainer.
 */
export default function SplashScreen() {
  const pulseAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation for logo and glowing background
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation animation for cosmic ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background || '#1a0533', '#0e031a', '#06010d']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Cosmic Ring Backdrop */}
          <Animated.View 
            style={[
              styles.ringContainer, 
              { transform: [{ scale: pulseAnim }, { rotate: spin }] }
            ]}
          >
            <View style={styles.glowRingOuter} />
            <View style={styles.glowRingInner} />
          </Animated.View>

          {/* Glowing Shutter Icon */}
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="aperture" size={80} color="#8b5cf6" />
          </Animated.View>

          {/* Branding Texts */}
          <Text style={styles.title}>VibeSpace</Text>
          <Text style={styles.subtitle}>Join the cosmic circle.</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  glowRingOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    borderStyle: 'dashed',
  },
  glowRingInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(79, 110, 247, 0.25)',
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(45, 16, 84, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(139, 92, 246, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#a78bfa',
    opacity: 0.8,
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
