/**
 * AddPostScreen.js
 * 
 * High-fidelity, premium Post Creation Screen for VibeSpace.
 * Features:
 * - Top header with X button, centered "Post" title, and a gradient "Post" action button.
 * - Dynamic pre-selected image backdrop functioning as the viewfinder camera preview.
 * - Floating right action column with camera flip, flash, and timer controls.
 * - Glowing centered pill button: "🎵 Add a Song 🎵".
 * - Glassmorphic card overlay containing the user profile avatar, a text input field with "What's the vibe?",
 *   and a horizontal scrolling bar of interactive trend tags (#Mood, Chilling, Hustle, etc.).
 * - "Choose Circle" selector panel with dynamic selected ring indicator.
 * - Bottom gallery selection strip featuring a camera icon button and 6 actual image thumbnails.
 *   Tapping a thumbnail instantly updates the main viewfinder background image.
 */

import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { createPost } from '../../services/postService';
import { getUserCircles, createDefaultCircles } from '../../services/circleService';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';

const { width, height } = Dimensions.get('window');

// Gallery items copied from the brain artifacts
const GALLERY_IMAGES = [
  require('../../../assets/post_swirl.png'),
  require('../../../assets/post_workstation.png'),
  require('../../../assets/media__1779348639761.png'),
  require('../../../assets/media__1779348907328.png'),
  require('../../../assets/media__1779349699782.png'),
  require('../../../assets/media__1779349908803.png'),
  require('../../../assets/media__1779350518027.png'),
  require('../../../assets/media__1779350622091.png'),
];

const PRESET_TAGS = [
  { id: '1', label: '#Mood' },
  { id: '2', label: 'Chilling' },
  { id: '3', label: 'Hustle' },
  { id: '4', label: 'Vibes' },
  { id: '5', label: 'Coding' },
  { id: '6', label: 'Gaming' },
];

const PRESET_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', // post_swirl.png
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', // post_workstation.png
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800', // media__1779348639761.png
  'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=800', // media__1779348907328.png
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800', // media__1779349699782.png
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800', // media__1779349908803.png
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800', // media__1779350518027.png
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', // media__1779350622091.png
];

