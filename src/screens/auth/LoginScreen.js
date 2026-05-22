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
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import { loginWithGoogleThunk, setUser } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

// Simulated Google accounts for the chooser modal
const MOCK_GOOGLE_ACCOUNTS = [
  {
    id: '1',
    displayName: 'Vicky Kumar',
    email: 'vicky.kumar@gmail.com',
    photoURL: null,
    initials: 'VK',
    color: '#4285F4',
  },
  {
    id: '2',
    displayName: 'VibeSpace User',
    email: 'vibespace.user@gmail.com',
    photoURL: null,
    initials: 'VU',
    color: '#EA4335',
  },
];

/**
 * LoginScreen
 * Matches the Stitch/Figma UI design precisely:
 * - Brand heading: "VibeSpace" & "Join the cosmic circle."
 * - Welcome back translucent details card
 * - Phone number input with country code (+91) selector and divider
 * - Gradient "Send OTP →" button with loading state
 * - OR divider line
 * - "Continue with Google" social login button with account chooser modal
 * - Footer terms agreement text
 * - Bottom Secure & Fluid informational badges
 */
export default function LoginScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading } = useSelector((state) => state.auth);

  const [isGoogleModalVisible, setIsGoogleModalVisible] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState(null);
  const [modalAnim] = useState(new Animated.Value(0));

  const openGoogleModal = () => {
    setIsGoogleModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const closeGoogleModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsGoogleModalVisible(false);
      setSelectedGoogleAccount(null);
    });
  };

  const handleSelectGoogleAccount = async (account) => {
    setSelectedGoogleAccount(account.id);
    setGoogleLoading(true);

    try {
      const result = await dispatch(loginWithGoogleThunk({
        googleUser: {
          displayName: account.displayName,
          email: account.email,
          photoURL: account.photoURL,
        },
      })).unwrap();

      setGoogleLoading(false);
      closeGoogleModal();

      if (result.profileExists) {
        // User has a MongoDB profile — Redux setUser already dispatched, auto-navigates
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
      closeGoogleModal();
      Alert.alert('Sign-In Failed', error || 'Could not sign in with Google. Please try again.');
    }
  };

  const renderGoogleAccountItem = (account) => {
    const isSelected = selectedGoogleAccount === account.id;
    return (
      <TouchableOpacity
        key={account.id}
        style={[styles.googleAccountItem, isSelected && styles.googleAccountItemSelected]}
        onPress={() => handleSelectGoogleAccount(account)}
        activeOpacity={0.7}
        disabled={googleLoading}
      >
        <View style={[styles.googleAccountAvatar, { backgroundColor: account.color }]}>
          {account.photoURL ? (
            <Image source={{ uri: account.photoURL }} style={styles.googleAccountPhoto} />
          ) : (
            <Text style={styles.googleAccountInitials}>{account.initials}</Text>
          )}
        </View>
        <View style={styles.googleAccountInfo}>
          <Text style={styles.googleAccountName}>{account.displayName}</Text>
          <Text style={styles.googleAccountEmail}>{account.email}</Text>
        </View>
        {isSelected && googleLoading ? (
          <ActivityIndicator size="small" color="#818cf8" />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        )}
      </TouchableOpacity>
    );
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
                onPress={openGoogleModal}
                activeOpacity={0.7}
                style={styles.googleButton}
                disabled={isLoading}
              >
                <View style={styles.googleIconBg}>
                  <AntDesign name="google" size={18} color="#ffffff" />
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
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

      {/* Google Account Chooser Modal */}
      <Modal
        visible={isGoogleModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeGoogleModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeGoogleModal}
        >
          <Animated.View 
            style={[
              styles.googleModalContainer,
              {
                transform: [{
                  scale: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                }],
                opacity: modalAnim,
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Modal Header */}
              <View style={styles.googleModalHeader}>
                <View style={styles.googleModalLogoRow}>
                  <AntDesign name="google" size={22} color="#ffffff" />
                  <Text style={styles.googleModalTitle}>Choose an account</Text>
                </View>
                <Text style={styles.googleModalSubtitle}>
                  to continue to VibeSpace
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.googleModalDivider} />

              {/* Account List */}
              <View style={styles.googleAccountsList}>
                {MOCK_GOOGLE_ACCOUNTS.map(renderGoogleAccountItem)}
              </View>

              {/* Add another account */}
              <TouchableOpacity style={styles.addAccountButton} activeOpacity={0.7} disabled={googleLoading}>
                <View style={styles.addAccountIconBg}>
                  <MaterialIcons name="person-add-alt" size={20} color="#818cf8" />
                </View>
                <Text style={styles.addAccountText}>Use another account</Text>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.googleModalFooter}>
                <Text style={styles.googleModalFooterText}>
                  To continue, Google will share your name, email, and profile picture with VibeSpace.
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
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
});