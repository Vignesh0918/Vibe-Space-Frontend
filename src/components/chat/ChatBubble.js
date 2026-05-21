import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function ChatBubble() {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>Message text</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 12, backgroundColor: COLORS.chat.senderBubble, borderRadius: 12, maxWidth: '80%' },
  text: { color: '#fff' }
});