export default function AddPostScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const currentUser = useSelector((state) => state.auth.user);

  // State Management
  const [selectedImage, setSelectedImage] = useState(GALLERY_IMAGES[0]);
  const [vibeText, setVibeText] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('friends');
  const [songText, setSongText] = useState('Add a Song');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [cameraFacingFront, setCameraFacingFront] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const circles = [
    { id: 'friends', label: 'Friends', icon: 'people-outline', color: COLORS.circles.friends || '#10b981' },
    { id: 'family', label: 'Family', icon: 'heart-outline', color: COLORS.circles.family || '#3b82f6' },
    { id: 'work', label: 'Work', icon: 'briefcase-outline', color: COLORS.circles.work || '#f59e0b' },
    { id: 'secret', label: 'Secret', icon: 'lock-closed-outline', color: COLORS.circles.secret || '#ec4899' },
  ];

  const handleTagPress = (tagLabel) => {
    // Add tag to the text input
    if (vibeText.includes(tagLabel)) {
      return;
    }
    setVibeText(prev => prev ? `${prev} ${tagLabel}` : tagLabel);
  };

  const handleCameraThumbnailPress = () => {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to add a photo to your post:',
      [
        {
          text: '📷 Take Photo',
          onPress: () => launchImagePicker(true),
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => launchImagePicker(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const launchImagePicker = async (useCamera) => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (useCamera && cameraPerm.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required!');
        return;
      }
      if (!useCamera && libraryPerm.status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required!');
        return;
      }

      const pickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      };

      let result;
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(pickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        setSelectedImage({ uri: localUri });
      }
    } catch (error) {
      console.error('Error picking image for post:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePost = async () => {
    if (isPosting) return;

    setIsPosting(true);
    try {
      const userId = currentUser?.uid || 'vibe_user_dev';
      const userName = currentUser?.displayName || 'Aarav';
      const userAvatar = currentUser?.photoURL || '';

      // 1. Resolve circle ID from MongoDB
      let resolvedCircleId = null;
      try {
        const circlesRes = await getUserCircles(userId);
        if (circlesRes.success && circlesRes.data && circlesRes.data.length > 0) {
          const matchedCircle = circlesRes.data.find(
            c => c.type?.toLowerCase() === selectedCircle.toLowerCase()
          );
          if (matchedCircle) {
            resolvedCircleId = matchedCircle._id || matchedCircle.id;
          }
        }

        // If circle wasn't found (e.g. first user), create default circles
        if (!resolvedCircleId) {
          const initRes = await createDefaultCircles(userId);
          if (initRes.success && initRes.data && initRes.data.length > 0) {
            const matchedCircle = initRes.data.find(
              c => c.type?.toLowerCase() === selectedCircle.toLowerCase()
            );
            if (matchedCircle) {
              resolvedCircleId = matchedCircle._id || matchedCircle.id;
            } else {
              resolvedCircleId = initRes.data[0]._id || initRes.data[0].id;
            }
          }
        }
      } catch (circleError) {
        console.warn('Error resolving circle in post creation:', circleError);
      }

      if (!resolvedCircleId) {
        Alert.alert('Error', 'Could not resolve the selected circle. Please try again.');
        setIsPosting(false);
        return;
      }

      // 2. Resolve imageURL
      let imageURL = '';
      if (typeof selectedImage === 'number') {
        const imageIndex = GALLERY_IMAGES.indexOf(selectedImage);
        if (imageIndex !== -1 && imageIndex < PRESET_IMAGE_URLS.length) {
          imageURL = PRESET_IMAGE_URLS[imageIndex];
        } else {
          imageURL = PRESET_IMAGE_URLS[0];
        }
      } else if (selectedImage && selectedImage.uri) {
        imageURL = selectedImage.uri;
      }

      // 3. Create post payload
      const postPayload = {
        caption: vibeText,
        imageURL,
        circleId: resolvedCircleId,
        userName,
        userAvatar,
        userId
      };

      const response = await createPost(postPayload);
      if (response.success) {
        Alert.alert('Success', 'Post shared successfully!');
        navigation.navigate(SCREENS.HOME);
      } else {
        Alert.alert('Error', response.error || 'Failed to share post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddSong = () => {
    if (songText === 'Add a Song') {
      setSongText('🎵 Neon Nights - Lofi Beat 🎵');
    } else {
      setSongText('Add a Song');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ImageBackground 
        source={selectedImage} 
        style={[styles.backgroundViewfinder]}
        resizeMode="cover"
      >
        {/* Dark subtle overlay for legibility */}
        <View style={styles.darkOverlay} />

        <View style={[
          styles.contentWrapper,
          { 
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 80 // offset for navigation tabbar
          }
        ]}>
          <StatusBar barStyle="light-content" />

          {/* Top Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerIconButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Post</Text>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handlePost}
              style={styles.postButtonTouch}
              disabled={isPosting}
            >
              <LinearGradient
                colors={['#8b5cf6', '#4f6ef7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.postButtonGradient}
              >
                {isPosting ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ paddingHorizontal: 10 }} />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Camera Floating controls absolutely positioned over the viewfinder */}
          <View style={styles.floatingControlsContainer}>
            <TouchableOpacity 
              style={styles.controlCircle}
              onPress={() => setCameraFacingFront(!cameraFacingFront)}
            >
              <Ionicons name="sync-outline" size={20} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlCircle, isFlashOn && styles.controlCircleActive]}
              onPress={() => setIsFlashOn(!isFlashOn)}
            >
              <Ionicons name={isFlashOn ? "flash" : "flash-outline"} size={20} color={isFlashOn ? "#ffdf00" : "#ffffff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlCircle, isTimerActive && styles.controlCircleActive]}
              onPress={() => setIsTimerActive(!isTimerActive)}
            >
              <Ionicons name="stopwatch-outline" size={20} color={isTimerActive ? COLORS.primary : "#ffffff"} />
            </TouchableOpacity>
          </View>

          {/* Body Section with scrollable content */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Song Pill */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleAddSong}
              style={styles.songPill}
            >
              <Ionicons name="musical-notes-outline" size={16} color="#8b5cf6" style={{ marginRight: 6 }} />
              <Text style={styles.songPillText}>{songText}</Text>
            </TouchableOpacity>

            {/* Frosted Details Card */}
            <View style={styles.frostedCard}>
              <View style={styles.inputRow}>
                <Image source={require('../../../assets/aarav_avatar.png')} style={styles.userAvatar} />
                <TextInput
                  placeholder="What's the vibe?"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.vibeInput}
                  multiline
                  value={vibeText}
                  onChangeText={setVibeText}
                />
              </View>

              {/* Presets/Hashtags Row */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsContainer}
              >
                {PRESET_TAGS.map(tag => (
                  <TouchableOpacity 
                    key={tag.id} 
                    style={styles.tagCapsule}
                    onPress={() => handleTagPress(tag.label)}
                  >
                    <Text style={styles.tagText}>{tag.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Choose Circle Grid/Panel */}
            <View style={styles.circleSelectorPanel}>
              <Text style={styles.circlePanelTitle}>Choose Circle</Text>
              
              <View style={styles.circleRow}>
                {circles.map(circle => {
                  const isSelected = selectedCircle === circle.id;
                  return (
                    <TouchableOpacity
                      key={circle.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedCircle(circle.id)}
                      style={styles.circleItem}
                    >
                      <View style={[
                        styles.circleIconContainer, 
                        isSelected && { 
                          borderColor: circle.color, 
                          borderWidth: 1.5,
                          padding: 3
                        }
                      ]}>
                        <View style={[
                          styles.circleIconInner, 
                          { backgroundColor: `${circle.color}15` },
                          isSelected && {
                            borderColor: circle.color,
                            borderWidth: 1.5,
                            width: 40,
                            height: 40,
                            borderRadius: 20
                          }
                        ]}>
                          <Ionicons name={circle.icon} size={isSelected ? 18 : 22} color={circle.color} />
                        </View>
                      </View>
                      <Text style={[styles.circleLabel, isSelected && { color: circle.color, ...FONTS.bold }]}>
                        {circle.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Gallery Media Strip pinned to the bottom */}
          <View style={styles.gallerySection}>
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {/* Camera Trigger Thumbnail - dashed square outline */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.cameraThumbnail}
                onPress={handleCameraThumbnailPress}
              >
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>

              {/* Actual image list */}
              {GALLERY_IMAGES.map((img, index) => {
                const isSelected = selectedImage === img;
                return (
                  <TouchableOpacity 
                    key={index} 
                    activeOpacity={0.9}
                    onPress={() => setSelectedImage(img)}
                    style={[styles.galleryImageTouch, isSelected && styles.galleryImageSelected]}
                  >
                    <Image source={img} style={styles.galleryThumbnailImage} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backgroundViewfinder: {
    flex: 1,
    width: width,
    height: height,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 3, 20, 0.45)', // aesthetic dark blend
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacingMd || 16,
    backgroundColor: 'rgba(26, 5, 51, 0.35)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerIconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    ...FONTS.bold,
    color: '#ffffff',
  },
  postButtonTouch: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  postButtonGradient: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
  },
  scrollBody: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  floatingControlsContainer: {
    position: 'absolute',
    right: 16,
    top: 76, // push below the header
    zIndex: 100,
    alignItems: 'center',
  },
  controlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 5, 51, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  controlCircleActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.45)',
    borderColor: '#8b5cf6',
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  songPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: height * 0.1, // float in middle-upper
    marginBottom: 20,
    backdropFilter: 'blur(10px)',
  },
  songPillText: {
    color: '#ffffff',
    fontSize: 13,
    ...FONTS.bold,
  },
  frostedCard: {
    backgroundColor: 'rgba(45, 16, 84, 0.65)',
    borderRadius: SIZES.radiusLg || 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.18)',
    marginHorizontal: SIZES.spacingMd || 16,
    padding: 16,
    marginBottom: 16,
    backdropFilter: 'blur(15px)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  vibeInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    ...FONTS.regular,
    paddingTop: 8,
    minHeight: 48,
  },
  tagsContainer: {
    paddingVertical: 4,
  },
  tagCapsule: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderRadius: SIZES.radiusSm || 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.18)',
  },
  tagText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.medium,
  },
  circleSelectorPanel: {
    marginHorizontal: SIZES.spacingMd || 16,
    marginBottom: 20,
    backgroundColor: 'rgba(26, 5, 51, 0.45)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  circlePanelTitle: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 12,
    opacity: 0.8,
  },
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleItem: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  circleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  circleIconInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleLabel: {
    fontSize: 11,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.medium,
  },
  gallerySection: {
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 4, 32, 0.85)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(167, 139, 250, 0.18)',
  },
  galleryScroll: {
    paddingHorizontal: SIZES.spacingMd || 16,
  },
  cameraThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8, // dashed square outline
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(79, 110, 247, 0.08)',
  },
  galleryImageTouch: {
    width: 64,
    height: 64,
    borderRadius: 8, // square preview thumbnail matching mockup
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  galleryImageSelected: {
    borderColor: COLORS.primary || '#4f6ef7',
  },
  galleryThumbnailImage: {
    width: '100%',
    height: '100%',
  },
});