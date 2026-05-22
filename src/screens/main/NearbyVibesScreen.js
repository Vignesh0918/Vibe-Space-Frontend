/**
 * NearbyVibesScreen.js
 * 
 * High-fidelity, premium Nearby Vibes Screen for VibeSpace.
 * Connects to live Expo Location API and Express NearbyVibes routes.
 * Enables users to join nearby vibe bubbles, delete their own bubbles,
 * and create new anonymous vibe bubbles around their coordinates.
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import SideDrawer from '../../components/common/SideDrawer';
import { getCurrentLocation } from '../../services/locationService';
import { getNearbyVibes, createNearbyVibe, joinNearbyVibe, deleteNearbyVibe } from '../../services/nearbyVibeService';

const { width } = Dimensions.get('window');

// Pre-curated emojis for quick vibe selection
const QUICK_EMOJIS = ['🍕', '🎸', '🕹️', '☕', '📚', '🏃‍♂️', '🎨', '🧘', '🔥', '🎉'];

export default function NearbyVibesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?.uid;

  // Component States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [locationName, setLocationName] = useState('Locating...');
  const [vibes, setVibes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Create Vibe Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [vibeTitle, setVibeTitle] = useState('');
  const [vibeEmoji, setVibeEmoji] = useState('🔥');
  const [vibeTags, setVibeTags] = useState('');
  const [vibeExpiryHours, setVibeExpiryHours] = useState(3); // default 3 hours
  const [isCreating, setIsCreating] = useState(false);

  // Get location and fetch nearby vibes on mount
  useEffect(() => {
    fetchLocationAndVibes();
  }, []);

  const fetchLocationAndVibes = async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const locResult = await getCurrentLocation();
      let currentLat = 19.076; // Default to Mumbai
      let currentLng = 72.8777;

      if (locResult.success && locResult.data) {
        currentLat = locResult.data.latitude;
        currentLng = locResult.data.longitude;
        setCoordinates(locResult.data);
        setLocationName('Live Radar Active');
      } else {
        setCoordinates({ latitude: currentLat, longitude: currentLng });
        setLocationName('Default (Mumbai, MH)');
        console.warn('Location permission not granted or error. Falling back to default coordinate.');
      }

      // Fetch from Backend
      const vibesResult = await getNearbyVibes(currentLat, currentLng);
      if (vibesResult.success) {
        setVibes(vibesResult.data || []);
      } else {
        console.warn('Failed to fetch nearby vibes from server:', vibesResult.error);
      }
    } catch (err) {
      console.warn('Error fetching nearby data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleJoinVibe = async (vibeId, vibeTitleText) => {
    try {
      const res = await joinNearbyVibe(vibeId);
      if (res.success) {
        // Update local state to reflect joined user
        setVibes(prev => prev.map(v => {
          if (v.id === vibeId || v._id === vibeId) {
            const joined = v.joinedBy || [];
            if (!joined.includes(currentUserId)) {
              return {
                ...v,
                joinedBy: [...joined, currentUserId],
                memberCount: (v.memberCount || 0) + 1
              };
            }
          }
          return v;
        }));
        Alert.alert('Joined Vibe!', `You have joined the vibe bubble: "${vibeTitleText}"`);
      } else {
        Alert.alert('Join Error', res.error || 'Failed to join the vibe bubble.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteVibe = (vibeId, vibeTitleText) => {
    Alert.alert(
      'Delete Vibe Bubble',
      `Are you sure you want to delete "${vibeTitleText}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteNearbyVibe(vibeId);
              if (res.success) {
                setVibes(prev => prev.filter(v => (v.id !== vibeId && v._id !== vibeId)));
              } else {
                Alert.alert('Error', res.error || 'Failed to delete vibe.');
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleCreateBubbleSubmit = async () => {
    if (!vibeTitle.trim()) {
      Alert.alert('Invalid Input', 'Please enter a description of the vibe.');
      return;
    }
    if (!vibeEmoji) {
      Alert.alert('Invalid Input', 'Please select or input an emoji.');
      return;
    }

    setIsCreating(true);
    try {
      const parsedTags = vibeTags
        .split(',')
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const payload = {
        lat: coordinates?.latitude || 19.076,
        lng: coordinates?.longitude || 72.8777,
        emoji: vibeEmoji,
        title: vibeTitle.trim(),
        tags: parsedTags,
        expiresInHours: vibeExpiryHours
      };

      const res = await createNearbyVibe(payload);
      if (res.success) {
        setIsCreateModalOpen(false);
        setVibeTitle('');
        setVibeTags('');
        setVibeExpiryHours(3);
        
        // Add to local state (calculate approximate distance as 0.0km for creator)
        const newVibe = {
          ...res.data,
          distance: 0.0,
          joinedBy: [currentUserId]
        };
        setVibes(prev => [newVibe, ...prev]);
        Alert.alert('Vibe Shared!', 'Your nearby anonymous vibe bubble is now active.');
      } else {
        Alert.alert('Creation Failed', res.error || 'Could not create vibe bubble.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsCreating(false);
    }
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
        paddingBottom: insets.bottom + 80 // offset for navigation tabbar
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchLocationAndVibes(true)}
            tintColor="#818cf8"
            colors={['#818cf8']}
          />
        }
      >
        {/* Radar Map Banner */}
        <View style={styles.radarBanner}>
          {/* Radar background elements */}
          <View style={styles.gridLinesContainer}>
            {/* Concentric radar rings */}
            <View style={[styles.radarRing, { width: 80, height: 80, borderRadius: 40 }]} />
            <View style={[styles.radarRing, { width: 160, height: 160, borderRadius: 80 }]} />
            <View style={[styles.radarRing, { width: 240, height: 240, borderRadius: 120 }]} />
            
            {/* Glowing nodes simulating nearby users/bubbles */}
            <View style={[styles.glowNode, { top: '25%', left: '20%', backgroundColor: '#10b981', shadowColor: '#10b981' }]} />
            <View style={[styles.glowNode, { top: '35%', left: '72%', backgroundColor: '#f59e0b', shadowColor: '#f59e0b' }]} />
            <View style={[styles.glowNode, { top: '55%', left: '60%', backgroundColor: '#c084fc', shadowColor: '#c084fc' }]} />
            <View style={[styles.glowNode, { top: '75%', left: '30%', backgroundColor: '#ef4444', shadowColor: '#ef4444' }]} />
          </View>

          {/* Location Badge (Live status) */}
          <View style={styles.liveLocationBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLocationText}>{locationName}</Text>
          </View>

          {/* Bottom Title & Metrics Overlay */}
          <View style={styles.radarTextOverlay}>
            <Text style={styles.radarTitle}>Vibes Nearby</Text>
            <Text style={styles.radarMetric}>
              {isLoading ? '...' : `${vibes.length} active bubbles`}
            </Text>
          </View>

          {/* Overlay Map Buttons */}
          <View style={styles.mapButtonsContainer}>
            <TouchableOpacity style={styles.mapRoundBtn} onPress={() => fetchLocationAndVibes()}>
              <Ionicons name="navigate-sharp" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapRoundBtn, { marginTop: 10 }]} onPress={() => setIsCreateModalOpen(true)}>
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vibes List */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#818cf8" style={{ marginVertical: 40 }} />
            </View>
          ) : vibes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="radio-outline" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No vibes detected in your 10km radius.</Text>
            </View>
          ) : (
            vibes.map((vibe) => {
              const vibeId = vibe.id || vibe._id;
              const hasJoined = vibe.joinedBy?.includes(currentUserId);
              const isCreator = vibe.creatorId === currentUserId;

              return (
                <View key={vibeId} style={[styles.vibeCard, SHADOWS.small]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      {/* Circular emoji icon */}
                      <View style={[styles.emojiCircle, { backgroundColor: isCreator ? '#8b5cf6' : '#2d1054' }]}>
                        <Text style={styles.emojiText}>{vibe.emoji}</Text>
                      </View>
                      
                      {/* Card Title & Info */}
                      <View style={styles.titleTextContainer}>
                        <Text style={styles.cardTitle}>{vibe.title}</Text>
                        <Text style={styles.cardSubtitle}>
                          {vibe.distance !== undefined ? `${vibe.distance}km away` : 'Near you'} • {vibe.memberCount || vibe.joinedBy?.length || 1} joined
                        </Text>
                      </View>
                    </View>

                    {/* Options button / delete if own */}
                    {isCreator ? (
                      <TouchableOpacity 
                        style={styles.moreButton} 
                        onPress={() => handleDeleteVibe(vibeId, vibe.title)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Tags row */}
                  {vibe.tags && vibe.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {vibe.tags.map((tag, idx) => (
                        <View key={idx} style={styles.tagCapsule}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Lavender gradient Join Button */}
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={styles.joinButtonTouch}
                    disabled={hasJoined || isCreator}
                    onPress={() => handleJoinVibe(vibeId, vibe.title)}
                  >
                    <LinearGradient
                      colors={hasJoined || isCreator ? ['#4c3a75', '#332454'] : ['#a78bfa', '#60a5fa']} 
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.joinButtonGradient}
                    >
                      <Text style={[styles.joinButtonText, (hasJoined || isCreator) && { color: 'rgba(255,255,255,0.4)' }]}>
                        {isCreator ? 'OWNED VIBE' : hasJoined ? 'JOINED' : 'JOIN THE VIBE'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* Dashed Create Vibe Button */}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.dashedCreateCard}
            onPress={() => setIsCreateModalOpen(true)}
          >
            <View style={styles.dashedCirclePlus}>
              <Ionicons name="add" size={24} color="#a78bfa" />
            </View>
            <Text style={styles.dashedCardTitle}>Can't find your vibe?</Text>
            <Text style={styles.dashedCardSubtitle}>Start a new anonymous vibe bubble around you.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Drawer Navigator */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Create Vibe Bubble Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Vibe Bubble</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Ionicons name="close" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>WHAT'S THE VIBE?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Late night coffee, Study session, Jamming..."
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={vibeTitle}
                  onChangeText={setVibeTitle}
                  maxLength={50}
                />
              </View>

              {/* Quick Emoji row */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>CHOOSE VIBE EMOJI</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickEmojisRow}>
                  {QUICK_EMOJIS.map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.quickEmojiBtn,
                        vibeEmoji === emoji && styles.quickEmojiBtnActive
                      ]}
                      onPress={() => setVibeEmoji(emoji)}
                    >
                      <Text style={styles.quickEmojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={[styles.textInput, { marginTop: 8, textAlign: 'center', width: 80, alignSelf: 'center', fontSize: 20 }]}
                  placeholder="Emoji"
                  value={vibeEmoji}
                  onChangeText={setVibeEmoji}
                  maxLength={2}
                />
              </View>

              {/* Tags */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>TAGS (COMMA SEPARATED)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Music, Chill, Boba"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={vibeTags}
                  onChangeText={setVibeTags}
                />
              </View>

              {/* Duration */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>BUBBLE LIFETIME: {vibeExpiryHours} HOURS</Text>
                <View style={styles.durationRow}>
                  {[1, 3, 6, 12, 24].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[
                        styles.durationPill,
                        vibeExpiryHours === hours && styles.durationPillActive
                      ]}
                      onPress={() => setVibeExpiryHours(hours)}
                    >
                      <Text style={[styles.durationPillText, vibeExpiryHours === hours && styles.durationPillTextActive]}>
                        {hours}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.createButtonTouch}
                disabled={isCreating}
                onPress={handleCreateBubbleSubmit}
              >
                <LinearGradient
                  colors={['#818cf8', '#c084fc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButtonGradient}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#1e083c" />
                  ) : (
                    <Text style={styles.createButtonText}>ACTIVATE VIBE BUBBLE</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#0c0317',
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
    backgroundColor: '#10b981',
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
    color: '#a78bfa',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted || '#818cf8',
    marginTop: 10,
    textAlign: 'center',
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
    color: '#a78bfa',
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
    paddingLeft: 56,
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
    color: '#a78bfa',
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
    color: '#a78bfa',
    textAlign: 'center',
    opacity: 0.8,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 2, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card || '#2d1054',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderTopWidth: 1.5,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: '#ffffff',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a78bfa',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
  },
  quickEmojisRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  quickEmojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quickEmojiBtnActive: {
    borderColor: '#818cf8',
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
  },
  quickEmojiText: {
    fontSize: 22,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  durationPill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  durationPillActive: {
    borderColor: '#818cf8',
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
  },
  durationPillText: {
    color: COLORS.textMuted || '#a78bfa',
    fontSize: 13,
    ...FONTS.bold,
  },
  durationPillTextActive: {
    color: '#818cf8',
  },
  createButtonTouch: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 30,
  },
  createButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#1e083c',
    fontSize: 14,
    ...FONTS.bold,
    letterSpacing: 1,
  },
});