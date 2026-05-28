import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { setUser } from '../../store/slices/authSlice';
import { createUserProfile } from '../../services/authService';

// Vibe options matching the mockup
const VIBES = [
  { id: 'chill', emoji: '🌙', label: 'Chill' },
  { id: 'hype', emoji: '🔥', label: 'Hype' },
  { id: 'arty', emoji: '🎨', label: 'Arty' },
  { id: 'beat', emoji: '🎧', label: 'Beat' },
  { id: 'glow', emoji: '✨', label: 'Glow' },
];

/**
 * ProfileSetupScreen
 * Matches the updated Stitch/Figma UI design precisely:
 * - Centered "VibeSpace" header branding
 * - "Set up your profile" title & subtitle
 * - Large avatar selector with a custom light-blue aperture icon and floating '+' button
 * - Form labels in uppercase and specific spacing (FULL NAME, USERNAME, BIO)
 * - Horizontal selection row: "CHOOSE YOUR VIBE" with customized emojis
 * - Bottom action bar containing the "Continue" gradient button
 * 
 * Now integrated with:
 * - Route params (uid, phoneNumber, displayName, photoURL from Login/Google flows)
 * - MongoDB user profile creation via authService.createUserProfile()
 * - Redux setUser dispatch on success to trigger MainNavigator switch
 */
export default function ProfileSetupScreen() {
  const dispatch = useDispatch();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Extract route params from login/Google flow
  const { 
    uid = null, 
    phoneNumber = null, 
    displayName: initialName = '', 
    photoURL: initialPhoto = null,
    email = null,
  } = route.params || {};

  const [avatarUri, setAvatarUri] = useState(initialPhoto);
  const [fullName, setFullName] = useState(initialName || '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('chill');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Permission to access camera roll is required to select an avatar!'
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Error picking image: ${error.message}`
      });
    }
  };

  const handleCompleteSetup = async () => {
    if (!fullName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Info',
        text2: 'Please enter your full name.'
      });
      return;
    }
    if (username.trim().length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Username',
        text2: 'Username must be at least 3 characters.'
      });
      return;
    }

    setIsSubmitting(true);

    const profileData = {
      username: username.trim().toLowerCase(),
      displayName: fullName.trim(),
      photoURL: avatarUri || '',
      bio: bio.trim(),
      mood: selectedVibe,
      email: email ? email.trim().toLowerCase() : null,
    };

    try {
      // If we have a uid from Firebase, register in MongoDB
      if (uid) {
        const result = await createUserProfile(uid, profileData);
        
        if (!result.success) {
          setIsSubmitting(false);
          Toast.show({
            type: 'error',
            text1: 'Registration Failed',
            text2: result.error || 'Could not create your profile. Please try again.'
          });
          return;
        }

        // Dispatch the full user data to Redux — this switches to MainNavigator
        dispatch(setUser({
          uid,
          phoneNumber: phoneNumber || null,
          email: email || null,
          displayName: fullName.trim(),
          username: `@${username.trim().toLowerCase()}`,
          photoURL: result.data?.photoURL || avatarUri || '',
          bio: bio.trim(),
          mood: selectedVibe,
        }));
      } else {
        // Fallback for edge cases: mock user creation
        dispatch(setUser({
          uid: `vibe_user_${Math.random().toString(36).substr(2, 9)}`,
          phoneNumber: phoneNumber || '+91 00000 00000',
          displayName: fullName.trim(),
          username: `@${username.trim().toLowerCase()}`,
          photoURL: avatarUri || '',
          bio: bio.trim(),
          mood: selectedVibe,
        }));
      }
    } catch (error) {
      setIsSubmitting(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Something went wrong. Please try again.'
      });
    }
  };

  return (
    <View style={[
      styles.wrapper,
      {
        paddingTop: insets.top,
        paddingBottom: 0, // handled by the bottom setup bar
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
          <Text style={styles.headerTitle}>VibeSpace</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title Block */}
            <View style={styles.titleBlock}>
              <Text style={styles.titleText}>Set up your profile</Text>
              <Text style={styles.subtitleText}>Let the world know who you are</Text>
            </View>

            {/* Avatar Selector */}
            <View style={styles.avatarWrapper}>
              <TouchableOpacity 
                onPress={handleSelectAvatar} 
                activeOpacity={0.8}
                style={styles.avatarTouch}
              >
                <View style={styles.avatarCircle}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={40} color="#818cf8" />
                  )}
                </View>
                <View style={styles.plusButton}>
                  <Ionicons name="add" size={20} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Field: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={fullName}
                    onChangeText={setFullName}
                    maxLength={30}
                  />
                </View>
              </View>

              {/* Field: Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="@username"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={username}
                    onChangeText={(val) => setUsername(val.replace(/\s+/g, ''))} // strip spaces
                    autoCapitalize="none"
                    maxLength={20}
                  />
                </View>
              </View>

              {/* Field: Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>BIO</Text>
                <View style={[styles.inputBox, styles.bioBox]}>
                  <TextInput
                    style={styles.bioInputField}
                    placeholder="Tell your story..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={bio}
                    onChangeText={setBio}
                    multiline={true}
                    numberOfLines={3}
                    maxLength={120}
                  />
                </View>
              </View>

              {/* Choose Your Vibe */}
              <View style={styles.vibeContainer}>
                <Text style={styles.fieldLabel}>CHOOSE YOUR VIBE</Text>
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vibesScroll}
                >
                  {VIBES.map((item) => {
                    const isSelected = selectedVibe === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelectedVibe(item.id)}
                        activeOpacity={0.7}
                        style={styles.vibeItem}
                      >
                        <View style={[
                          styles.vibeCircle,
                          isSelected && styles.vibeCircleSelected
                        ]}>
                          <Text style={styles.vibeEmoji}>{item.emoji}</Text>
                        </View>
                        <Text style={[
                          styles.vibeLabel,
                          isSelected && styles.vibeLabelSelected
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

          </ScrollView>

          {/* Curved Bottom Action Area */}
          <View style={[styles.bottomBarContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity
              onPress={handleCompleteSetup}
              activeOpacity={0.8}
              disabled={isSubmitting}
              style={styles.continueButtonTouch}
            >
              <LinearGradient
                colors={['#818cf8', '#c084fc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#1e083c" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

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
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    width: '100%',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.5,
  },
  headerLogoImage: {
    width: 80,
    height: 40,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120, // leave space for absolute bottom bar
  },
  titleBlock: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#250e41',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  plusButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#818cf8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a78bfa',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputBox: {
    backgroundColor: '#250e41',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bioBox: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputField: {
    color: '#ffffff',
    fontSize: 15,
    height: '100%',
  },
  bioInputField: {
    color: '#ffffff',
    fontSize: 15,
    flex: 1,
    width: '100%',
    textAlignVertical: 'top',
  },
  vibeContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  vibesScroll: {
    paddingVertical: 8,
  },
  vibeItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 56,
  },
  vibeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#250e41',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  vibeCircleSelected: {
    borderColor: '#818cf8',
    backgroundColor: '#351c5e',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 3,
  },
  vibeEmoji: {
    fontSize: 22,
  },
  vibeLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  vibeLabelSelected: {
    color: '#818cf8',
    fontWeight: '600',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#160a2a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 24,
    paddingTop: 20,
    overflow: 'hidden',
  },
  continueButtonTouch: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e083c',
    letterSpacing: 0.5,
  },
});