import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function ChatListItem() {
  return (
    <View style={styles.item}>
      <Text style={styles.text}>Chat Preview Item</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#2d1054' },
  text: { color: '#fff' }
});