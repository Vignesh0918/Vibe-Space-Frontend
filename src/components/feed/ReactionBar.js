import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const EMOJI_OPTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👍', '✨', '🎉'];

/**
 * ReactionBar Component
 * Renders reaction pills (shows top 3 emojis, counts, and whether current user has active reaction).
 * Attaches a long-press/tap emoji picker overlay modal.
 */
export default function ReactionBar({ reactions = {}, currentUserId, onReact }) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Convert reactions Map/Object to array of entries: [emoji, [userId1, userId2...]]
  // Handle Mongoose Map representation or plain JS object
  const rawReactions = reactions instanceof Map ? Object.fromEntries(reactions) : reactions;
  const reactionList = Object.entries(rawReactions || {})
    .filter(([_, users]) => Array.isArray(users) && users.length > 0)
    .sort((a, b) => b[1].length - a[1].length);

  const openPicker = () => {
    setPickerVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closePicker = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setPickerVisible(false));
  };

  const handleSelectEmoji = (emoji) => {
    closePicker();
    if (onReact) {
      onReact(emoji);
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Reaction Pills */}
      <View style={styles.pillsRow}>
        {reactionList.map(([emoji, users]) => {
          const hasReacted = users.includes(currentUserId);
          return (
            <TouchableOpacity
              key={emoji}
              activeOpacity={0.8}
              style={[
                styles.pill,
                hasReacted && styles.pillActive
              ]}
              onPress={() => onReact && onReact(emoji)}
              onLongPress={openPicker}
            >
              <Text style={styles.pillEmoji}>{emoji}</Text>
              <Text style={[styles.pillCount, hasReacted && styles.pillCountActive]}>
                {users.length}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Add Reaction Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.addBtn}
          onPress={openPicker}
        >
          <Ionicons name="add" size={16} color={COLORS.textMuted || '#a78bfa'} />
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Overlay Modal */}
      <Modal
        visible={pickerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closePicker}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closePicker}
        >
          <Animated.View
            style={[
              styles.pickerContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.pickerTitle}>Express yourself</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.65}
                  style={styles.emojiBtn}
                  onPress={() => handleSelectEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 6,
    marginVertical: 4,
  },
  pillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: 'rgba(139, 92, 246, 0.45)',
  },
  pillEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  pillCount: {
    fontSize: 11,
    color: COLORS.textMuted || '#a78bfa',
    fontWeight: '700',
  },
  pillCountActive: {
    color: '#ffffff',
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: 'rgba(30, 12, 56, 0.95)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    padding: 16,
    width: width * 0.85,
    maxWidth: 320,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  pickerTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emojiBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emojiText: {
    fontSize: 24,
  },
});