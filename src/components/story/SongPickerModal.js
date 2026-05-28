import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { searchSongs } from '../../services/musicService';

const { width, height } = Dimensions.get('window');

/**
 * SongPickerModal Component
 * Renders a full-screen search and preview picker for music.
 * 
 * @param {object} props
 * @param {boolean} props.visible - Modal visibility state.
 * @param {function} props.onClose - Modal close handler.
 * @param {function} props.onSelectSong - Callback when song is confirmed.
 */
export default function SongPickerModal({ visible, onClose, onSelectSong }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Stop and unload sound safely
  const stopAndUnloadSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setPlayingTrackId(null);
      setIsPlaying(false);
    } catch (error) {
      console.warn('Error unloading audio preview:', error);
    }
  };

  // Cleanup on unmount/close
  useEffect(() => {
    return () => {
      stopAndUnloadSound();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      stopAndUnloadSound();
      setSearchQuery('');
      setSongs([]);
      setSelectedSong(null);
    }
  }, [visible]);

  // Debounced search logic
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSongs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchSongs(searchQuery);
        setSongs(results);
      } catch (err) {
        console.warn('Search query failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce delay

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  // Handle preview playing toggle
  const handleTogglePreview = async (song) => {
    try {
      // 1. If currently playing this song, stop it
      if (playingTrackId === song.id) {
        await stopAndUnloadSound();
        return;
      }

      // 2. Stop any active sound
      await stopAndUnloadSound();

      if (!song.previewUrl) {
        return; // No preview available
      }

      setPlayingTrackId(song.id);
      setIsPlaying(true);

      // Initialize audio playback
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.previewUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
    } catch (error) {
      console.warn('Playback error:', error);
      stopAndUnloadSound();
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      stopAndUnloadSound();
    }
  };

  // Row selection handler
  const handleSelectRow = (song) => {
    setSelectedSong(song);
    handleTogglePreview(song);
  };

  // Form submission
  const handleConfirm = () => {
    if (selectedSong && onSelectSong) {
      onSelectSong(selectedSong);
      onClose();
    }
  };

  const renderSongRow = ({ item }) => {
    const isSelected = selectedSong?.id === item.id;
    const isThisPlaying = playingTrackId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleSelectRow(item)}
        style={[
          styles.songRow,
          isSelected && styles.songRowSelected,
        ]}
      >
        <View style={styles.songRowLeft}>
          {item.artwork ? (
            <Image source={{ uri: item.artwork }} style={styles.albumArt} />
          ) : (
            <View style={[styles.albumArt, styles.placeholderArt]}>
              <Ionicons name="musical-note" size={20} color="#8b5cf6" />
            </View>
          )}

          <View style={styles.songDetails}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {item.artist} • {item.album}
            </Text>
          </View>
        </View>

        <View style={styles.rowRightActions}>
          {item.previewUrl ? (
            <TouchableOpacity
              onPress={() => handleTogglePreview(item)}
              style={styles.previewBtn}
            >
              <Ionicons
                name={isThisPlaying ? 'pause-circle' : 'play-circle'}
                size={28}
                color={isThisPlaying ? '#00f0ff' : '#a78bfa'}
              />
            </TouchableOpacity>
          ) : (
            <Text style={styles.noPreviewText}>No Preview</Text>
          )}

          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header Search Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={26} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.4)" style={styles.searchIcon} />
            <TextInput
              placeholder="Search songs or artists..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color="rgba(255, 255, 255, 0.4)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results Container */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Fetching cosmic tracks...</Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSongRow}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              searchQuery.trim().length > 0 ? (
                <View style={styles.centerContainer}>
                  <Ionicons name="musical-notes-outline" size={48} color="rgba(255, 255, 255, 0.15)" />
                  <Text style={styles.emptyText}>No tracks found in the universe.</Text>
                </View>
              ) : (
                <View style={styles.centerContainer}>
                  <Ionicons name="search-outline" size={48} color="rgba(255, 255, 255, 0.15)" />
                  <Text style={styles.emptyText}>Search music to attach to your vibe.</Text>
                </View>
              )
            }
          />
        )}

        {/* Confirm Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleConfirm}
            disabled={!selectedSong}
            style={[styles.attachButton, !selectedSong && styles.attachButtonDisabled]}
          >
            {selectedSong ? (
              <LinearGradient
                colors={['#8b5cf6', '#4f6ef7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.attachButtonText}>Attach to Story 🎵</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.gradientButton, styles.attachButtonDisabledBg]}>
                <Text style={styles.attachButtonTextDisabled}>Select a Song First</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e031a', // Dark theme matching VibeSpace
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.12)',
  },
  closeBtn: {
    marginRight: 12,
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#250e41',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 100, // footer offset
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 1.2,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  songRowSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  songRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderArt: {
    backgroundColor: '#250e41',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
    marginBottom: 4,
  },
  artistName: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    ...FONTS.regular,
  },
  rowRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBtn: {
    padding: 4,
  },
  checkmarkContainer: {
    marginLeft: 10,
  },
  noPreviewText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.35)',
    marginRight: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: height * 0.2,
  },
  loadingText: {
    color: '#a78bfa',
    fontSize: 13,
    marginTop: 14,
    ...FONTS.medium,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    ...FONTS.medium,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#0e031a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.12)',
  },
  attachButton: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  attachButtonDisabled: {
    opacity: 0.55,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  attachButtonDisabledBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  attachButtonText: {
    color: '#ffffff',
    fontSize: 15,
    ...FONTS.bold,
    letterSpacing: 0.5,
  },
  attachButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 15,
    ...FONTS.bold,
  },
});
