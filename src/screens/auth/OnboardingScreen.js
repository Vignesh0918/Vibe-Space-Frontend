import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { SCREENS } from '../../constants';

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Create Your Circles',
    subtitle: 'Separate your friends, family and work life for a cleaner experience.',
  },
  {
    title: 'Chats That Vanish',
    subtitle: 'Set messages to auto-delete. Privacy first.',
  },
  {
    title: 'Share Your Vibe',
    subtitle: 'Song of the day, mood status and more. Connect through the rhythm of your life.',
  }
];

/**
 * OnboardingScreen
 * Matches the Stitch/Figma UI design with a 3-step slideshow:
 * - Top header with branding and SKIP link
 * - Dynamic graphics for each slide:
 *   - Slide 0: Neon space circles image (assets/onboarding_circles.png)
 *   - Slide 1: Glassmorphism Chats That Vanish mockup (custom vector drawing)
 *   - Slide 2: Custom "Share Your Vibe" central ring with floating glowing emoji nodes
 * - Glassmorphic details card
 * - Interactive page pagination indicators
 * - Glowing gradient Next/Get Started button
 */
export default function OnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigation.navigate(SCREENS.LOGIN);
    }
  };

  const handleSkip = () => {
    navigation.navigate(SCREENS.LOGIN);
  };

  const activeSlide = slides[step];

  // Step 1: Render custom chat bubble graphic matching the mockup screenshot
  const renderChatsGraphic = () => (
    <View style={styles.chatGraphicContainer}>
      {/* Receiver Bubble Row */}
      <View style={styles.chatRowLeft}>
        <View style={styles.receiverBubble}>
          <Ionicons 
            name="hourglass-outline" 
            size={16} 
            color={COLORS.textMuted || '#a78bfa'} 
            style={styles.receiverIcon} 
          />
          <Text style={styles.receiverText}>Did you see that post?</Text>
        </View>
        <View style={styles.shutterIconOuter}>
          <MaterialCommunityIcons 
            name="aperture" 
            size={18} 
            color={COLORS.textMuted || '#a78bfa'} 
          />
        </View>
      </View>

      {/* Sender Bubble Row */}
      <View style={styles.chatRowRight}>
        <LinearGradient
          colors={['#5b75fa', '#9873ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.senderBubble}
        >
          <Text style={styles.senderText}>Yeah, it was insane! ⚡ </Text>
          <MaterialCommunityIcons 
            name="history" 
            size={16} 
            color="#ffffff" 
            style={styles.senderIcon} 
          />
        </LinearGradient>
      </View>

      {/* Vanish Mode Overlay Card */}
      <View style={[styles.vanishOverlayCard, styles.shadow]}>
        <View style={styles.vanishIconBg}>
          <MaterialCommunityIcons 
            name="timer-outline" 
            size={24} 
            color="#ffffff" 
          />
        </View>
        <Text style={styles.vanishCardTitle}>Vanish Mode</Text>
        <Text style={styles.vanishCardSubtitle}>Messages disappear after 24h</Text>
      </View>
    </View>
  );

  // Step 2: Render custom Share Your Vibe graphic matching the latest mockup
  const renderVibeGraphic = () => (
    <View style={styles.vibeGraphicContainer}>
      {/* Central Ring */}
      <View style={styles.vibeCentralRing}>
        {/* Floating Vibe Nodes */}
        <View style={[styles.vibeNode, styles.vibeNodeFire]}>
          <Text style={styles.vibeNodeEmoji}>🔥</Text>
        </View>
        <View style={[styles.vibeNode, styles.vibeNodeSparkles]}>
          <Text style={[styles.vibeNodeEmoji, { fontSize: 26 }]}>✨</Text>
        </View>
        <View style={[styles.vibeNode, styles.vibeNodeWave]}>
          <Text style={[styles.vibeNodeEmoji, { fontSize: 24 }]}>🌊</Text>
        </View>
        <View style={[styles.vibeNode, styles.vibeNodeHeadphones]}>
          <Text style={styles.vibeNodeEmoji}>🎧</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[
      styles.wrapper, 
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]}>
      <LinearGradient
        colors={[COLORS.background || '#1a0533', '#0e031a']}
        style={styles.gradientContainer}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={styles.brandText}>VibeSpace</Text>
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Illustration Area */}
        <View style={styles.illustrationContainer}>
          {step === 0 && (
            <Image
              source={require('../../../assets/onboarding_circles.png')}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          )}
          {step === 1 && renderChatsGraphic()}
          {step === 2 && renderVibeGraphic()}
        </View>

        {/* Glassmorphic Info Card */}
        <View style={[styles.infoCard, styles.shadow]}>
          <Text style={styles.cardTitle}>{activeSlide.title}</Text>
          <Text style={styles.cardSubtitle}>{activeSlide.subtitle}</Text>
        </View>

        {/* Page Indicators */}
        <View style={styles.indicatorsRow}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setStep(index)}
              activeOpacity={0.7}
              style={[
                styles.indicatorDot,
                step === index && styles.activeDot
              ]}
            />
          ))}
        </View>

        {/* Gradient Next Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={styles.buttonTouch}
        >
          <LinearGradient
            colors={[COLORS.primary || '#4f6ef7', COLORS.secondary || '#8b5cf6']}
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

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background || '#1a0533',
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: SIZES.spacingLg || 24,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    marginTop: 10,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.5,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted || '#a78bfa',
    letterSpacing: 0.5,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: width * 0.85,
    marginVertical: 10,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  
  // Custom Chat Graphic styles
  chatGraphicContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chatRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: 10,
  },
  receiverBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: COLORS.secondary || '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  receiverIcon: {
    marginRight: 8,
  },
  receiverText: {
    color: COLORS.text || '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  shutterIconOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  chatRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  senderBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary || '#4f6ef7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  senderIcon: {
    marginLeft: 6,
  },
  senderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  vanishOverlayCard: {
    position: 'absolute',
    alignSelf: 'center',
    top: '25%',
    width: 240,
    backgroundColor: 'rgba(26, 5, 51, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: COLORS.secondary || '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  vanishIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  vanishCardTitle: {
    color: COLORS.text || '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  vanishCardSubtitle: {
    color: COLORS.textMuted || '#a78bfa',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.85,
    textAlign: 'center',
  },

  // Custom "Share Your Vibe" Graphic styles
  vibeGraphicContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeCentralRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  vibeNode: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(30, 20, 50, 0.65)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  vibeNodeFire: {
    top: 5,
    left: 10,
    borderColor: '#f97316',
    shadowColor: '#f97316',
  },
  vibeNodeSparkles: {
    top: 25,
    right: -10,
    borderColor: '#eab308',
    shadowColor: '#eab308',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  vibeNodeWave: {
    bottom: 95,
    left: -20,
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  vibeNodeHeadphones: {
    bottom: 25,
    right: 15,
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
  },
  vibeNodeEmoji: {
    fontSize: 20,
  },

  // Info Card styles
  infoCard: {
    backgroundColor: 'rgba(45, 16, 84, 0.65)',
    borderWidth: 1,
    borderColor: COLORS.border || '#4c2885',
    borderRadius: SIZES.radiusLg || 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 10,
  },
  shadow: {
    shadowColor: COLORS.secondary || '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    ...FONTS.bold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    ...FONTS.regular,
    color: COLORS.textMuted || '#a78bfa',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
  },
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
    marginVertical: 15,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: COLORS.primary || '#4f6ef7',
    width: 20,
  },
  buttonTouch: {
    width: '100%',
    height: SIZES.buttonHeight || 52,
    borderRadius: SIZES.radiusFull || 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    fontSize: 16,
    color: '#ffffff',
  },
});