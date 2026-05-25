/**
 * HomeScreen.js
 * 
 * High-fidelity, premium Home Feed Screen for VibeSpace.
 * Features:
 * - Top header with hamburger menu, VibeSpace logo, notifications bell, and messages icon.
 * - Horizontal Stories view with glowing gradient border rings and a dashed "+ Your Story" container.
 * - Vertical Post Feed showing card designs with circle-specific color badges, high-fidelity mock images,
 *   a fully interactive emoji reaction capsule, share/comment counters, and stylized hashtags.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { createStory, getCircleStories } from '../../services/storyService';
import { getUserCircles, createDefaultCircles } from '../../services/circleService';
import { getHomeFeed } from '../../services/postService';
import formatTime from '../../utils/formatTime';
import EmptyState from '../../components/common/EmptyState';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';

const { width } = Dimensions.get('window');

const FALLBACK_STORIES = [
  { id: '1', name: 'Your Story', avatar: null, isUser: true },
  { id: '2', name: 'Aarav', avatar: require('../../../assets/aarav_avatar.png'), borderColors: ['#8b5cf6', '#4f6ef7'] },
  { id: '3', name: 'Priya', avatar: require('../../../assets/priya_avatar.png'), borderColors: ['#ec4899', '#8b5cf6'] },
  { id: '4', name: 'Ishaan', avatar: require('../../../assets/arjun_avatar.png'), borderColors: ['#10b981', '#4f6ef7'] },
];

const FALLBACK_POSTS = [
  {
    id: 'post1',
    user: {
      name: 'Aarav Sharma',
      avatar: require('../../../assets/aarav_avatar.png'),
      circle: 'FRIENDS',
      circleColor: '#8b5cf6',
    },
    image: require('../../../assets/post_swirl.png'),
    caption: 'Exploring the new digital frontiers. Loving the energy in the circles today!\n#VibeSpace #DigitalNomad',
    time: '2h ago',
    reactions: ['🔥', '❤️', '😮'],
    reactionCount: '4.2k',
    hasReacted: false,
    commentsCount: 128,
  },
  {
    id: 'post2',
    user: {
      name: 'Priya Kapoor',
      avatar: require('../../../assets/priya_avatar.png'),
      circle: 'CREATIVES',
      circleColor: '#ec4899',
    },
    image: require('../../../assets/post_workstation.png'),
    caption: 'Late night setups just hit different. Finally finished the new workstation! 💻✨',
    time: '5h ago',
    reactions: ['🔥', '😂', '❤️'],
    reactionCount: '856',
    hasReacted: true,
    commentsCount: 42,
  }
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // States
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // API loading states
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [lastPostId, setLastPostId] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Story action sheet animated state
  const [isStorySheetOpen, setIsStorySheetOpen] = useState(false);
  const storySheetAnim = useRef(new Animated.Value(300)).current;
  
  const isFetchingRef = useRef(false);

  const currentUser = useSelector((state) => state.auth.user);

  // Load content
  const loadStories = async () => {
    setStoriesLoading(true);
    try {
      if (!currentUser?.uid) {
        setStories([FALLBACK_STORIES[0]]);
        return;
      }
      const circlesRes = await getUserCircles(currentUser.uid);
      if (circlesRes.success && circlesRes.data) {
        const circleIds = circlesRes.data.map(c => c._id || c.id);
        const storiesRes = await getCircleStories(circleIds);
        if (storiesRes.success && storiesRes.data) {
          const mappedStories = storiesRes.data.map(group => ({
            id: group.userId,
            name: group.userName,
            avatar: group.userAvatar ? { uri: group.userAvatar } : require('../../../assets/aarav_avatar.png'),
            borderColors: ['#8b5cf6', '#4f6ef7'],
            mediaUrl: group.stories[0]?.mediaUrl || '',
            stories: group.stories || [],
            isOwn: group.userId === currentUser?.uid
          }));
          
          setStories([
            { id: 'user_story', name: 'Your Story', avatar: currentUser.photoURL ? { uri: currentUser.photoURL } : null, isUser: true },
            ...mappedStories
          ]);
        } else {
          setStories([
            { id: 'user_story', name: 'Your Story', avatar: currentUser.photoURL ? { uri: currentUser.photoURL } : null, isUser: true }
          ]);
        }
      } else {
        setStories([
          { id: 'user_story', name: 'Your Story', avatar: currentUser.photoURL ? { uri: currentUser.photoURL } : null, isUser: true }
        ]);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setStories([
        { id: 'user_story', name: 'Your Story', avatar: currentUser?.photoURL ? { uri: currentUser.photoURL } : null, isUser: true }
      ]);
    } finally {
      setStoriesLoading(false);
    }
  };

  const loadFeed = async (isInitial = true, isRefresh = false) => {
    if (isFetchingRef.current && !isInitial && !isRefresh) {
      return;
    }
    isFetchingRef.current = true;

    if (isInitial) {
      setPostsLoading(true);
    } else if (isRefresh) {
      setPostsRefreshing(true);
    }
    
    try {
      if (!currentUser?.uid) {
        setPosts(FALLBACK_POSTS);
        setPostsLoading(false);
        setPostsRefreshing(false);
        return;
      }
      
      const circlesRes = await getUserCircles(currentUser.uid);
      if (circlesRes.success && circlesRes.data) {
        const circleIds = circlesRes.data.map(c => c._id || c.id);
        const startId = isInitial || isRefresh ? null : lastPostId;
        
        if (!isInitial && !isRefresh && !hasMorePosts) {
          setPostsLoading(false);
          return;
        }

        const feedRes = await getHomeFeed(circleIds, startId, 10);
        if (feedRes.success && feedRes.data) {
          const { posts: apiPosts, lastDoc } = feedRes.data;
          
          const mappedPosts = apiPosts.map(post => {
            let circleColor = '#8b5cf6';
            const cType = post.circleId?.toLowerCase();
            if (COLORS.circles && COLORS.circles[cType]) {
              circleColor = COLORS.circles[cType];
            }

            return {
              id: post.id || post._id,
              user: {
                name: post.userName,
                avatar: post.userAvatar ? { uri: post.userAvatar } : require('../../../assets/aarav_avatar.png'),
                circle: post.circleId?.toUpperCase() || 'FRIENDS',
                circleColor: circleColor
              },
              image: post.imageURL ? { uri: post.imageURL } : require('../../../assets/post_swirl.png'),
              caption: post.caption || '',
              time: formatTime(post.createdAt),
              reactions: ['🔥', '❤️', '😮'],
              reactionCount: Object.values(post.reactions || {}).flat().length.toString(),
              hasReacted: Object.values(post.reactions || {}).flat().includes(currentUser.uid),
              commentsCount: post.commentsCount || 0
            };
          });

          if (isInitial || isRefresh) {
            setPosts(mappedPosts);
          } else {
            setPosts(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const uniqueNewPosts = mappedPosts.filter(p => !existingIds.has(p.id));
              return [...prev, ...uniqueNewPosts];
            });
          }

          setLastPostId(lastDoc);
          setHasMorePosts(!!lastDoc && apiPosts.length === 10);
        } else {
          if (isInitial || isRefresh) {
            setPosts(FALLBACK_POSTS);
          }
        }
      } else {
        if (isInitial || isRefresh) {
          setPosts(FALLBACK_POSTS);
        }
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      if (isInitial || isRefresh) {
        setPosts(FALLBACK_POSTS);
      }
    } finally {
      setPostsLoading(false);
      setPostsRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!currentUser?.uid) return;

    loadStories();
    loadFeed(true);

    const unsubscribe = navigation.addListener('focus', () => {
      loadStories();
      loadFeed(true, true);
    });

    return unsubscribe;
  }, [navigation, currentUser?.uid]);

  const openStorySheet = () => {
    setIsStorySheetOpen(true);
    Animated.timing(storySheetAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeStorySheet = (callback) => {
    Animated.timing(storySheetAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsStorySheetOpen(false);
      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  const handleAddStory = () => {
    openStorySheet();
  };

  const handleSelectOption = (useCamera) => {
    closeStorySheet(() => {
      launchStoryPicker(useCamera);
    });
  };

  const launchStoryPicker = async (useCamera) => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (useCamera && cameraPerm.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Camera permission is required to share a story from your camera. Would you like to pick a photo from your Gallery instead?',
          [
            {
              text: 'Open Gallery',
              onPress: () => launchStoryPicker(false),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      } else if (!useCamera && libraryPerm.status !== 'granted') {
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
        try {
          result = await ImagePicker.launchCameraAsync(pickerOptions);
        } catch (camError) {
          console.warn('Camera launch failed, falling back to gallery picker:', camError);
          result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
        }
      } else {
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        await uploadAndCreateStory(localUri);
      }
    } catch (error) {
      console.error('Error launching image picker:', error);
      Alert.alert('Error', 'Failed to open camera/gallery');
    }
  };

  const uploadAndCreateStory = async (localUri) => {
    setIsUploadingStory(true);
    try {
      const userId = currentUser?.uid || 'vibe_user_dev';
      const userName = currentUser?.displayName || 'Aarav';
      const userAvatar = currentUser?.photoURL || '';

      // Resolve the real MongoDB ObjectID for the user's Friends circle
      let targetCircleId = 'friends';
      try {
        const circlesRes = await getUserCircles(userId);
        if (circlesRes.success && circlesRes.data && circlesRes.data.length > 0) {
          const friendsCircle = circlesRes.data.find(
            c => c.name?.toLowerCase() === 'friends' || c.type?.toLowerCase() === 'friends'
          );
          if (friendsCircle) {
            targetCircleId = friendsCircle._id || friendsCircle.id;
          } else {
            targetCircleId = circlesRes.data[0]._id || circlesRes.data[0].id;
          }
        } else {
          // If no circles exist, create default circles
          const initRes = await createDefaultCircles(userId);
          if (initRes.success && initRes.data && initRes.data.length > 0) {
            const friendsCircle = initRes.data.find(
              c => c.name?.toLowerCase() === 'friends' || c.type?.toLowerCase() === 'friends'
            );
            if (friendsCircle) {
              targetCircleId = friendsCircle._id || friendsCircle.id;
            } else {
              targetCircleId = initRes.data[0]._id || initRes.data[0].id;
            }
          }
        }
      } catch (circleError) {
        console.warn('Failed resolving user circles for story, using fallback:', circleError);
      }

      const storyPayload = {
        userId,
        userName,
        userAvatar,
        mediaUrl: localUri,
        circleId: targetCircleId,
      };

      const response = await createStory(storyPayload);

      if (response.success) {
        Alert.alert('Success', 'Story shared successfully!');
        loadStories();
      } else {
        Alert.alert('Error', response.error || 'Failed to publish story');
      }
    } catch (error) {
      console.error('Failed to create story:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handleReactionPress = (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          const hasReacted = !post.hasReacted;
          let count = parseInt(post.reactionCount) || 0;
          if (isNaN(count)) {
            if (post.reactionCount === '4.2k') {
              return { ...post, hasReacted, reactionCount: hasReacted ? '4.3k' : '4.2k' };
            }
            if (post.reactionCount === '856') {
              return { ...post, hasReacted, reactionCount: hasReacted ? '857' : '856' };
            }
            count = 0;
          }
          const nextCount = hasReacted ? count + 1 : Math.max(0, count - 1);
          return {
            ...post,
            hasReacted,
            reactionCount: String(nextCount)
          };
        }
        return post;
      })
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => setIsDrawerOpen(true)}
      >
        <Ionicons name="menu" size={28} color="#ffffff" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>VibeSpace</Text>
      
      <View style={styles.headerRightContainer}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.SEARCH })}
        >
          <Ionicons name="search-outline" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.headerButton, { marginLeft: 12 }]}
          onPress={() => navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.NOTIFICATIONS })}
        >
          <View style={styles.notificationWrapper}>
            <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            <View style={styles.smallIndicator} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.headerButton, { marginLeft: 12 }]}
          onPress={() => navigation.navigate(SCREENS.CHATS_TAB, { screen: SCREENS.CHAT_LIST })}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStories = () => (
    <View style={styles.storiesSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
      >
        {stories.map((item) => {
          if (item.isUser) {
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.storyWrapper} 
                onPress={handleAddStory}
                disabled={isUploadingStory}
              >
                <View style={styles.userStoryOuter}>
                  <View style={styles.userStoryInner}>
                    {isUploadingStory ? (
                      <ActivityIndicator size="small" color="#8b5cf6" />
                    ) : (
                      <Ionicons name="add" size={24} color="#8b5cf6" />
                    )}
                  </View>
                </View>
                <Text style={styles.storyName}>
                  {isUploadingStory ? 'Uploading...' : item.name}
                </Text>
              </TouchableOpacity>
            );
          }

          const imageSource = typeof item.avatar === 'number' || (item.avatar && typeof item.avatar === 'object')
            ? item.avatar
            : { uri: item.avatar || 'https://via.placeholder.com/150' };

          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.storyWrapper}
              onPress={() => navigation.navigate(SCREENS.STORY_VIEWER, { 
                storyUser: item.name,
                storyAvatar: item.avatar,
                storyMediaUrl: item.mediaUrl,
                allStories: item.stories || [],
                isOwnStory: item.isOwn || false,
                storyId: item.stories?.[0]?.id || null
              })}
            >
              <LinearGradient
                colors={item.borderColors}
                style={styles.storyRingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.storyImageContainer}>
                  <Image source={imageSource} style={styles.storyAvatar} />
                </View>
              </LinearGradient>
              <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
        {storiesLoading && (
          <View style={{ justifyContent: 'center', paddingHorizontal: 20 }}>
            <ActivityIndicator size="small" color={COLORS.primary || '#8b5cf6'} />
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderPostItem = ({ item }) => {
    return (
      <View style={[styles.postCard, SHADOWS.small]}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <Image source={item.user.avatar} style={styles.postAvatar} />
            <View style={styles.postInfo}>
              <Text style={styles.postUserName}>{item.user.name}</Text>
              <View style={[styles.badgeContainer, { backgroundColor: `${item.user.circleColor}20`, borderColor: item.user.circleColor }]}>
                <Text style={[styles.badgeText, { color: item.user.circleColor }]}>{item.user.circle}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => alert('Post options')}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted || '#a78bfa'} />
          </TouchableOpacity>
        </View>

        {/* Post Image */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate(SCREENS.POST_DETAIL, { postId: item.id })}
          style={styles.postImageWrapper}
        >
          <Image source={item.image} style={styles.postImage} resizeMode="cover" />
        </TouchableOpacity>

        {/* Interaction row */}
        <View style={styles.interactionRow}>
          {/* Reaction Capsule Pill */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleReactionPress(item.id)}
            style={[
              styles.reactionCapsule, 
              item.hasReacted && styles.reactionCapsuleActive
            ]}
          >
            <View style={styles.reactionEmojis}>
              {item.reactions.map((emoji, index) => (
                <Text key={index} style={[styles.reactionEmoji, { zIndex: 10 - index }]}>{emoji}</Text>
              ))}
            </View>
            <Text style={[styles.reactionCountText, item.hasReacted && styles.reactionCountActiveText]}>
              {item.reactionCount}
            </Text>
          </TouchableOpacity>

          {/* Right Actions (Comments, Share) */}
          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate(SCREENS.POST_DETAIL, { postId: item.id })}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#ffffff" />
              <Text style={styles.actionText}>{item.commentsCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { marginLeft: 16 }]} onPress={() => alert('Shared')}>
              <Ionicons name="share-social-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            {item.caption}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 80
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}
      
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderStories}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedScroll}
        ListEmptyComponent={
          !postsLoading && (
            <EmptyState 
              title="No posts yet" 
              description="Follow some circles to see posts on your feed!" 
              icon="🖼️" 
            />
          )
        }
        ListFooterComponent={
          postsLoading && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary || '#8b5cf6'} />
            </View>
          )
        }
        onEndReached={() => loadFeed(false)}
        onEndReachedThreshold={0.3}
        refreshing={postsRefreshing}
        onRefresh={() => {
          loadStories();
          loadFeed(true, true);
        }}
      />
      
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Story Selection Action Sheet Modal */}
      <Modal
        visible={isStorySheetOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeStorySheet()}
      >
        <TouchableWithoutFeedback onPress={() => closeStorySheet()}>
          <View style={styles.sheetBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.sheetContent,
                  {
                    transform: [{ translateY: storySheetAnim }]
                  }
                ]}
              >
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetIndicator} />
                  <Text style={styles.sheetTitle}>Share Story</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.sheetOption}
                  onPress={() => handleSelectOption(true)}
                >
                  <Ionicons name="camera-outline" size={22} color="#ffffff" style={styles.sheetOptionIcon} />
                  <Text style={styles.sheetOptionText}>📷 Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sheetOption}
                  onPress={() => handleSelectOption(false)}
                >
                  <Ionicons name="images-outline" size={22} color="#ffffff" style={styles.sheetOptionIcon} />
                  <Text style={styles.sheetOptionText}>🖼️ Choose from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sheetOption, styles.sheetOptionLast]}
                  onPress={() => closeStorySheet()}
                >
                  <Ionicons name="close-circle-outline" size={22} color={COLORS.danger || '#ef4444'} style={styles.sheetOptionIcon} />
                  <Text style={[styles.sheetOptionText, { color: COLORS.danger || '#ef4444' }]}>❌ Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#1a0533',
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacingMd || 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.4)', // Slightly transparent borders
  },
  headerTitle: {
    fontSize: 22,
    ...FONTS.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(139, 92, 246, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  headerButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationWrapper: {
    position: 'relative',
  },
  smallIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger || '#ef4444',
    borderWidth: 1.5,
    borderColor: COLORS.background || '#1a0533',
  },
  storiesSection: {
    paddingVertical: SIZES.spacingMd || 16,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(76, 40, 133, 0.3)',
  },
  storiesContainer: {
    paddingHorizontal: SIZES.spacingMd || 16,
  },
  storyWrapper: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  userStoryOuter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  userStoryInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(45, 16, 84, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingGradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  storyImageContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: COLORS.background || '#1a0533',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
  },
  storyName: {
    fontSize: 11,
    color: '#ffffff',
    ...FONTS.medium,
    textAlign: 'center',
    opacity: 0.9,
  },
  feedScroll: {
    paddingBottom: 24,
  },
  postCard: {
    backgroundColor: COLORS.card || '#2d1054',
    borderRadius: SIZES.radiusLg || 16,
    marginHorizontal: SIZES.spacingMd || 16,
    marginTop: SIZES.spacingMd || 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.spacingMd || 16,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  postInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserName: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
    marginRight: 8,
  },
  badgeContainer: {
    borderWidth: 1,
    borderRadius: SIZES.radiusSm || 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 9,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  postImageWrapper: {
    width: '100%',
    height: 280,
    backgroundColor: '#0a0314',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacingMd || 16,
    paddingVertical: 12,
  },
  reactionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  reactionCapsuleActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  reactionEmojis: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  reactionEmoji: {
    fontSize: 13,
    marginRight: -4,
  },
  reactionCountText: {
    fontSize: 12,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.bold,
  },
  reactionCountActiveText: {
    color: '#ffffff',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.bold,
    marginLeft: 6,
  },
  captionContainer: {
    paddingHorizontal: SIZES.spacingMd || 16,
    paddingBottom: 16,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
    ...FONTS.regular,
  },
  captionUser: {
    ...FONTS.bold,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted || '#a78bfa',
    marginTop: 6,
    opacity: 0.7,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: COLORS.card || '#2d1054',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderBottomWidth: 0,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
    opacity: 0.8,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.15)',
  },
  sheetOptionLast: {
    borderBottomWidth: 0,
  },
  sheetOptionIcon: {
    marginRight: 12,
  },
  sheetOptionText: {
    fontSize: 16,
    ...FONTS.medium,
    color: '#ffffff',
  },
});