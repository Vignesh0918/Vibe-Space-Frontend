import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function StoryCircle() {
  return (
    <View style={styles.circle}>
      <Text style={styles.text}>Story</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2d1054', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 10 }
});