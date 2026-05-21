import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function PostCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>Post Card Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: COLORS.card, borderRadius: 8, marginVertical: 8 },
  text: { color: '#fff' }
});