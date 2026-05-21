/**
 * CirclesScreen.js
 * 
 * High-fidelity, premium Circles Screen for VibeSpace.
 * Features:
 * - Consistent top header matching Home Feed styling.
 * - "My Circles" section displaying a sleek 2x2 grid of active circles:
 *   - Friends, Family, Work, Secret.
 *   - Customized status dots, member counts, and premium micro-interactions.
 * - "+ Create New Circle" card with a dashed border, plus sign, and navigation routing.
 * - "Recommended Circles" section featuring:
 *   - Large graphical banner (banner_gamers.png) with a dark gradient overlay.
 *   - Trending tag, club name, active members indicator, and gradient "Join" CTA.
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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';

const { width } = Dimensions.get('window');

export default function CirclesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const myCircles = [
    {
      id: 'friends',
      name: 'Friends',
      members: '12 members',
      activeTime: 'Active 2m ago',
      iconName: 'happy-outline',
      iconType: 'ionicons',
      color: COLORS.circles.friends || '#10b981',
    },
    {
      id: 'family',
      name: 'Family',
      members: '5 members',
      activeTime: 'Active 1h ago',
      iconName: 'heart-outline',
      iconType: 'ionicons',
      color: COLORS.circles.family || '#3b82f6',
    },
    {
      id: 'work',
      name: 'Work',
      members: '24 members',
      activeTime: 'Active 5m ago',
      iconName: 'briefcase-outline',
      iconType: 'ionicons',
      color: COLORS.circles.work || '#f59e0b',
    },
    {
      id: 'secret',
      name: 'Secret',
      members: '3 members',
      activeTime: 'Active 3h ago',
      iconName: 'lock-closed-outline',
      iconType: 'ionicons',
      color: COLORS.circles.secret || '#ec4899',
    },
  ];

  const handleCirclePress = (circle) => {
    navigation.navigate(SCREENS.CIRCLE_DETAIL, { 
      circleId: circle.id, 
      circleName: circle.name,
      circleColor: circle.color
    });
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
        paddingBottom: insets.bottom + 80 // Offset for CustomTabBar height
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* My Circles Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Circles</Text>
          <Text style={styles.sectionSubtitle}>You're active in 4 clusters today</Text>
        </View>

        {/* 2x2 Grid */}
        <View style={styles.gridContainer}>
          {myCircles.map((circle) => (
            <TouchableOpacity 
              key={circle.id}
              activeOpacity={0.8}
              onPress={() => handleCirclePress(circle)}
              style={[
                styles.gridCard, 
                { 
                  backgroundColor: `${circle.color}0a`, // 4% opacity of the theme color
                  borderColor: `${circle.color}25`, // 14% opacity of theme color
                },
                SHADOWS.small
              ]}
            >
              {/* Card Header with Status indicator */}
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconCircle, { backgroundColor: `${circle.color}15` }]}>
                  <Ionicons name={circle.iconName} size={24} color={circle.color} />
                </View>
                <Text style={[styles.activeTimeText, { color: `${circle.color}d0` }]}>
                  {circle.activeTime}
                </Text>
              </View>

              {/* Card Body */}
              <Text style={styles.circleCardName}>{circle.name}</Text>
              <Text style={styles.circleCardMembers}>{circle.members}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create Circle Button (Dashed border full-width card) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate(SCREENS.CREATE_CIRCLE)}
          style={styles.createCard}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.textMuted || '#a78bfa'} />
          <Text style={styles.createCardText}>Create New Circle</Text>
        </TouchableOpacity>

        {/* Recommended Circles Section */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <Text style={styles.sectionSubtitle}>Vibe groups matching your interests</Text>
        </View>

        {/* Recommended Card Banner */}
        <View style={[styles.recommendedCard, SHADOWS.medium]}>
          <Image 
            source={require('../../../assets/banner_gamers.png')} 
            style={styles.recommendedBackground}
          />
          <LinearGradient
            colors={['rgba(26, 5, 51, 0.2)', 'rgba(26, 5, 51, 0.95)']}
            style={styles.recommendedOverlay}
          >
            <View style={styles.recommendedTopRow}>
              <View style={styles.trendingTag}>
                <Text style={styles.trendingTagText}>TRENDING</Text>
              </View>
            </View>

            <View style={styles.recommendedBottomWrapper}>
              <View style={styles.recommendedBottomRow}>
                <View style={styles.recommendedTextContainer}>
                  <Text style={styles.recommendedName}>Indie Gamers Club</Text>
                  <Text style={styles.recommendedMembers}>4.2k active members today</Text>
                </View>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => alert('Joining Indie Gamers Club...')}
                  style={styles.joinButtonTouch}
                >
                  <LinearGradient
                    colors={['#a78bfa', '#60a5fa']} // Lavender to Light Blue gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.joinButtonGradient}
                  >
                    <Text style={styles.joinButtonText}>Join</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              {/* Pagination Dots indicating slide options */}
              <View style={styles.paginationDotsContainer}>
                <View style={[styles.paginationDot, styles.paginationDotActive]} />
                <View style={styles.paginationDot} />
                <View style={styles.paginationDot} />
              </View>
            </View>
          </LinearGradient>
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
    paddingHorizontal: SIZES.spacingMd || 16,
    paddingTop: SIZES.spacingMd || 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    ...FONTS.bold,
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12,
    ...FONTS.regular,
    color: COLORS.textMuted || '#a78bfa',
    opacity: 0.8,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCard: {
    width: (width - 32 - 12) / 2, // calculate half-width minus padding
    backgroundColor: COLORS.card || '#2d1054',
    borderRadius: SIZES.radiusLg || 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  circleCardName: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 4,
  },
  circleCardMembers: {
    fontSize: 11,
    ...FONTS.medium,
    color: COLORS.textMuted || '#a78bfa',
    opacity: 0.75,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 16, 84, 0.3)',
    borderRadius: SIZES.radiusLg || 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderStyle: 'dashed',
    paddingVertical: 16,
    width: '100%',
  },
  createCardText: {
    fontSize: 14,
    ...FONTS.bold,
    color: COLORS.textMuted || '#a78bfa',
    marginLeft: 8,
  },
  recommendedCard: {
    height: 200,
    borderRadius: SIZES.radiusLg || 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0c0317',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  recommendedBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  recommendedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  recommendedTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  trendingTag: {
    backgroundColor: '#ec4899', // Pink hotspot
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  trendingTagText: {
    fontSize: 9,
    ...FONTS.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  activeTimeText: {
    fontSize: 10,
    ...FONTS.bold,
    opacity: 0.85,
  },
  recommendedBottomWrapper: {
    width: '100%',
  },
  recommendedBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  recommendedName: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
  },
  recommendedMembers: {
    fontSize: 11,
    ...FONTS.medium,
    color: COLORS.textMuted || '#a78bfa',
    marginTop: 2,
    opacity: 0.9,
  },
  joinButtonTouch: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 13,
    ...FONTS.bold,
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 14,
  },
});