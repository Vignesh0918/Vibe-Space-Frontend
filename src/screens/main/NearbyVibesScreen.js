/**
 * NearbyVibesScreen.js
 * 
 * High-fidelity, premium Nearby Vibes Screen for VibeSpace.
 * Matches Mockup 1:
 * - Top header with Hamburger, VibeSpace title, and Notifications bell.
 * - Interactive-looking deep-purple Radar Map banner showing coordinate dots, glowing radar pulses, active status indicator, and overlay icons.
 * - List of nearby vibe cards:
 *   - "Late night pizza & tech talk" (🍕, 0.8km away, 4 people, tags: #CHILL, #NETWORKING)
 *   - "Acoustic session at the park" (🎸, 1.2km away, 12 people, tag: #MUSIC)
 *   - "Retro gaming & boba" (🕹️, 2.5km away, 6 people, tags: #GAMING, #SOCIAL)
 * - Dashed border card "+ Can't find your vibe? Start a new anonymous vibe bubble around you." which navigates to CreateCircleScreen.
 */

import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';

const { width } = Dimensions.get('window');

const VIBES_DATA = [
  {
    id: '1',
    title: 'Late night pizza & tech talk',
    emoji: '🍕',
    emojiBg: '#f97316', // Orange
    distance: '0.8km away',
    members: '4 people',
    tags: ['#CHILL', '#NETWORKING'],
  },
  {
    id: '2',
    title: 'Acoustic session at the park',
    emoji: '🎸',
    emojiBg: '#ef4444', // Red
    distance: '1.2km away',
    members: '12 people',
    tags: ['#MUSIC'],
  },
  {
    id: '3',
    title: 'Retro gaming & boba',
    emoji: '🕹️',
    emojiBg: '#4b5563', // Grey
    distance: '2.5km away',
    members: '6 people',
    tags: ['#GAMING', '#SOCIAL'],
  }
];

export default function NearbyVibesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
        {/* Radar Map Banner */}
        <View style={styles.radarBanner}>
          {/* Radar background elements */}
          <View style={styles.gridLinesContainer}>
            {/* Draw concentric radar rings */}
            <View style={[styles.radarRing, { width: 80, height: 80, borderRadius: 40 }]} />
            <View style={[styles.radarRing, { width: 160, height: 160, borderRadius: 80 }]} />
            <View style={[styles.radarRing, { width: 240, height: 240, borderRadius: 120 }]} />
            
            {/* Glowing nodes matching the mockup */}
            <View style={[styles.glowNode, { top: '30%', left: '30%', backgroundColor: '#4f6ef7', shadowColor: '#4f6ef7' }]} />
            <View style={[styles.glowNode, { top: '35%', left: '70%', backgroundColor: '#ffffff', shadowColor: '#ffffff' }]} />
            <View style={[styles.glowNode, { top: '55%', left: '62%', backgroundColor: '#a78bfa', shadowColor: '#a78bfa' }]} />
            <View style={[styles.glowNode, { top: '70%', left: '22%', backgroundColor: '#ec4899', shadowColor: '#ec4899' }]} />
          </View>

          {/* Location Badge (Live status) */}
          <View style={styles.liveLocationBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLocationText}>Live in Mumbai, MH</Text>
          </View>

          {/* Bottom Title & Metrics Overlay */}
          <View style={styles.radarTextOverlay}>
            <Text style={styles.radarTitle}>Vibes Nearby</Text>
            <Text style={styles.radarMetric}>24 active circles</Text>
          </View>

          {/* Overlay Map Buttons */}
          <View style={styles.mapButtonsContainer}>
            <TouchableOpacity style={styles.mapRoundBtn} onPress={() => alert('Recentering location...')}>
              <Ionicons name="navigate-sharp" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapRoundBtn, { marginTop: 10 }]} onPress={() => alert('Changing map layers...')}>
              <Ionicons name="layers-sharp" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vibes List */}
        <View style={styles.listContainer}>
          {VIBES_DATA.map((vibe) => (
            <View key={vibe.id} style={[styles.vibeCard, SHADOWS.small]}>
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  {/* Circular emoji icon */}
                  <View style={[styles.emojiCircle, { backgroundColor: vibe.emojiBg }]}>
                    <Text style={styles.emojiText}>{vibe.emoji}</Text>
                  </View>
                  
                  {/* Card Title & Info */}
                  <View style={styles.titleTextContainer}>
                    <Text style={styles.cardTitle}>{vibe.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      {vibe.distance} • {vibe.members}
                    </Text>
                  </View>
                </View>

                {/* More options button */}
                <TouchableOpacity style={styles.moreButton} onPress={() => alert('Vibe options clicked')}>
                  <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>

              {/* Tags row */}
              <View style={styles.tagsContainer}>
                {vibe.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagCapsule}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Lavender gradient Join Button */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.joinButtonTouch}
                onPress={() => alert(`Requesting to join "${vibe.title}"...`)}
              >
                <LinearGradient
                  colors={['#a78bfa', '#60a5fa']} // Lavender to light-blue gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.joinButtonGradient}
                >
                  <Text style={styles.joinButtonText}>JOIN THE VIBE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}

          {/* Dashed Create Vibe Button */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.dashedCreateCard}
            onPress={() => navigation.navigate(SCREENS.CIRCLES_TAB, { screen: SCREENS.CREATE_CIRCLE })}
          >
            <View style={styles.dashedCirclePlus}>
              <Ionicons name="add" size={24} color={COLORS.textMuted || '#a78bfa'} />
            </View>
            <Text style={styles.dashedCardTitle}>Can't find your vibe?</Text>
            <Text style={styles.dashedCardSubtitle}>Start a new anonymous vibe bubble around you.</Text>
          </TouchableOpacity>
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
  scrollContainer: {
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.background || '#1a0533',
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
  radarBanner: {
    height: 240,
    backgroundColor: '#0c0317', // Very dark purple/grey
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.4)',
  },
  gridLinesContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.4,
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    borderStyle: 'dashed',
  },
  glowNode: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
  },
  liveLocationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 5, 51, 0.75)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981', // Emerald green
    marginRight: 8,
  },
  liveLocationText: {
    color: '#ffffff',
    fontSize: 12,
    ...FONTS.medium,
  },
  radarTextOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  radarTitle: {
    fontSize: 28,
    ...FONTS.bold,
    color: '#ffffff',
  },
  radarMetric: {
    fontSize: 13,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.bold,
    marginBottom: 4,
  },
  mapButtonsContainer: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    alignItems: 'center',
  },
  mapRoundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 5, 51, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  vibeCard: {
    backgroundColor: COLORS.card || '#2d1054',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 22,
  },
  titleTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.medium,
    opacity: 0.8,
  },
  moreButton: {
    padding: 4,
    marginLeft: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    paddingLeft: 56, // Align with title
  },
  tagCapsule: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.bold,
  },
  joinButtonTouch: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  dashedCreateCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: 'rgba(45, 16, 84, 0.25)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  dashedCirclePlus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashedCardTitle: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 4,
  },
  dashedCardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted || '#a78bfa',
    textAlign: 'center',
    opacity: 0.8,
  },
});