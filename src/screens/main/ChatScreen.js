/**
 * ChatScreen.js
 * 
 * High-fidelity, premium Chat Screen for VibeSpace.
 * Supports DMs and general chats, polling for messages, mark unread read receipts,
 * hold-to-talk voice recording, camera/gallery uploads, and message options (edit/delete/react).
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Modal,
  Clipboard,
  Keyboard,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { auth } from '../../services/firebase';
import {
  getChatDetails,
  listenToMessages,
  sendMessage,
  markMessagesRead,
  reactToMessage,
  deleteMessage,
  editMessage
} from '../../services/chatService';
import ChatBubble from '../../components/chat/ChatBubble';
import ExpiryBadge from '../../components/chat/ExpiryBadge';
import { getSmartReplies } from '../../services/aiService';
import CustomAlertModal from '../../components/common/CustomAlertModal';

const { width } = Dimensions.get('window');

const REACTIONS_LIST = ['❤️', '🔥', '😂', '😮', '😢', '👏'];

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const { chatId, chatName = 'Chat' } = route.params || {};
  const currentUserId = auth.currentUser?.uid;

  // States
  const [chatDetails, setChatDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Message interaction modals
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editText, setEditText] = useState('');

  // Smart Reply Suggestions
  const [smartReplies, setSmartReplies] = useState([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const smartReplyTimerRef = useRef(null);

  // Custom Alert State
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title, message, buttons) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons
    });
  };

  // Fetch chat room details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getChatDetails(chatId);
        if (res.success) {
          setChatDetails(res.data);
        }
      } catch (err) {
        console.warn('Failed to load chat details:', err);
      }
    };
    fetchDetails();
  }, [chatId]);

  // Subscribe to real-time messages polling
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = listenToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      // Mark read on new message receipt
      markMessagesRead(chatId, currentUserId).catch(() => { });
    });

    return () => {
      unsubscribe();
      // Also mark as read on unmount
      markMessagesRead(chatId, currentUserId).catch(() => { });
    };
  }, [chatId, currentUserId]);

  // Auto-scroll to bottom when messages list update
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages]);

  // Fetch smart reply suggestions when a new message arrives from someone else
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    // Only suggest if the last message is not from us
    if (!lastMsg || lastMsg.senderId === currentUserId) return;
    if (!lastMsg.text || lastMsg.text.trim().length === 0) return;

    // Debounce to avoid rapid calls
    if (smartReplyTimerRef.current) clearTimeout(smartReplyTimerRef.current);
    smartReplyTimerRef.current = setTimeout(async () => {
      setIsLoadingReplies(true);
      try {
        const senderName = chatDetails?.participantDetails?.find(p => p.uid === lastMsg.senderId)?.displayName || chatName;
        const isGroup = chatDetails?.isGroup || false;
        const res = await getSmartReplies(lastMsg.text, senderName, isGroup);
        if (res.success && res.data?.replies) {
          setSmartReplies(res.data.replies);
        }
      } catch (err) {
        console.warn('Smart reply fetch failed:', err);
      } finally {
        setIsLoadingReplies(false);
      }
    }, 800);

    return () => {
      if (smartReplyTimerRef.current) clearTimeout(smartReplyTimerRef.current);
    };
  }, [messages.length]);

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    try {
      const res = await sendMessage(chatId, currentUserId, textToSend, '', '');
      if (!res.success) {
        Toast.show({ type: 'error', text1: 'Send Error', text2: res.error || 'Failed to send message.' });
        setInputText(textToSend); // recover
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Send Error', text2: err.message });
      setInputText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachImage = async (useCamera = false) => {
    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera / Gallery permissions are required to share photos.' });
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setIsSending(true);
        const res = await sendMessage(chatId, currentUserId, '', selectedUri, 'image');
        setIsSending(false);
        if (!res.success) {
          Toast.show({ type: 'error', text1: 'Upload Error', text2: res.error || 'Failed to send photo.' });
        }
      }
    } catch (err) {
      setIsSending(false);
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const showAttachmentMenu = () => {
    showAlert(
      'Select Image Source',
      'Choose how you want to add a photo to your chat:',
      [
        {
          text: 'Take Photo',
          icon: 'camera-outline',
          onPress: () => handleAttachImage(true),
        },
        {
          text: 'Choose from Gallery',
          icon: 'image-outline',
          onPress: () => handleAttachImage(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          icon: 'close-outline',
        },
      ],
      'vertical'
    );
  };

  // Hold-to-talk Audio Recording
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Microphone Permission', text2: 'Microphone access is needed for voice notes.' });
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.warn('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        setIsSending(true);
        const res = await sendMessage(chatId, currentUserId, '', uri, 'voice');
        setIsSending(false);
        if (!res.success) {
          Toast.show({ type: 'error', text1: 'Send Error', text2: res.error || 'Failed to send voice message.' });
        }
      }
    } catch (err) {
      console.warn('Failed to stop recording:', err);
    }
  };

  // Actions sheet
  const handleBubbleLongPress = (msg) => {
    setSelectedMessage(msg);
    setEditText(msg.text || '');
    setIsActionModalVisible(true);
  };

  const handleCopyText = () => {
    if (selectedMessage?.text) {
      Clipboard.setString(selectedMessage.text);
    }
    setIsActionModalVisible(false);
  };

  const handleToggleReaction = async (emoji) => {
    if (!selectedMessage) return;
    const msgId = selectedMessage._id || selectedMessage.id;
    setIsActionModalVisible(false);
    try {
      await reactToMessage(chatId, msgId, emoji);
    } catch (err) {
      console.warn('Reaction error:', err);
    }
  };

  const handleStartEditing = () => {
    setIsEditingMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !selectedMessage) return;
    const msgId = selectedMessage._id || selectedMessage.id;
    setIsActionModalVisible(false);
    setIsEditingMode(false);

    try {
      const res = await editMessage(chatId, msgId, editText.trim());
      if (!res.success) {
        Toast.show({ type: 'error', text1: 'Edit Error', text2: res.error || 'Failed to edit message.' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Edit Error', text2: err.message });
    }
  };

  const handleDeleteMsg = () => {
    if (!selectedMessage) return;
    const msgId = selectedMessage._id || selectedMessage.id;
    setIsActionModalVisible(false);

    showAlert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteMessage(chatId, msgId);
              if (!res.success) {
                Toast.show({ type: 'error', text1: 'Delete Error', text2: res.error || 'Failed to delete message.' });
              }
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Delete Error', text2: err.message });
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const otherParticipants = chatDetails?.participantDetails?.filter(p => p.uid !== currentUserId) || [];
  const otherUser = otherParticipants[0];
  const isOnline = otherUser?.isOnline;

  // Header render
  const renderHeader = () => {
    const avatarSource = otherUser?.photoURL
      ? { uri: otherUser.photoURL }
      : null;

    return (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.avatarWrapper}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.placeholderAvatar]}>
                <Text style={styles.initialsText}>
                  {chatName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            {isOnline && !chatDetails?.isGroup && <View style={styles.onlineDot} />}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
            <Text style={styles.headerSub}>
              {chatDetails?.isGroup
                ? `${chatDetails?.participantDetails?.length || 0} members`
                : (isOnline ? 'Online' : 'Offline')}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => Toast.show({ type: 'info', text1: 'Voice Call', text2: 'Simulating call setup.' })}>
            <Ionicons name="call-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => Toast.show({ type: 'info', text1: 'Video Call', text2: 'Simulating video call setup.' })}>
            <Ionicons name="videocam-outline" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Warning Expiry Banner
  const renderExpiryBanner = () => {
    const expiry = chatDetails?.expiryHours || 0;
    if (expiry <= 0) return null;

    // Estimate based on chat creation or default badge
    return (
      <View style={styles.expiryBanner}>
        <Ionicons name="hourglass-outline" size={16} color={COLORS.gold} style={{ marginRight: 8 }} />
        <Text style={styles.expiryText}>
          Disappearing mode active: Messages expire after {expiry} hours.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {renderHeader()}
      {renderExpiryBanner()}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              isMine={item.senderId === currentUserId}
              currentUserId={currentUserId}
              onLongPress={handleBubbleLongPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="rgba(255, 255, 255, 0.15)" />
              <Text style={styles.emptyText}>No messages yet. Send a vibe!</Text>
            </View>
          }
        />

        {/* Smart Reply Suggestions */}
        {smartReplies.length > 0 && inputText.length === 0 && (
          <View style={styles.smartReplyContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smartReplyScroll}>
              {smartReplies.map((reply, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.smartReplyPill}
                  activeOpacity={0.7}
                  onPress={() => {
                    setInputText(reply.text);
                    setSmartReplies([]);
                  }}
                >
                  <Text style={styles.smartReplyText}>{reply.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={showAttachmentMenu}>
            <Ionicons name="add" size={26} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Send a message..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            {/* Hold-to-Talk Recording Mic */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={22}
                color={isRecording ? '#ffffff' : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              onPress={handleSendText}
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
          ) : null}
        </View>
      </KeyboardAvoidingView>

      {/* Action / Reactions Sheet Modal */}
      {selectedMessage && (
        <Modal
          visible={isActionModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsActionModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setIsActionModalVisible(false);
              setIsEditingMode(false);
            }}
          >
            <View style={styles.actionSheetContainer}>
              {/* Reactions Bar */}
              <View style={styles.reactionsBar}>
                {REACTIONS_LIST.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => handleToggleReaction(emoji)}
                    style={styles.reactionBtn}
                  >
                    <Text style={styles.reactionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action options */}
              <View style={styles.actionList}>
                {selectedMessage.text ? (
                  <TouchableOpacity style={styles.actionRow} onPress={handleCopyText}>
                    <Ionicons name="copy-outline" size={20} color="#ffffff" />
                    <Text style={styles.actionRowText}>Copy Text</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Edit Message if sent by current user, text only, and sent less than 15 mins ago */}
                {selectedMessage.senderId === currentUserId && selectedMessage.text && (
                  <TouchableOpacity style={styles.actionRow} onPress={handleStartEditing}>
                    <Ionicons name="create-outline" size={20} color="#ffffff" />
                    <Text style={styles.actionRowText}>Edit Message</Text>
                  </TouchableOpacity>
                )}

                {selectedMessage.senderId === currentUserId && (
                  <TouchableOpacity style={[styles.actionRow, styles.actionRowDanger]} onPress={handleDeleteMsg}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={[styles.actionRowText, styles.actionRowTextDanger]}>Delete Message</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Editing Message Inline Popup */}
      <Modal
        visible={isEditingMode}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditingMode(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editModalContainer}
        >
          <View style={styles.editBox}>
            <Text style={styles.editBoxTitle}>Edit Message</Text>
            <TextInput
              style={styles.editBoxInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
            />
            <View style={styles.editActionsRow}>
              <TouchableOpacity
                style={styles.editBtnSave}
                onPress={handleSaveEdit}
              >
                <Text style={styles.editBtnTextSave}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editBtnCancel}
                onPress={() => setIsEditingMode(false)}
              >
                <Text style={styles.editBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={customAlert.visible}
        onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  placeholderAvatar: {
    backgroundColor: '#4f6ef7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 14,
    ...FONTS.bold,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 11,
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
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
  },
  expiryText: {
    fontSize: 11,
    color: '#f59e0b',
    ...FONTS.medium,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
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
  micBtn: {
    padding: 6,
    marginLeft: 6,
    borderRadius: 18,
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
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

  /* Smart Reply Suggestions */
  smartReplyContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 40, 133, 0.2)',
    backgroundColor: COLORS.background,
  },
  smartReplyScroll: {
    paddingHorizontal: 12,
  },
  smartReplyPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  smartReplyText: {
    color: '#e0d4ff',
    fontSize: 13,
    ...FONTS.medium,
  },

  /* Action Modal Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 2, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderTopWidth: 1.5,
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  reactionBtn: {
    padding: 8,
  },
  reactionText: {
    fontSize: 24,
  },
  actionList: {
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionRowDanger: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionRowText: {
    color: '#ffffff',
    fontSize: 15,
    marginLeft: 12,
    ...FONTS.bold,
  },
  actionRowTextDanger: {
    color: '#ef4444',
  },

  /* Editing Modal Box */
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 2, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editBox: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    padding: 20,
  },
  editBoxTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: '#ffffff',
    marginBottom: 12,
  },
  editBoxInput: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderColor: 'rgba(167, 139, 250, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  editBtnTextCancel: {
    color: COLORS.textMuted,
    ...FONTS.bold,
  },
  editBtnSave: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  editBtnTextSave: {
    color: '#ffffff',
    ...FONTS.bold,
  },
});