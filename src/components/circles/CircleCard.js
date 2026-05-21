import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function CircleCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>Circle Grid Item</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, backgroundColor: '#2d1054', borderRadius: 12 },
  text: { color: '#fff' }
});