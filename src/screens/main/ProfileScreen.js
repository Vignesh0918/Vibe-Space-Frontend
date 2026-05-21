/**
 * ProfileScreen.js
 * 
 * High-fidelity, premium Profile Screen for VibeSpace.
 * Matches user Mockup 1:
 * - Cover banner photo showing cosmic blue/purple nebula.
 * - Circular avatar (Alex Vibe) with gold star spark badge overlay.
 * - Action buttons: "Edit Profile" pill button and a circular gear settings button.
 * - User metadata: "Alex Vibe", handle "@alex_digital_flow", and cosmic bio text.
 * - Border-bounded stats row: Posts (124), Circles (4.2k), Vibes (890).
 * - Interactive Tabs: POSTS, VIBES, TAGGED.
 * - 3x3 post grid featuring high-quality images and video overlays.
 */

import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 36) / 3; // 12 padding left/right, plus grid gaps

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('POSTS');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Local assets to render in the grid
  const postsGridData = [
    { id: '1', type: 'image', source: require('../../../assets/post_swirl.png') },
    { id: '2', type: 'image', source: require('../../../assets/cosmic_wave.png') },
    { id: '3', type: 'image', source: require('../../../assets/post_workstation.png') },
    { id: '4', type: 'image', source: require('../../../assets/media__1779349699782.png') },
    { id: '5', type: 'image', source: require('../../../assets/media__1779350719876.png') },
    { id: '6', type: 'video', source: require('../../../assets/concert_image.png') }, // video post
    { id: '7', type: 'image', source: require('../../../assets/media__1779351405157.png') },
    { id: '8', type: 'image', source: require('../../../assets/media__1779352220248.png') },
    { id: '9', type: 'image', source: require('../../../assets/media__1779352232448.png') },
  ];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => setIsDrawerOpen(true)}
      >
        <Ionicons name="menu" size={28} color="#ffffff" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>VibeSpace</Text>
      
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}
      >
        <Ionicons name="notifications-outline" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderGridItem = (item) => {
    return (
      <TouchableOpacity 
        key={item.id}
        activeOpacity={0.9}
        style={styles.gridItem}
        onPress={() => alert(`Clicked post ${item.id}`)}
      >
        <Image source={item.source} style={styles.gridImage} />
        {item.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={32} color="#ffffff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 80 // offset for navigation tabbar
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image 
            source={require('../../../assets/cosmic_wave.png')} 
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>

        {/* Profile Details Overlay Area */}
        <View style={styles.profileActionRow}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarInner}>
              <Image 
                source={require('../../../assets/aarav_avatar.png')} 
                style={styles.avatarImage} 
              />
            </View>
            {/* Gold spark badge on bottom right */}
            <View style={styles.sparkBadge}>
              <Text style={styles.sparkText}>✨</Text>
            </View>
          </View>

          {/* Action buttons on the right of avatar */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.editProfileButton}
              onPress={() => navigation.navigate(SCREENS.EDIT_PROFILE)}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.settingsButton}
              onPress={() => navigation.navigate(SCREENS.SETTINGS)}
            >
              <Ionicons name="settings-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Names and Bio */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.profileName}>Alex Vibe</Text>
          <Text style={styles.profileHandle}>@alex_digital_flow</Text>
          <Text style={styles.profileBio}>
            Curating the future of digital aesthetics. Late night dreamer, neon seeker, and circle leader. 🌌✨
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>124</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>4.2k</Text>
            <Text style={styles.statLabel}>Circles</Text>
          </View>
          <View style={styles.statColumn}>
            <Text style={styles.statNumber}>890</Text>
            <Text style={styles.statLabel}>Vibes</Text>
          </View>
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'POSTS' && styles.activeTabButton]}
            onPress={() => setActiveTab('POSTS')}
          >
            <Text style={[styles.tabText, activeTab === 'POSTS' && styles.activeTabText]}>
              POSTS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'VIBES' && styles.activeTabButton]}
            onPress={() => setActiveTab('VIBES')}
          >
            <Text style={[styles.tabText, activeTab === 'VIBES' && styles.activeTabText]}>
              VIBES
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'TAGGED' && styles.activeTabButton]}
            onPress={() => setActiveTab('TAGGED')}
          >
            <Text style={[styles.tabText, activeTab === 'TAGGED' && styles.activeTabText]}>
              TAGGED
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Grid Content */}
        {activeTab === 'POSTS' ? (
          <View style={styles.gridContainer}>
            {postsGridData.map(renderGridItem)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'VIBES' ? 'flame-outline' : 'pricetag-outline'} 
              size={48} 
              color="rgba(255,255,255,0.15)" 
            />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} to display</Text>
          </View>
        )}
      </ScrollView>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0212', // Premium deep night background
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#0a0212',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: 0.5,
    ...FONTS.bold,
  },
  coverContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#1b082e',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: -50,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#0a0212',
    overflow: 'hidden',
    backgroundColor: '#2d1054',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  sparkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#eab308', // Gold yellow badge
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0212',
  },
  sparkText: {
    fontSize: 12,
  },
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editProfileButton: {
    backgroundColor: '#818cf8', // Lavender/periwinkle color
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  editProfileText: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  profileName: {
    fontSize: 25,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 2,
  },
  profileHandle: {
    fontSize: 14,
    color: '#b0a2c7',
    ...FONTS.medium,
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    ...FONTS.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginTop: 20,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#a092b7',
    ...FONTS.medium,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#a78bfa', // Lavender active line
  },
  tabText: {
    fontSize: 13,
    color: '#7a6d8d',
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#ffffff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 2,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1b082e',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7a6d8d',
    ...FONTS.medium,
  },
});