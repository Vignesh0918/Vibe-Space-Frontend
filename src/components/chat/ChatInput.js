import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function ChatInput() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>Chat Input Bar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 12, backgroundColor: '#2d1054' },
  text: { color: '#fff' }
});