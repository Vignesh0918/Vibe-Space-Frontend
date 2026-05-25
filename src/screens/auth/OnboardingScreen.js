import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { SCREENS } from '../../constants';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    title: 'Create Your Circles',
    subtitle: 'Separate your friends, family and work life\nfor a cleaner experience.',
  },
  {
    title: 'Chats That Vanish',
    subtitle: 'Set messages to auto-delete.\nPrivacy first.',
  },
  {
    title: 'Share Your Vibe',
    subtitle: 'Song of the day, mood status and more.\nConnect through the rhythm of your life.',
  }
];

/**
 * OnboardingScreen
 *
 * Premium 3-step onboarding with:
 * - Slide 0: Orbiting circles illustration with glow effects
 * - Slide 1: Glassmorphism "Vanish Mode" card with floating timer
 * - Slide 2: Floating emoji constellation around a dashed orbit ring
 * - Animated transitions, pagination dots, gradient CTA button
 */
export default function OnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Continuous orbit rotation
  useEffect(() => {
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Continuous pulse for the center icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Floating animation for vanish card
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animateTransition = (newStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(newStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < 2) {
      animateTransition(step + 1);
    } else {
      navigation.navigate(SCREENS.LOGIN);
    }
  };

  const handleDotPress = (index) => {
    if (index !== step) {
      animateTransition(index);
    }
  };

  const handleSkip = () => {
    navigation.navigate(SCREENS.LOGIN);
  };

  const activeSlide = slides[step];

  // Orbit rotation interpolation
  const orbitRotation = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ─── Slide 0: Circles Illustration ───
  const renderCirclesGraphic = () => (
    <View style={styles.graphicCenter}>
      <Image
        source={require('../../../assets/onboarding_circles.png')}
        style={styles.circlesImage}
        resizeMode="contain"
      />
    </View>
  );

  // ─── Slide 1: Vanish Mode ───
  const renderChatsGraphic = () => (
    <View style={styles.graphicCenter}>
      {/* Glassmorphism container */}
      <Animated.View style={[
        styles.vanishOuterCard,
        { transform: [{ translateY: floatAnim }] }
      ]}>
        <View style={styles.vanishInnerCard}>
          {/* Clock icon circle */}
          <View style={styles.vanishClockContainer}>
            <LinearGradient
              colors={['#7c5bf5', '#6366f1']}
              style={styles.vanishClockGradient}
            >
              <Ionicons name="time-outline" size={28} color="#ffffff" />
            </LinearGradient>
          </View>

          <Text style={styles.vanishTitle}>Vanish Mode</Text>
          <Text style={styles.vanishSubtext}>Messages disappear after 24h</Text>

          {/* Floating refresh icon */}
          <View style={styles.vanishRefreshIcon}>
            <MaterialCommunityIcons name="restore" size={18} color="#6366f1" />
          </View>
        </View>
      </Animated.View>
    </View>
  );

  // ─── Slide 2: Share Your Vibe ───
  const renderVibeGraphic = () => {
    // Orbit radius
    const orbitR = width * 0.32;

    return (
      <View style={styles.graphicCenter}>
        {/* Dashed orbit ring */}
        <View style={[styles.orbitRing, { width: orbitR * 2, height: orbitR * 2, borderRadius: orbitR }]}>
          {/* Inner smaller dashed ring */}
          <View style={[styles.orbitRingInner, {
            width: orbitR * 1.3,
            height: orbitR * 1.3,
            borderRadius: orbitR * 0.65,
          }]} />
        </View>

        {/* Central music icon with pulse */}
        <Animated.View style={[
          styles.vibeCenterIcon,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.25)', 'rgba(99, 102, 241, 0.15)']}
            style={styles.vibeCenterGradient}
          >
            <Ionicons name="musical-note" size={36} color="#c4b5fd" />
          </LinearGradient>
        </Animated.View>

        {/* Floating emoji nodes at fixed orbital positions */}
        {/* Fire - top */}
        <Animated.View style={[
          styles.vibeNodeWrapper,
          {
            top: -orbitR * 0.15,
            left: '50%',
            marginLeft: -2,
            transform: [{ translateY: floatAnim }],
          }
        ]}>
          <View style={[styles.vibeNode, styles.vibeNodeFire]}>
            <Text style={styles.vibeEmoji}>🔥</Text>
          </View>
        </Animated.View>

        {/* Wave - left */}
        <Animated.View style={[
          styles.vibeNodeWrapper,
          {
            top: '40%',
            left: -orbitR * 0.45,
            transform: [{
              translateY: Animated.multiply(floatAnim, -1)
            }],
          }
        ]}>
          <View style={[styles.vibeNode, styles.vibeNodeWave]}>
            <Text style={styles.vibeEmoji}>🌊</Text>
          </View>
        </Animated.View>

        {/* Sparkles - right */}
        <Animated.View style={[
          styles.vibeNodeWrapper,
          {
            top: '18%',
            right: -orbitR * 0.35,
            transform: [{ translateY: floatAnim }],
          }
        ]}>
          <View style={[styles.vibeNode, styles.vibeNodeSparkles]}>
            <Text style={[styles.vibeEmoji, { fontSize: 22 }]}>✨</Text>
          </View>
        </Animated.View>

        {/* Headphones - bottom right */}
        <Animated.View style={[
          styles.vibeNodeWrapper,
          {
            bottom: '5%',
            right: -orbitR * 0.15,
            transform: [{
              translateY: Animated.multiply(floatAnim, -0.7)
            }],
          }
        ]}>
          <View style={[styles.vibeNode, styles.vibeNodeHeadphones]}>
            <Text style={styles.vibeEmoji}>🎧</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={[
      styles.wrapper,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    ]}>
      <LinearGradient
        colors={['#1a0a35', '#0f0520', '#0a0318']}
        locations={[0, 0.5, 1]}
        style={styles.gradientContainer}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.brandText}>
            <Text style={styles.brandVibe}>Vibe</Text>
            <Text style={styles.brandSpace}>Space</Text>
          </Text>
        </View>

        {/* ── Illustration Area ── */}
        <Animated.View style={[
          styles.illustrationContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}>
          {step === 0 && renderCirclesGraphic()}
          {step === 1 && renderChatsGraphic()}
          {step === 2 && renderVibeGraphic()}
        </Animated.View>

        {/* ── Info Card ── */}
        <Animated.View style={[
          styles.infoCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}>
          <Text style={styles.cardTitle}>{activeSlide.title}</Text>
          <Text style={styles.cardSubtitle}>{activeSlide.subtitle}</Text>
        </Animated.View>

        {/* ── Pagination Dots ── */}
        <View style={styles.indicatorsRow}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.7}
              style={[
                styles.indicatorDot,
                step === index && styles.activeDot
              ]}
            />
          ))}
        </View>

        {/* ── CTA Button ── */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={styles.buttonTouch}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {step === 2 ? 'Get Started' : 'Next'}
            </Text>
            <Text style={styles.buttonArrow}> →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#1a0a35',
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    marginTop: 8,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandVibe: {
    color: '#818cf8',
  },
  brandSpace: {
    color: '#6366f1',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.3,
  },

  /* ── Illustration ── */
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: height * 0.45,
    marginVertical: 8,
  },
  graphicCenter: {
    width: width * 0.85,
    height: width * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  /* ── Slide 0: Circles ── */
  circlesImage: {
    width: '100%',
    height: '100%',
  },

  /* ── Slide 1: Vanish Mode ── */
  vanishOuterCard: {
    width: width * 0.78,
    backgroundColor: '#1d0c35',
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
  },
  vanishInnerCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  vanishClockContainer: {
    marginBottom: 18,
  },
  vanishClockGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vanishTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  vanishSubtext: {
    color: 'rgba(167, 139, 250, 0.75)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  vanishRefreshIcon: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Slide 2: Share Your Vibe ── */
  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.12)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitRingInner: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.08)',
    borderStyle: 'dashed',
  },
  vibeCenterIcon: {
    position: 'absolute',
    zIndex: 5,
  },
  vibeCenterGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeNodeWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  vibeNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeNodeFire: {
    backgroundColor: 'rgba(120, 50, 10, 0.85)',
  },
  vibeNodeWave: {
    backgroundColor: 'rgba(20, 60, 130, 0.85)',
  },
  vibeNodeSparkles: {
    backgroundColor: 'rgba(100, 80, 20, 0.85)',
  },
  vibeNodeHeadphones: {
    backgroundColor: 'rgba(60, 30, 100, 0.85)',
  },
  vibeEmoji: {
    fontSize: 22,
  },

  /* ── Info Card ── */
  infoCard: {
    backgroundColor: '#1d0c35',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(167, 139, 250, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },

  /* ── Pagination ── */
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
    marginVertical: 16,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#6366f1',
    width: 24,
    borderRadius: 4,
  },

  /* ── CTA Button ── */
  buttonTouch: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 4,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
});