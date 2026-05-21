/**
 * SearchScreen.js
 * 
 * High-fidelity, premium Search & Explore Screen for VibeSpace.
 * Features:
 * - Consistent top header with drawer trigger menu (hamburger), centered VibeSpace title, and notification bell.
 * - Search bar with magnifying glass icon and placeholder: "Search vibes, people, or music...".
 * - "People You May Know" horizontal directory section with view all trigger, profile image rings, and bottom-right overlay "+" add badges.
 * - "Trending Vibes" section with horizontal scrolling cards featuring deep image backgrounds, tag pills, bold titles, and active listener counts.
 * - "Nearby Vibes" section with a custom grid map graphic, active count overlays, overlapping radar circles, overlapping member badges, and an "EXPLORE" gradient pill trigger.
 */

import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';

const { width } = Dimensions.get('window');
const TRENDING_CARD_WIDTH = width * 0.65;

const PEOPLE_DATA = [
  { id: '1', name: 'Aria V.', avatar: require('../../../assets/aria_avatar.png') },
  { id: '2', name: 'Leo K.', avatar: require('../../../assets/ishaan_avatar.png') },
  { id: '3', name: 'Maya S.', avatar: require('../../../assets/priya_avatar.png') },
  { id: '4', name: 'Zay', avatar: require('../../../assets/aarav_avatar.png') },
];

const TRENDING_DATA = [
  {
    id: 't1',
    title: 'Late Night Echoes',
    tags: ['#Music', '#Lofi'],
    metric: '12.4k listening',
    metricIcon: 'stats-chart',
    image: require('../../../assets/concert_image.png'),
  },
  {
    id: 't2',
    title: 'Cyber Dreams',
    tags: ['#Visuals', '#Aesthetic'],
    metric: '8.2k views',
    metricIcon: 'eye',
    image: require('../../../assets/post_workstation.png'),
  },
];

