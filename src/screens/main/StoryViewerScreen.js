/**
 * StoryViewerScreen.js
 *
 * Full-screen Story/Vibe Viewer for VibeSpace matching the premium reference mockup.
 * Features:
 * - Animated story progress bars at top (segmented for multiple stories).
 * - User avatar, username, time + location label overlay.
 * - Full-bleed story image covering entire screen.
 * - Tap left/right halves to go previous/next story.
 * - "Trending in Circles" badge pill.
 * - Bottom input bar: "Send a vibe...", heart button, gradient send button.
 * - Close (X) button top-right.
 * - Auto-advances after STORY_DURATION ms.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SHADOWS } from '../../constants/theme';
import { getStoryViewers, markStoryViewed } from '../../services/storyService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_DURATION = 6000; // ms per story slide
const PROGRESS_BAR_GAP = 4;

/* ------------------------------------------------------------------ */
/*  Mock Story Data                                                     */
/* ------------------------------------------------------------------ */

const STORIES_DATA = [
  {
    user: {
      name: 'Aaryan_Vibes',
      avatar: require('../../../assets/aarav_avatar.png'),
    },
    slides: [
      {
        id: 's1',
        image: require('../../../assets/cosmic_wave.png'),
        time: '2h ago',
        location: 'Mumbai',
        trending: true,
      },
      {
        id: 's2',
        image: require('../../../assets/post_swirl.png'),
        time: '1h ago',
        location: 'Mumbai',
        trending: false,
      },
      {
        id: 's3',
        image: require('../../../assets/post_workstation.png'),
        time: '45m ago',
        location: 'Mumbai',
        trending: true,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const params = route.params || {};
  const currentUser = useSelector(state => state.auth.user);

  // Determine slides from either allStories, storyMediaUrl, or fallback STORIES_DATA
  let story = null;
  if (params.allStories && params.allStories.length > 0) {
    story = {
      user: {
        name: params.storyUser || 'You',
        avatar: params.storyAvatar || require('../../../assets/aarav_avatar.png'),
      },
      slides: params.allStories.map((s, index) => {
        let formattedTime = 'Just now';
        if (s.createdAt) {
          const diff = new Date() - new Date(s.createdAt);
          const minutes = Math.floor(diff / 60000);
          const hours = Math.floor(minutes / 60);
          if (minutes < 1) {
            formattedTime = 'Just now';
          } else if (minutes < 60) {
            formattedTime = `${minutes}m ago`;
          } else if (hours < 24) {
            formattedTime = `${hours}h ago`;
          } else {
            formattedTime = `${Math.floor(hours / 24)}d ago`;
          }
        }
        return {
          id: s._id || s.id || `slide_${index}`,
          image: typeof s.mediaUrl === 'string' ? { uri: s.mediaUrl } : s.mediaUrl,
          time: formattedTime,
          location: s.location || 'Circles',
          trending: s.trending || false,
        };
      })
    };
  } else if (params.storyMediaUrl) {
    story = {
      user: {
        name: params.storyUser || 'You',
        avatar: params.storyAvatar || require('../../../assets/aarav_avatar.png'),
      },
      slides: [
        {
          id: 'custom_slide',
          image: typeof params.storyMediaUrl === 'string' ? { uri: params.storyMediaUrl } : params.storyMediaUrl,
          time: 'Just now',
          location: 'Mumbai',
          trending: false
        }
      ]
    };
  } else {
    story = STORIES_DATA[0];
  }

  // Current story set and slide index
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  const slide = story.slides[slideIndex];
  const totalSlides = story.slides.length;

  // Animated progress for current bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });
  }, [slideIndex]);

  useEffect(() => {
    if (!isPaused) {
      startProgress();
    }
    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [slideIndex, isPaused]);

  // Fetch viewer count when viewing own story
  useEffect(() => {
    const fetchViewers = async () => {
      if (slide?.id && slide.id !== 'custom_slide') {
        const result = await getStoryViewers(slide.id);
        if (result.success) {
          setViewerCount(result.totalViews || 0);
        }
      }
    };
    if (params.isOwnStory) {
      fetchViewers();
    }
  }, [slide?.id]);

  // Mark story as viewed when watching someone else's story
  useEffect(() => {
    const markViewed = async () => {
      if (slide?.id && slide.id !== 'custom_slide' && !params.isOwnStory) {
        if (currentUser?.uid) {
          await markStoryViewed(slide.id, currentUser.uid);
        }
      }
    };
    markViewed();
  }, [slide?.id]);

  const goNext = () => {
    if (slideIndex < totalSlides - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      navigation.goBack();
    }
  };

  const goPrev = () => {
    if (slideIndex > 0) {
      setSlideIndex((prev) => prev - 1);
    }
  };

  const handleTap = (evt) => {
    const touchX = evt.nativeEvent.locationX;
    if (touchX < SCREEN_W / 3) {
      goPrev();
    } else {
      goNext();
    }
  };

  const handleLongPressIn = () => {
    setIsPaused(true);
    if (animRef.current) animRef.current.stop();
  };

  const handleLongPressOut = () => {
    setIsPaused(false);
  };

  /* ---------- Progress Bars ---------- */

  const renderProgressBars = () => {
    const barWidth =
      (SCREEN_W - 32 - PROGRESS_BAR_GAP * (totalSlides - 1)) / totalSlides;

    return (
      <View style={[styles.progressContainer, { marginTop: insets.top + 8 }]}>
        {story.slides.map((_, i) => {
          const filled = i < slideIndex;
          const isActive = i === slideIndex;

          return (
            <View
              key={i}
              style={[
                styles.progressTrack,
                { width: barWidth, marginRight: i < totalSlides - 1 ? PROGRESS_BAR_GAP : 0 },
              ]}
            >
              {filled ? (
                <View style={[styles.progressFill, { width: '100%' }]} />
              ) : isActive ? (
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  /* ---------- User Info Overlay ---------- */

  const renderUserInfo = () => (
    <View style={[styles.userInfoRow]}>
      <View style={styles.userInfoLeft}>
        <View style={styles.storyAvatarRing}>
          <Image source={typeof story.user.avatar === 'number' || (story.user.avatar && story.user.avatar.uri) ? story.user.avatar : { uri: story.user.avatar || 'https://via.placeholder.com/150' }} style={styles.storyAvatar} />
        </View>
        <View style={styles.userTextCol}>
          <Text style={styles.userName}>{story.user.name}</Text>
          <Text style={styles.userMeta}>
            {slide.time} • {slide.location}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.closeBtn}
      >
        <Ionicons name="close" size={26} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  /* ---------- Bottom Bar ---------- */

  const renderBottomBar = () => (
    <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
      {/* Viewers count badge (only on own stories) */}
      {params.isOwnStory && viewerCount > 0 && (
        <View style={styles.viewersBadge}>
          <Ionicons name="eye-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.viewersText}>
            {viewerCount} {viewerCount === 1 ? 'view' : 'views'}
          </Text>
        </View>
      )}

      {/* Trending badge */}
      {slide.trending && (
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingEmoji}>🔥</Text>
          <Text style={styles.trendingText}>Trending in Circles</Text>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <View style={styles.replyWrapper}>
          <TextInput
            style={styles.replyInput}
            placeholder="Send a vibe..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={replyText}
            onChangeText={setReplyText}
            onFocus={() => {
              setIsPaused(true);
              if (animRef.current) animRef.current.stop();
            }}
            onBlur={() => setIsPaused(false)}
          />
        </View>

        <TouchableOpacity style={styles.heartBtn} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.sendOuter}>
          <LinearGradient
            colors={['#8b5cf6', '#4f6ef7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendGradient}
          >
            <Ionicons name="send" size={16} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ---------- Main Render ---------- */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen story image */}
      <Image
        source={slide.image}
        style={styles.storyImage}
        resizeMode="cover"
      />

      {/* Dark overlay for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
        locations={[0, 0.2, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Tap zones */}
      <TouchableWithoutFeedback
        onPress={handleTap}
        onPressIn={handleLongPressIn}
        onPressOut={handleLongPressOut}
        delayLongPress={300}
      >
        <View style={StyleSheet.absoluteFillObject} />
      </TouchableWithoutFeedback>

      {/* Top UI */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        {renderProgressBars()}
        {renderUserInfo()}
      </View>

      {/* Bottom UI */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        {renderBottomBar()}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: SCREEN_H,
  },

  /* ---------- Top Overlay ---------- */
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  /* Progress bars */
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: '#ffffff',
  },

  /* User Info */
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storyAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  storyAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  userTextCol: {},
  userName: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
  },
  userMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    ...FONTS.regular,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------- Bottom Overlay ---------- */
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  /* Trending */
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 12, 50, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  trendingEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  trendingText: {
    fontSize: 13,
    ...FONTS.medium,
    color: '#ffffff',
  },

  /* Input row */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyWrapper: {
    flex: 1,
    backgroundColor: 'rgba(50, 25, 80, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 18,
    height: 44,
    justifyContent: 'center',
  },
  replyInput: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
  },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(50, 25, 80, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  sendOuter: {
    marginLeft: 8,
    borderRadius: 21,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  sendGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Viewers badge */
  viewersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 12, 50, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  viewersText: {
    color: '#ffffff',
    fontSize: 13,
    ...FONTS.medium,
  },
});