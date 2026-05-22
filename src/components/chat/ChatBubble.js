import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, FONTS } from '../../constants/theme';

/**
 * ChatBubble Component
 * Features:
 * - Differentiated alignment and styles for sender vs receiver
 * - Double-tick read receipts and edited indicator
 * - Inline image preview
 * - Rich custom audio player using expo-av for voice messages
 * - Interactive emoji reactions pill list
 * - Long-press interaction
 */
export default function ChatBubble({ message, isMine, onLongPress, currentUserId }) {
  const { text, mediaUrl, mediaType, createdAt, readBy = [], isEdited, reactions = {} } = message;

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback error:', err);
      }
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      if (status.durationMillis) {
        setPlayProgress(status.positionMillis / status.durationMillis);
      }
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlayProgress(0);
        setPosition(0);
        if (sound) {
          sound.setPositionAsync(0);
        }
      }
    }
  };

  const formatAudioTime = (millis) => {
    if (!millis) return '0:00';
    const totalSecs = Math.floor(millis / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Check read receipt state: read if another participant has read it
  // (i.e. readBy contains at least 1 other ID other than sender)
  const isRead = readBy.some(uid => uid !== currentUserId);

  const formattedTime = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Convert reactions Map/Object to items list
  const reactionList = Object.entries(reactions || {}).filter(([_, users]) => users.length > 0);

  return (
    <View style={[styles.container, isMine ? styles.mineContainer : styles.otherContainer]}>
      <TouchableOpacity
        onLongPress={() => onLongPress && onLongPress(message)}
        activeOpacity={0.9}
        style={[
          styles.bubble,
          isMine ? styles.mineBubble : styles.otherBubble
        ]}
      >
        {/* Tail Pointer */}
        <View style={[styles.tail, isMine ? styles.mineTail : styles.otherTail]} />

        {/* Content Section */}
        <View style={styles.content}>
          {/* Image Media */}
          {mediaType === 'image' && mediaUrl ? (
            <Image source={{ uri: mediaUrl }} style={styles.imageAttachment} resizeMode="cover" />
          ) : null}

          {/* Voice Audio Player */}
          {mediaType === 'voice' && mediaUrl ? (
            <View style={styles.audioPlayer}>
              <TouchableOpacity onPress={handlePlayPause} style={styles.playButton} activeOpacity={0.7}>
                <Ionicons 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={20} 
                  color={isMine ? '#ffffff' : COLORS.primary} 
                />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${playProgress * 100}%`, backgroundColor: isMine ? '#ffffff' : COLORS.primary }]} />
                </View>
                <View style={styles.audioTimeRow}>
                  <Text style={styles.audioTime}>{formatAudioTime(position)}</Text>
                  <Text style={styles.audioTime}>{duration ? formatAudioTime(duration) : '0:00'}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Text Message */}
          {text ? (
            <Text style={[styles.text, isMine ? styles.mineText : styles.otherText]}>{text}</Text>
          ) : null}

          {/* Info Details Row (Time, receipts, edits) */}
          <View style={styles.infoRow}>
            {isEdited && <Text style={styles.editedText}>Edited • </Text>}
            <Text style={styles.timeText}>{formattedTime}</Text>
            {isMine ? (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={isRead ? '#00f0ff' : 'rgba(255,255,255,0.45)'}
                style={styles.receiptIcon}
              />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Reactions Overlay */}
      {reactionList.length > 0 ? (
        <View style={[styles.reactionsRow, isMine ? styles.mineReactions : styles.otherReactions]}>
          {reactionList.map(([emoji, users]) => (
            <View key={emoji} style={styles.reactionPill}>
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {users.length > 1 ? (
                <Text style={styles.reactionCount}>{users.length}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 12,
    position: 'relative',
  },
  mineContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mineBubble: {
    backgroundColor: COLORS.chat.senderBubble || '#4f6ef7',
    borderTopRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.chat.receiverBubble || '#2d1054',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  tail: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  mineTail: {
    right: -8,
    borderTopWidth: 8,
    borderTopColor: COLORS.chat.senderBubble || '#4f6ef7',
    borderRightWidth: 8,
    borderRightColor: 'transparent',
  },
  otherTail: {
    left: -8,
    borderTopWidth: 8,
    borderTopColor: COLORS.chat.receiverBubble || '#2d1054',
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
  },
  content: {
    flexDirection: 'column',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    ...FONTS.regular,
  },
  mineText: {
    color: '#ffffff',
  },
  otherText: {
    color: '#ffffff',
  },
  imageAttachment: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 6,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    paddingVertical: 4,
    marginBottom: 4,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  audioTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  audioTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  editedText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  receiptIcon: {
    marginLeft: 4,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -4,
    marginBottom: 6,
    zIndex: 10,
  },
  mineReactions: {
    marginRight: 6,
  },
  otherReactions: {
    marginLeft: 6,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 16, 84, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginRight: 3,
    marginTop: 2,
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    color: '#ffffff',
    marginLeft: 3,
    fontWeight: '700',
  }
});