export default function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
        <View style={styles.notificationWrapper}>
          <Ionicons name="notifications-outline" size={24} color="#ffffff" />
          <View style={styles.smallIndicator} />
        </View>
      </TouchableOpacity>
    </View>
  );

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
        {/* Search Bar Pill */}
        <View style={[styles.searchBarWrapper, SHADOWS.small]}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
          <TextInput
            placeholder="Search vibes, people, or music..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* People You May Know */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People You May Know</Text>
            <TouchableOpacity onPress={() => alert('View all people')}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {PEOPLE_DATA.map((item) => (
              <TouchableOpacity key={item.id} style={styles.personCard} activeOpacity={0.8}>
                <View style={styles.avatarWrapper}>
                  {/* Glowing Profile border */}
                  <LinearGradient
                    colors={['#8b5cf6', '#4f6ef7']}
                    style={styles.avatarGradientBorder}
                  >
                    <View style={styles.avatarInnerContainer}>
                      <Image source={item.avatar} style={styles.personAvatar} />
                    </View>
                  </LinearGradient>
                  
                  {/* Overlaid '+' Icon badge */}
                  <View style={styles.plusIconBadge}>
                    <Ionicons name="add" size={14} color="#ffffff" />
                  </View>
                </View>
                <Text style={styles.personName} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Vibes */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { marginHorizontal: 16, marginBottom: 16 }]}>Trending Vibes</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            snapToInterval={TRENDING_CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={[styles.horizontalScroll, { paddingLeft: 16 }]}
          >
            {TRENDING_DATA.map((vibe) => (
              <TouchableOpacity key={vibe.id} style={styles.trendingCardTouch} activeOpacity={0.95}>
                <Image source={vibe.image} style={styles.trendingImage} />
                
                {/* Visual Gradient overlay */}
                <LinearGradient
                  colors={['rgba(26,5,51,0.1)', 'rgba(26,5,51,0.9)'] }
                  style={styles.trendingGradient}
                >
                  <View style={styles.trendingTagRow}>
                    {vibe.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagCapsule}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.trendingTextWrapper}>
                    <Text style={styles.trendingCardTitle}>{vibe.title}</Text>
                    <View style={styles.metricRow}>
                      <Ionicons name={vibe.metricIcon} size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                      <Text style={styles.metricText}>{vibe.metric}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nearby Vibes */}
        <View style={[styles.sectionContainer, { paddingHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Nearby Vibes 📍</Text>

          <View style={[styles.nearbyMapCard, SHADOWS.medium]}>
            {/* Custom Interactive Map Graphics Backdrop */}
            <View style={styles.mapGridLinesContainer}>
              {/* Horizontal grid lines */}
              <View style={[styles.gridLine, { top: '25%' }]} />
              <View style={[styles.gridLine, { top: '50%' }]} />
              <View style={[styles.gridLine, { top: '75%' }]} />
              {/* Vertical grid lines */}
              <View style={[styles.gridLineVertical, { left: '25%' }]} />
              <View style={[styles.gridLineVertical, { left: '50%' }]} />
              <View style={[styles.gridLineVertical, { left: '75%' }]} />
              
              {/* Radar circles */}
              <View style={styles.radarCircleOuter} />
              <View style={styles.radarCircleInner} />
              <View style={styles.radarPulseNode} />
              <View style={[styles.radarPulseNode, { top: '30%', left: '70%', width: 10, height: 10 }]} />
            </View>

            {/* Glowing Map Center Pin */}
            <View style={styles.locatorPinContainer}>
              <View style={styles.locatorPinPulse} />
              <View style={styles.locatorPinCore}>
                <Ionicons name="location" size={18} color="#ffffff" />
              </View>
            </View>

            {/* Floating Top Indicator Banner */}
            <View style={styles.nearbyActiveBanner}>
              <Text style={styles.nearbyActiveText}>42 Active Vibes Near You</Text>
            </View>

            {/* Bottom Row details drawer */}
            <View style={styles.nearbyDrawerRow}>
              <View style={styles.overlappingNearbyAvatars}>
                <View style={styles.stackedAvatarNearby}>
                  <Image source={require('../../../assets/esha_avatar.png')} style={styles.nearbyStackedImg} />
                </View>
                <View style={[styles.stackedAvatarNearby, { marginLeft: -14 }]}>
                  <Image source={require('../../../assets/arjun_avatar.png')} style={styles.nearbyStackedImg} />
                </View>
                <View style={[styles.stackedAvatarNearby, { marginLeft: -14 }]}>
                  <Image source={require('../../../assets/aarav_avatar.png')} style={styles.nearbyStackedImg} />
                </View>
                <View style={[styles.stackedAvatarNearbyCount, { marginLeft: -14 }]}>
                  <Text style={styles.nearbyPlusText}>+39</Text>
                </View>
              </View>

              <View style={styles.locationInfoColumn}>
                <Text style={styles.locationTitle}>Bandstand,</Text>
                <Text style={styles.locationSubtitle}>Bandra West</Text>
                <Text style={styles.locationDistance}>2.4 KM AWAY</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => alert('Exploring Nearby Vibes...')}
                style={styles.exploreBtnTouch}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#4f6ef7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.exploreBtnGradient}
                >
                  <Text style={styles.exploreBtnText}>EXPLORE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
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
    borderBottomColor: 'rgba(76, 40, 133, 0.4)',
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
  scrollContainer: {
    paddingBottom: 32,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 11,
    ...FONTS.bold,
    color: COLORS.textMuted || '#a78bfa',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    paddingHorizontal: 12,
  },
  personCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 76,
  },
  avatarWrapper: {
    position: 'relative',
    width: 66,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarGradientBorder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInnerContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a0533',
    overflow: 'hidden',
  },
  personAvatar: {
    width: '100%',
    height: '100%',
  },
  plusIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#60a5fa', // bright blue add badge
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a0533',
    zIndex: 5,
  },
  personName: {
    fontSize: 12,
    color: '#ffffff',
    ...FONTS.medium,
    textAlign: 'center',
  },
  trendingCardTouch: {
    width: TRENDING_CARD_WIDTH,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0c0317',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    marginRight: 16,
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  trendingGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  trendingTagRow: {
    flexDirection: 'row',
  },
  tagCapsule: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 10,
    ...FONTS.bold,
  },
  trendingTextWrapper: {
    width: '100%',
  },
  trendingCardTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    ...FONTS.medium,
  },
  nearbyMapCard: {
    width: '100%',
    height: 260,
    backgroundColor: '#0c0317',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.18)',
    overflow: 'hidden',
    position: 'relative',
  },
  mapGridLinesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  radarCircleOuter: {
    position: 'absolute',
    top: '30%',
    left: '35%',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(79, 110, 247, 0.1)',
  },
  radarCircleInner: {
    position: 'absolute',
    top: '40%',
    left: '42%',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(79, 110, 247, 0.15)',
  },
  radarPulseNode: {
    position: 'absolute',
    top: '38%',
    left: '38%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a78bfa',
    shadowColor: '#a78bfa',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  locatorPinContainer: {
    position: 'absolute',
    top: '45%',
    left: '48%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  locatorPinPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 110, 247, 0.3)',
    transform: [{ scale: 1.3 }],
  },
  locatorPinCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4f6ef7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  nearbyActiveBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(10, 3, 20, 0.75)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  nearbyActiveText: {
    color: '#ffffff',
    fontSize: 11,
    ...FONTS.bold,
  },
  nearbyDrawerRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 5, 51, 0.95)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(167, 139, 250, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  overlappingNearbyAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatarNearby: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0c0317',
    overflow: 'hidden',
  },
  nearbyStackedImg: {
    width: '100%',
    height: '100%',
  },
  stackedAvatarNearbyCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d1054',
    borderWidth: 1.5,
    borderColor: '#0c0317',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyPlusText: {
    color: '#ffffff',
    fontSize: 9,
    ...FONTS.bold,
  },
  locationInfoColumn: {
    flex: 1,
    paddingHorizontal: 12,
  },
  locationTitle: {
    fontSize: 12,
    ...FONTS.bold,
    color: '#ffffff',
  },
  locationSubtitle: {
    fontSize: 12,
    ...FONTS.bold,
    color: '#ffffff',
  },
  locationDistance: {
    fontSize: 10,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.bold,
    marginTop: 2,
    opacity: 0.9,
  },
  exploreBtnTouch: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  exploreBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 11,
    ...FONTS.bold,
  },
});