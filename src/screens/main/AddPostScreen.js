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

import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { createPost } from '../../services/postService';
import { getUserCircles, createDefaultCircles } from '../../services/circleService';
import { generateAICaption } from '../../services/aiService';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import CustomAlertModal from '../../components/common/CustomAlertModal';

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

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // State Management
  const [selectedImage, setSelectedImage] = useState(null);
  const [vibeText, setVibeText] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('friends');
  const [songText, setSongText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // AI Caption State
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiCaptions, setAiCaptions] = useState(null); // { caption, hashtags, mood, alt_captions }

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    layout: 'horizontal'
  });

  const showAlert = (title, message, buttons, layout = 'horizontal') => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
      layout
    });
  };

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
    showAlert(
      'Select Image Source',
      'Choose how you want to add a photo to your post:',
      [
        {
          text: 'Take Photo',
          icon: 'camera-outline',
          onPress: () => launchImagePicker(true),
        },
        {
          text: 'Choose from Gallery',
          icon: 'image-outline',
          onPress: () => launchImagePicker(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          icon: 'close-outline',
        },
      ],
      'vertical'
    );
  };

  const launchImagePicker = async (useCamera) => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (useCamera && cameraPerm.status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera permission is required!' });
        return;
      }
      if (!useCamera && libraryPerm.status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Gallery permission is required!' });
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
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to pick image' });
    }
  };

  const handlePost = async () => {
    if (isPosting) return;

    if (!selectedImage) {
      Toast.show({ type: 'error', text1: 'Photo Required', text2: 'Please select or take a photo first!' });
      return;
    }

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
        Toast.show({ type: 'error', text1: 'Error', text2: 'Could not resolve the selected circle. Please try again.' });
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
        userId,
      };

      const response = await createPost(postPayload);
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Post shared successfully!' });
        setVibeText('');
        setSelectedImage(null);
        setAiCaptions(null);
        setSongText('');
        navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.HOME });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response.error || 'Failed to share post' });
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'An unexpected error occurred' });
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddSong = () => {
    if (songText) {
      setSongText('');
    } else {
      setSongText('Lo-Fi Chill Beats');
    }
  };

  // ✨ AI Caption Generator
  const handleGenerateAICaption = async () => {
    if (isAILoading) return;
    setIsAILoading(true);
    setAiCaptions(null);
    try {
      if (!selectedImage) {
        Toast.show({ type: 'error', text1: 'Photo Required', text2: 'Please select a photo first to generate a caption!' });
        setIsAILoading(false);
        return;
      }
      let base64Data = '';
      let mimeType = 'image/jpeg';
      let localUri = '';

      if (typeof selectedImage === 'number') {
        const assetModule = Image.resolveAssetSource(selectedImage);
        if (assetModule?.uri) {
          localUri = assetModule.uri;
        }
      } else if (selectedImage?.uri) {
        localUri = selectedImage.uri;
      }

      if (localUri) {
        if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
          try {
            const filename = localUri.split('/').pop()?.split('?')[0] || 'temp_asset.png';
            const tempFile = `${FileSystem.cacheDirectory}${filename}`;
            const downloadResult = await FileSystem.downloadAsync(localUri, tempFile).catch(() => null);
            if (downloadResult) {
              localUri = downloadResult.uri;
            }
          } catch (dlErr) {
            console.warn('Failed to download remote asset:', dlErr);
          }
        }

        const fileInfo = await FileSystem.getInfoAsync(localUri).catch(() => null);
        if (fileInfo?.exists) {
          base64Data = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
          const ext = localUri.split('.').pop()?.toLowerCase();
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'webp') mimeType = 'image/webp';
        }
      }

      if (!base64Data) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Could not read the selected image.' });
        setIsAILoading(false);
        return;
      }

      const circleType = circles.find(c => c.id === selectedCircle)?.label || 'Friends';
      const result = await generateAICaption(base64Data, mimeType, circleType);

      if (result.success && result.data) {
        setAiCaptions(result.data);
        // Auto-fill the first suggestion
        const hashtagStr = result.data.hashtags ? ' ' + result.data.hashtags.join(' ') : '';
        setVibeText(result.data.caption + hashtagStr);
      } else {
        Toast.show({ type: 'error', text1: 'AI Error', text2: result.error || 'Failed to generate caption.' });
      }
    } catch (error) {
      console.error('AI Caption error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Something went wrong generating the caption.' });
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 64}
    >
      <ImageBackground
        source={selectedImage || undefined}
        style={[styles.backgroundViewfinder]}
        resizeMode="cover"
      >
        {/* Dark subtle overlay for legibility */}
        <View style={styles.darkOverlay} />

        <View style={[
          styles.contentWrapper,
          {
            paddingTop: insets.top,
            paddingBottom: isKeyboardVisible ? 0 : insets.bottom + 80 // offset for navigation tabbar
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

          {/* Body Section with scrollable content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollBody}
          >
            <View style={{ marginTop: 24 }} />

            {!selectedImage && (
              <View style={styles.placeholderArea}>
                <Ionicons name="image-outline" size={48} color="rgba(255, 255, 255, 0.25)" />
                <Text style={styles.placeholderText}>No photo selected</Text>
                <Text style={styles.placeholderSubtext}>Tap the button below to select media</Text>
              </View>
            )}

            {/* Frosted Details Card */}
            <View style={styles.frostedCard}>
              <View style={styles.inputRow}>
                <Image
                  source={currentUser?.photoURL ? { uri: currentUser.photoURL } : require('../../../assets/default_avatar.png')}
                  style={styles.userAvatar}
                />
                <TextInput
                  placeholder="What's the vibe?"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.vibeInput}
                  multiline
                  value={vibeText}
                  onChangeText={setVibeText}
                />
                {/* AI Caption Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleGenerateAICaption}
                  disabled={isAILoading}
                  style={styles.aiCaptionBtn}
                >
                  {isAILoading ? (
                    <ActivityIndicator size="small" color="#a78bfa" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={16} color="#a78bfa" />
                      <Text style={styles.aiCaptionBtnText}>AI Caption</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* AI Caption Suggestions */}
              {aiCaptions && aiCaptions.alt_captions && aiCaptions.alt_captions.length > 0 && (
                <View style={styles.aiSuggestionsContainer}>
                  <Text style={styles.aiSuggestionsTitle}>✨ More suggestions:</Text>
                  {aiCaptions.alt_captions.map((alt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.aiSuggestionPill}
                      onPress={() => {
                        const hashtagStr = aiCaptions.hashtags ? ' ' + aiCaptions.hashtags.join(' ') : '';
                        setVibeText(alt + hashtagStr);
                      }}
                    >
                      <Text style={styles.aiSuggestionText} numberOfLines={2}>{alt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

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

            {/* Choose Circle section removed, defaults to Friends */}
          </ScrollView>

          {/* Bottom Action Area instead of presets gallery */}
          <View style={styles.bottomActionSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.selectPhotoButton}
              onPress={handleCameraThumbnailPress}
            >
              <LinearGradient
                colors={['#8b5cf6', '#4f6ef7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectPhotoGradient}
              >
                <Ionicons name="camera" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.selectPhotoText}>
                  {selectedImage ? 'Change Photo' : 'Select Photo / Take Photo'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* Song picker removed */}
      <CustomAlertModal
        visible={customAlert.visible}
        onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        layout={customAlert.layout}
      />
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
  aiCaptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginLeft: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  aiCaptionBtnText: {
    color: '#a78bfa',
    fontSize: 12,
    ...FONTS.bold,
    marginLeft: 4,
  },
  aiSuggestionsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.12)',
  },
  aiSuggestionsTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    ...FONTS.medium,
    marginBottom: 6,
  },
  aiSuggestionPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  aiSuggestionText: {
    color: '#e0d4ff',
    fontSize: 12,
    ...FONTS.regular,
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
  bottomActionSection: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(15, 4, 32, 0.85)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(167, 139, 250, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPhotoButton: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  selectPhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
  },
  selectPhotoText: {
    color: '#ffffff',
    fontSize: 15,
    ...FONTS.bold,
  },
  placeholderArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 16,
    ...FONTS.bold,
    marginTop: 8,
    opacity: 0.8,
  },
  placeholderSubtext: {
    color: COLORS.textMuted || '#a78bfa',
    fontSize: 12,
    ...FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
});