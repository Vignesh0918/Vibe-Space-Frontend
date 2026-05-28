import React, { useState } from 'react';
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
  Modal,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import { loginWithRealGoogleThunk, loginWithGoogleThunk } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

/**
 * LoginScreen
 * Matches the Stitch/Figma UI design precisely:
 * - Brand heading: "VibeSpace" & "Join the cosmic circle."
 * - Welcome back translucent details card
 * - Phone number input with country code (+91) selector and divider
 * - Gradient "Send OTP →" button with loading state
 * - OR divider line
 * - "Continue with Google" social login button
 * - Footer terms agreement text
 * - Bottom Secure & Fluid informational badges
 */
const MOCK_GOOGLE_ACCOUNTS = [
  {
    id: '1',
    displayName: 'VibeSpace Dev',
    email: 'dev@vibespace.app',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
  },
  {
    id: '2',
    displayName: 'Aria Cosmic',
    email: 'aria@vibespace.app',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
  },
  {
    id: '3',
    displayName: 'Leo Nebula',
    email: 'leo@nebula.io',
    photoURL: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100&q=80',
  },
];

export default function LoginScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading } = useSelector((state) => state.auth);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  const handleRealGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await dispatch(loginWithRealGoogleThunk()).unwrap();
      setGoogleLoading(false);

      if (result.profileExists) {
        // Existing user — Redux setUser already dispatched, auto-navigates
      } else {
        // New user — go to profile setup with Google details
        navigation.navigate(SCREENS.PROFILE_SETUP, {
          uid: result.userData.uid,
          displayName: result.userData.displayName,
          email: result.userData.email,
          photoURL: result.userData.photoURL,
          phoneNumber: null,
        });
      }
    } catch (error) {
      setGoogleLoading(false);
      // Check if it's a native module unsupported error
      const isUnsupported = error && (
        error.includes('only supported on a native development build') || 
        error.includes('native') || 
        error.includes('not supported') ||
        error.includes('require')
      );
      if (isUnsupported) {
        setShowMockGoogleModal(true);
      } else {
        Toast.show({ type: 'error', text1: 'Sign-In Failed', text2: error || 'Could not sign in with Google. Please try again.' });
      }
    }
  };

  const handleMockAccountSelect = async (googleUser) => {
    setShowMockGoogleModal(false);
    setGoogleLoading(true);
    try {
      const result = await dispatch(loginWithGoogleThunk({ googleUser })).unwrap();
      setGoogleLoading(false);

      if (result.profileExists) {
        // Existing user — Redux setUser already dispatched, auto-navigates
      } else {
        // New user — go to profile setup with Google details
        navigation.navigate(SCREENS.PROFILE_SETUP, {
          uid: result.userData.uid,
          displayName: result.userData.displayName,
          email: result.userData.email,
          photoURL: result.userData.photoURL,
          phoneNumber: null,
        });
      }
    } catch (error) {
      setGoogleLoading(false);
      Toast.show({ type: 'error', text1: 'Sign-In Failed', text2: error || 'Could not sign in with simulated Google account. Please try again.' });
    }
  };

  const handleCustomEmailSubmit = () => {
    if (!customEmail.trim() || !customEmail.includes('@')) {
      Toast.show({ type: 'error', text1: 'Invalid Email', text2: 'Please enter a valid email address.' });
      return;
    }
    const name = customEmail.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    handleMockAccountSelect({
      displayName: formattedName,
      email: customEmail.trim().toLowerCase(),
      photoURL: null,
    });
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
        colors={[COLORS.background || '#1a0533', '#0e031a']}
        style={styles.gradientContainer}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Branding Header */}
            <View style={styles.brandingContainer}>
              <Text style={styles.brandText}>VibeSpace</Text>
              <Text style={styles.brandSubtitle}>Join the cosmic circle.</Text>
            </View>

            {/* Login Card */}
            <View style={[styles.loginCard, styles.shadow]}>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardSubtitle}>Choose Google Sign-In to join the cosmic circle.</Text>

              {/* Google Button */}
              <TouchableOpacity
                onPress={handleRealGoogleLogin}
                activeOpacity={0.7}
                style={styles.googleButton}
                disabled={isLoading || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <View style={styles.googleIconBg}>
                      <AntDesign name="google" size={18} color="#ffffff" />
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Terms Text */}
              <Text style={styles.termsText}>
                By continuing, you agree to our{'\n'}
                <Text style={styles.termsLink}>Terms of Service</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Bottom Badges */}
            <View style={styles.badgesRow}>
              {/* Secure Badge */}
              <View style={styles.badgeCard}>
                <View style={[styles.badgeIconBg, styles.blueBadge]}>
                  <Ionicons name="shield-checkmark" size={18} color="#00f0ff" />
                </View>
                <View style={styles.badgeTextContainer}>
                  <Text style={styles.badgeTitle}>Secure</Text>
                  <Text style={styles.badgeSubtitle}>End-to-end{'\n'}encryption</Text>
                </View>
              </View>

              {/* Fluid Badge */}
              <View style={styles.badgeCard}>
                <View style={[styles.badgeIconBg, styles.purpleBadge]}>
                  <Ionicons name="sparkles" size={18} color="#8b5cf6" />
                </View>
                <View style={styles.badgeTextContainer}>
                  <Text style={styles.badgeTitle}>Fluid</Text>
                  <Text style={styles.badgeSubtitle}>Instant{'\n'}connectivity</Text>
                </View>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Simulated Google Account Chooser Modal */}
      <Modal
        visible={showMockGoogleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMockGoogleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.googleModalContainer}>
            <View style={styles.googleModalHeader}>
              <View style={styles.googleModalLogoRow}>
                <AntDesign name="google" size={24} color="#818cf8" />
                <Text style={styles.googleModalTitle}>Sign in with Google</Text>
              </View>
              <Text style={styles.googleModalSubtitle}>to continue to VibeSpace</Text>
            </View>

            <View style={styles.googleModalDivider} />

            <ScrollView style={styles.googleAccountsList} bounces={false}>
              {MOCK_GOOGLE_ACCOUNTS.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.googleAccountItem}
                  activeOpacity={0.7}
                  onPress={() => handleMockAccountSelect(account)}
                >
                  <View style={[styles.googleAccountAvatar, { backgroundColor: 'rgba(129, 140, 248, 0.15)' }]}>
                    {account.photoURL ? (
                      <Image source={{ uri: account.photoURL }} style={styles.googleAccountPhoto} />
                    ) : (
                      <Text style={styles.googleAccountInitials}>
                        {account.displayName.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.googleAccountInfo}>
                    <Text style={styles.googleAccountName}>{account.displayName}</Text>
                    <Text style={styles.googleAccountEmail}>{account.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addAccountButton}
                activeOpacity={0.7}
                onPress={() => setShowCustomEmail(!showCustomEmail)}
              >
                <View style={styles.addAccountIconBg}>
                  <AntDesign name="plus" size={16} color="#818cf8" />
                </View>
                <Text style={styles.addAccountText}>Use another account</Text>
              </TouchableOpacity>

              {showCustomEmail && (
                <View style={styles.customEmailSection}>
                  <Text style={styles.customEmailTitle}>Sign in with custom email</Text>
                  <View style={styles.customEmailRow}>
                    <TextInput
                      placeholder="Enter mock Google email..."
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
                      value={customEmail}
                      onChangeText={setCustomEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.customEmailInput}
                    />
                    <TouchableOpacity
                      style={styles.customEmailSubmit}
                      onPress={handleCustomEmailSubmit}
                      activeOpacity={0.7}
                    >
                      <AntDesign name="arrowright" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.googleModalFooter}>
              <Text style={styles.googleModalFooterText}>
                To continue, Google will share your name, email address, language preference, and profile picture with VibeSpace.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  brandText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 14,
    ...FONTS.regular,
    color: COLORS.textMuted || '#a78bfa',
    marginTop: 8,
    opacity: 0.85,
  },
  loginCard: {
    backgroundColor: '#250e41',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 22,
    marginVertical: 10,
  },
  shadow: {
    shadowColor: COLORS.secondary || '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 26,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    ...FONTS.regular,
    color: COLORS.textMuted || '#a78bfa',
    opacity: 0.8,
    marginBottom: 26,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 5, 51, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderRadius: 24,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    borderRightWidth: 1.5,
    borderRightColor: 'rgba(167, 139, 250, 0.2)',
    height: '60%',
  },
  countryText: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 16,
    paddingLeft: 14,
  },
  otpButtonTouch: {
    width: '100%',
    height: SIZES.buttonHeight || 52,
    borderRadius: SIZES.radiusFull || 999,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  otpButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  otpButtonText: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  otpButtonArrow: {
    fontSize: 16,
    color: '#ffffff',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },
  dividerText: {
    fontSize: 12,
    ...FONTS.bold,
    color: COLORS.textMuted || '#a78bfa',
    marginHorizontal: 16,
    opacity: 0.8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 5, 51, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderRadius: 24,
    height: 54,
    width: '100%',
    marginBottom: 20,
  },
  googleIconBg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0f041d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  googleButtonText: {
    fontSize: 15,
    ...FONTS.medium,
    color: '#ffffff',
  },
  termsText: {
    fontSize: 11,
    ...FONTS.regular,
    color: COLORS.textMuted || '#a78bfa',
    opacity: 0.65,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 2,
  },
  badgeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 16, 84, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  badgeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  blueBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  purpleBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 13,
    ...FONTS.bold,
    color: '#ffffff',
  },
  badgeSubtitle: {
    fontSize: 9,
    ...FONTS.regular,
    color: COLORS.textMuted || '#a78bfa',
    opacity: 0.8,
    lineHeight: 11,
    marginTop: 1,
  },

  // ─── Google Account Chooser Modal ───────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  googleModalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(30, 12, 56, 0.97)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.2)',
    overflow: 'hidden',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  googleModalHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  googleModalLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  googleModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  googleModalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    marginLeft: 34,
  },
  googleModalDivider: {
    height: 1,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
  },
  googleAccountsList: {
    paddingVertical: 8,
  },
  googleAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  googleAccountItemSelected: {
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
  },
  googleAccountAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  googleAccountPhoto: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  googleAccountInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  googleAccountInfo: {
    flex: 1,
  },
  googleAccountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  googleAccountEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(129, 140, 248, 0.08)',
  },
  addAccountIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  addAccountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#818cf8',
  },
  googleModalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(129, 140, 248, 0.08)',
  },
  googleModalFooterText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 15,
  },
  customEmailSection: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(129, 140, 248, 0.08)',
  },
  customEmailTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 8,
  },
  customEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 5, 51, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderRadius: 12,
    height: 44,
    paddingLeft: 12,
    paddingRight: 4,
  },
  customEmailInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: '100%',
  },
  customEmailSubmit: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#818cf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});