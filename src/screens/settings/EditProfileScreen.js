/**
 * EditProfileScreen.js
 * 
 * High-fidelity, premium profile editor for VibeSpace.
 * Supports avatar upload, display name editing, debounced username availability checks,
 * character-counted bio, and mood selector, saving back to MongoDB and Redux.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { setUser } from '../../store/slices/authSlice';
import { checkUsernameAvailable, updateUserProfile } from '../../services/authService';

// Mood options for picker layout matching constants
const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🔥', label: 'Hyped' },
  { emoji: '🤯', label: 'Stressed' },
  { emoji: '😇', label: 'Chill' },
  { emoji: '💻', label: 'Coding' },
  { emoji: '🍿', label: 'Chilling' },
  { emoji: '✈️', label: 'Traveling' },
];

export default function EditProfileScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Get current authenticated user from Redux state
  const currentUser = useSelector((state) => state.auth.user);

  // States
  const [avatarUri, setAvatarUri] = useState(currentUser?.photoURL || null);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username ? currentUser.username.replace('@', '') : '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [selectedMood, setSelectedMood] = useState(currentUser?.mood || 'chill');
  
  // Username check states
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: true, message: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  // Ref for debouncer timer
  const debounceTimerRef = useRef(null);

  // Debounced check for username availability
  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!cleanUsername) {
      setUsernameStatus({ checking: false, available: false, message: 'Username cannot be empty.' });
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus({ checking: false, available: false, message: 'Minimum 3 characters required.' });
      return;
    }

    // If it's unchanged, no need to check availability online
    const originalUsername = currentUser?.username ? currentUser.username.replace('@', '').toLowerCase() : '';
    if (cleanUsername === originalUsername) {
      setUsernameStatus({ checking: false, available: true, message: 'Your current username.' });
      return;
    }

    setUsernameStatus({ checking: true, available: false, message: 'Checking availability...' });

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const check = await checkUsernameAvailable(cleanUsername);
        if (check.success) {
          if (check.available) {
            setUsernameStatus({ checking: false, available: true, message: 'Username is available!' });
          } else {
            setUsernameStatus({ checking: false, available: false, message: 'Username is already taken.' });
          }
        } else {
          setUsernameStatus({ checking: false, available: false, message: 'Could not check availability.' });
        }
      } catch (err) {
        setUsernameStatus({ checking: false, available: false, message: 'Could not check availability.' });
      }
    }, 500); // 500ms debounce delay

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [username, currentUser]);

  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access camera roll is required to select an avatar!');
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
      Alert.alert('Error', `Error picking image: ${error.message}`);
    }
  };

  const handleSaveChanges = async () => {
    if (!displayName.trim()) {
      Alert.alert('Missing Info', 'Please enter your name.');
      return;
    }

    if (!usernameStatus.available && username.trim().toLowerCase() !== (currentUser?.username ? currentUser.username.replace('@', '').toLowerCase() : '')) {
      Alert.alert('Unavailable Username', 'Please choose a valid and available username.');
      return;
    }

    setIsSaving(true);

    const cleanUsername = username.trim().toLowerCase();
    const updatePayload = {
      displayName: displayName.trim(),
      username: cleanUsername,
      photoURL: avatarUri || '',
      bio: bio.trim(),
      mood: selectedMood,
    };

    try {
      const result = await updateUserProfile(currentUser.uid, updatePayload);
      if (result.success) {
        // Dispatch updated profile details to Redux
        dispatch(setUser({
          ...currentUser,
          displayName: updatePayload.displayName,
          username: `@${cleanUsername}`,
          photoURL: result.data?.photoURL || avatarUri || '',
          bio: updatePayload.bio,
          mood: selectedMood,
        }));
        
        setIsSaving(false);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        setIsSaving(false);
        Alert.alert('Error', result.error || 'Failed to save changes. Please try again.');
      }
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error', error.message || 'Something went wrong while saving.');
    }
  };

  return (
    <View style={[
      styles.wrapper,
      {
        paddingTop: insets.top,
        paddingBottom: 0,
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
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerPlaceholder} />
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
                    <Ionicons name="person-circle-outline" size={50} color="#818cf8" />
                  )}
                </View>
                <View style={styles.plusButton}>
                  <Ionicons name="camera" size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>Change Profile Photo</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Field: Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter your name"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={30}
                  />
                </View>
              </View>

              {/* Field: Username */}
              <View style={styles.inputGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldLabel}>USERNAME</Text>
                  {usernameStatus.checking && <ActivityIndicator size="small" color="#818cf8" />}
                </View>
                <View style={[
                  styles.inputBox,
                  !usernameStatus.available && styles.inputBoxError,
                  usernameStatus.available && username && styles.inputBoxSuccess
                ]}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="username"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={username}
                    onChangeText={(val) => setUsername(val.replace(/[^a-zA-Z0-9_]/g, ''))} // only alphanumeric + underscore
                    autoCapitalize="none"
                    maxLength={20}
                  />
                </View>
                {usernameStatus.message ? (
                  <Text style={[
                    styles.statusMessage, 
                    usernameStatus.available ? styles.statusSuccess : styles.statusError
                  ]}>
                    {usernameStatus.message}
                  </Text>
                ) : null}
              </View>

              {/* Field: Bio */}
              <View style={styles.inputGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldLabel}>BIO</Text>
                  <Text style={styles.characterCounter}>{bio.length}/120</Text>
                </View>
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

              {/* Mood Status Picker */}
              <View style={styles.moodContainer}>
                <Text style={styles.fieldLabel}>SELECT CURRENT MOOD</Text>
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.moodScroll}
                >
                  {MOOD_OPTIONS.map((item) => {
                    // Match by label (lowercased) or direct match
                    const isSelected = selectedMood.toLowerCase() === item.label.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => setSelectedMood(item.label.toLowerCase())}
                        activeOpacity={0.7}
                        style={styles.moodItem}
                      >
                        <View style={[
                          styles.moodCircle,
                          isSelected && styles.moodCircleSelected
                        ]}>
                          <Text style={styles.moodEmoji}>{item.emoji}</Text>
                        </View>
                        <Text style={[
                          styles.moodLabel,
                          isSelected && styles.moodLabelSelected
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Curved Bottom Action Area - Moved inside scroll flow */}
            <View style={styles.bottomBarContainer}>
              <TouchableOpacity
                onPress={handleSaveChanges}
                activeOpacity={0.8}
                disabled={isSaving || usernameStatus.checking}
                style={styles.saveButtonTouch}
              >
                <LinearGradient
                  colors={['#818cf8', '#c084fc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#1e083c" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 0.5,
    ...FONTS.bold,
  },
  headerPlaceholder: {
    width: 40,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 2,
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
  avatarLabel: {
    marginTop: 10,
    fontSize: 13,
    color: '#818cf8',
    ...FONTS.bold,
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
    letterSpacing: 0.5,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  characterCounter: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    ...FONTS.medium,
  },
  inputBox: {
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 6,
  },
  inputBoxError: {
    borderColor: '#ef4444',
  },
  inputBoxSuccess: {
    borderColor: '#10b981',
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
  statusMessage: {
    fontSize: 12,
    marginTop: 6,
    paddingHorizontal: 4,
    ...FONTS.medium,
  },
  statusSuccess: {
    color: '#10b981',
  },
  statusError: {
    color: '#ef4444',
  },
  moodContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  moodScroll: {
    paddingVertical: 8,
  },
  moodItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 60,
  },
  moodCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  moodCircleSelected: {
    borderColor: '#818cf8',
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: '#818cf8',
    fontWeight: '600',
  },
  bottomBarContainer: {
    width: '100%',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonTouch: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e083c',
    letterSpacing: 0.5,
  },
});