import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import { verifyOTPThunk } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

/**
 * OTPScreen
 * Matches the updated Stitch/Figma UI design precisely:
 * - Header: Back arrow on the left, "VibeSpace" branding centered, bottom divider
 * - Shield & Heart center badge
 * - "Verify Account" title
 * - Muted subtitle with highlighted bold phone number
 * - 6 solid white circle input fields synced with a hidden TextInput
 * - Active countdown timer: "Resend in XXs"
 * - Gradient "Verify" button with loading state
 * - Circular cosmic abstract wave graphic at the bottom center
 */
export default function OTPScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading } = useSelector((state) => state.auth);
  
  // Retrieve passed phone number and auth mode
  const { phoneNumber, authMode } = route.params || { phoneNumber: '+91 98765 43210', authMode: 'mock' };
  
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(28);
  const inputRef = useRef(null);

  useEffect(() => {
    // Countdown Timer logic
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Focus the input automatically on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  // Show a helpful hint for mock mode
  useEffect(() => {
    if (authMode === 'mock') {
      setTimeout(() => {
        Alert.alert(
          '🧪 Dev Mode',
          'Firebase phone auth is in mock mode.\nUse OTP code: 123456 to verify.',
          [{ text: 'Got it', style: 'default' }]
        );
      }, 800);
    }
  }, [authMode]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    try {
      const result = await dispatch(verifyOTPThunk({ otp })).unwrap();

      if (result.profileExists) {
        // User has a MongoDB profile — Redux setUser already dispatched.
        // Navigation will auto-switch to MainNavigator because isLoggedIn is now true.
      } else {
        // New user — navigate to profile setup with the Firebase UID and phone number
        navigation.navigate(SCREENS.PROFILE_SETUP, {
          uid: result.userData.uid,
          phoneNumber: result.userData.phoneNumber,
        });
      }
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error || 'Invalid OTP code. Please try again.',
        [{ text: 'OK', onPress: () => {
          setOtp('');
          inputRef.current?.focus();
        }}]
      );
    }
  };

  const handleResend = () => {
    setTimer(28);
    setOtp('');
    inputRef.current?.focus();
    Alert.alert('Code Resent', 'A new verification code has been sent to your phone.');
  };

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

  // Utility to format phone number for privacy display (e.g. +91 98XXX X4201)
  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '+91 98XXX X4201';
    // Clean spaces/hyphens
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone.length >= 13) {
      // e.g. +919876543210 -> +91 98XXX X4210
      return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 5)}XXX X${cleanPhone.substring(9)}`;
    }
    return phone;
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = otp[i] || '';
      const isFocused = otp.length === i;
      boxes.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.otpCircle,
            isFocused && styles.otpCircleFocused,
          ]}
          onPress={handleBoxPress}
          activeOpacity={0.9}
        >
          <Text style={styles.otpCircleText}>{char}</Text>
        </TouchableOpacity>
      );
    }
    return boxes;
  };

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
        colors={[COLORS.background || '#1a0533', '#0e031a', '#06010d']}
        style={styles.gradientContainer}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.headerBackButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>VibeSpace</Text>
        </View>
        <View style={styles.headerDivider} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Shield/Heart Badge */}
            <View style={styles.shieldBadgeContainer}>
              <View style={styles.shieldBadgeCircle}>
                <Ionicons name="shield-outline" size={36} color="#818cf8" />
                <Ionicons name="heart" size={14} color="#818cf8" style={styles.heartOverlay} />
              </View>
            </View>

            {/* Verify Account Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.titleText}>Verify Account</Text>
              <Text style={styles.subtitleText}>
                Enter the 6-digit code we sent to{'\n'}
                <Text style={styles.phoneHighlightText}>{formatPhoneForDisplay(phoneNumber)}</Text>
              </Text>
              {authMode === 'mock' && (
                <View style={styles.devModeBadge}>
                  <Ionicons name="flask" size={12} color="#fbbf24" />
                  <Text style={styles.devModeText}>Dev Mode — Use 123456</Text>
                </View>
              )}
            </View>

            {/* Hidden Input Field */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              caretHidden={true}
              editable={!isLoading}
            />

            {/* Circle Input Fields Row */}
            <View style={styles.otpCirclesRow}>
              {renderOtpBoxes()}
            </View>

            {/* Resend Countdown */}
            <View style={styles.timerRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend in <Text style={styles.timerCount}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Gradient Button */}
            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={0.8}
              disabled={otp.length !== 6 || isLoading}
              style={[
                styles.verifyButtonTouch,
                (otp.length !== 6 || isLoading) && styles.buttonDisabled
              ]}
            >
              <LinearGradient
                colors={
                  otp.length === 6 
                    ? ['#818cf8', '#c084fc']
                    : ['rgba(129, 140, 248, 0.4)', 'rgba(192, 132, 252, 0.4)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#1e083c" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cosmic Wave Center Graphic */}
            <View style={styles.bottomGraphicContainer}>
              <Image 
                source={require('../../../assets/cosmic_wave.png')}
                style={styles.bottomGraphicImage}
                resizeMode="cover"
              />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    position: 'relative',
    width: '100%',
  },
  headerBackButton: {
    position: 'absolute',
    left: 8,
    zIndex: 10,
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.5,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 24,
  },
  shieldBadgeContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  shieldBadgeCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heartOverlay: {
    position: 'absolute',
    top: 31,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneHighlightText: {
    color: '#818cf8',
    fontWeight: '700',
  },
  devModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
  },
  devModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
    marginLeft: 6,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  otpCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  otpCircleFocused: {
    borderWidth: 2.5,
    borderColor: '#818cf8',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  otpCircleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a0533', // Deep dark text on white circles
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  timerCount: {
    color: '#ffffff',
    fontWeight: '600',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8b5cf6',
    textDecorationLine: 'underline',
  },
  verifyButtonTouch: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    marginBottom: 50,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e083c', // Deep dark violet text
    letterSpacing: 0.5,
  },
  bottomGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 10,
  },
  bottomGraphicImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
});