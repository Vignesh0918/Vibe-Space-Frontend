/**
 * GroupChatScreen.js
 *
 * High-fidelity Group Chat Screen for VibeSpace matching the "Vibe Tribe" mockup.
 * Features:
 * - Header with group avatar, name, member count, video-call & options buttons.
 * - "TODAY" date badge separator.
 * - Sender-colored name labels (received messages).
 * - Rounded chat bubbles with tail-like padding, timestamps and read receipts.
 * - Image/media message support in bubbles.
 * - Frosted input bar with attachment (+), emoji, and gradient send button.
 */

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = width * 0.75;

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const GROUP_INFO = {
  name: 'Vibe Tribe',
  memberCount: 12,
  avatars: [
    require('../../../assets/default_avatar.png'),
    require('../../../assets/default_avatar.png'),
    require('../../../assets/default_avatar.png'),
  ],
};

const SENDER_COLORS = {
  Arjun: '#4f6ef7',
  Priya: '#ec4899',
  Rohan: '#10b981',
  Esha: '#f59e0b',
};

const MESSAGES = [
  {
    id: '1',
    type: 'date',
    text: 'TODAY',
  },
  {
    id: '2',
    sender: 'Arjun',
    avatar: require('../../../assets/default_avatar.png'),
    text: 'Yo, are we still hitting that underground set tonight? 🎧',
    time: '21:04',
    isMine: false,
  },
  {
    id: '3',
    sender: 'Priya',
    avatar: require('../../../assets/default_avatar.png'),
    text: "Count me in! I heard the DJ is playing some exclusive remixes. Can't wait! ✨",
    time: '21:06',
    isMine: false,
  },
  {
    id: '4',
    sender: 'You',
    text: "I'll be there by 11. Arjun, can you grab the entry passes? 🎫",
    time: '21:10',
    isMine: true,
    read: true,
  },
  {
    id: '5',
    sender: 'Rohan',
    avatar: require('../../../assets/default_avatar.png'),
    text: 'Check the vibe from last year! 🔥',
    time: '21:15',
    isMine: false,
    image: require('../../../assets/concert_image.png'),
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GroupChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (!messageText.trim()) return;
    setMessageText('');
  };

  /* ---------- renderers ---------- */

  const renderDateBadge = (item) => (
    <View style={styles.dateBadgeWrapper}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeText}>{item.text}</Text>
      </View>
    </View>
  );

  const renderMessage = (item) => {
    const isMine = item.isMine;
    const senderColor = SENDER_COLORS[item.sender] || COLORS.primary;

    return (
      <View style={styles.messageRow}>
        {/* Sender name above the bubble (received only) */}
        {!isMine && (
          <Text style={[styles.senderName, { color: senderColor }]}>
            {item.sender?.toUpperCase()}
          </Text>
        )}

        <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
          {/* Avatar (received only) */}
          {!isMine && (
            <Image source={item.avatar} style={styles.bubbleAvatar} />
          )}

          {/* Bubble */}
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleTheirs,
            ]}
          >
            {/* Optional image */}
            {item.image && (
              <Image
                source={item.image}
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            )}

            {/* Text */}
            <Text style={styles.bubbleText}>{item.text}</Text>

            {/* Time + read receipt */}
            <View style={styles.metaRow}>
              <Text style={styles.metaTime}>{item.time}</Text>
              {isMine && (
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={item.read ? '#4f6ef7' : COLORS.textMuted}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (item.type === 'date') return renderDateBadge(item);
    return renderMessage(item);
  };

  /* ---------- header ---------- */

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Stacked group avatars */}
        <View style={styles.groupAvatarStack}>
          {GROUP_INFO.avatars.map((src, i) => (
            <Image
              key={i}
              source={src}
              style={[
                styles.groupAvatar,
                { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i },
              ]}
            />
          ))}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{GROUP_INFO.name}</Text>
          <Text style={styles.headerSub}>{GROUP_INFO.memberCount} members</Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="videocam-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ---------- input bar ---------- */

  const renderInputBar = () => (
    <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
      <TouchableOpacity style={styles.attachBtn}>
        <Ionicons name="add" size={26} color="#ffffff" />
      </TouchableOpacity>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Send a message..."
          placeholderTextColor={COLORS.textMuted}
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity style={styles.emojiBtn}>
          <Ionicons name="happy-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSend}
        activeOpacity={0.8}
        style={styles.sendBtnOuter}
      >
        <LinearGradient
          colors={['#8b5cf6', '#4f6ef7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sendBtn}
        >
          <Ionicons name="send" size={18} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  /* ---------- main ---------- */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {renderInputBar()}
      </KeyboardAvoidingView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.35)',
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  groupAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  groupAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    ...FONTS.bold,
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    ...FONTS.regular,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 6,
    marginLeft: 6,
  },

  /* ---------- Message List ---------- */
  listContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    paddingBottom: 8,
  },

  /* ---------- Date Badge ---------- */
  dateBadgeWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateBadge: {
    backgroundColor: 'rgba(45, 16, 84, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.15)',
  },
  dateBadgeText: {
    fontSize: 11,
    ...FONTS.bold,
    color: '#ffffff',
    letterSpacing: 1,
  },

  /* ---------- Message Row ---------- */
  messageRow: {
    marginBottom: 16,
  },
  senderName: {
    fontSize: 11,
    ...FONTS.bold,
    letterSpacing: 0.6,
    marginBottom: 4,
    marginLeft: 46,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: 18,
    padding: 12,
    paddingBottom: 6,
  },
  bubbleMine: {
    backgroundColor: COLORS.chat.senderBubble,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.chat.receiverBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.12)',
  },
  bubbleImage: {
    width: MAX_BUBBLE_WIDTH - 24,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  bubbleText: {
    fontSize: 15,
    color: '#ffffff',
    ...FONTS.regular,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  metaTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    ...FONTS.regular,
  },

  /* ---------- Input Bar ---------- */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 40, 133, 0.35)',
    backgroundColor: COLORS.background,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 16, 84, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 16,
    minHeight: 44,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.regular,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  emojiBtn: {
    padding: 4,
    marginLeft: 4,
  },
  sendBtnOuter: {
    marginLeft: 8,
    marginBottom: 2,
    borderRadius: 22,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});