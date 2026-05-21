import React from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';

export default function StoryRow() {
  return (
    <ScrollView horizontal style={styles.row}>
      <Text style={styles.text}>Story Row Component</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 8 },
  text: { color: '#fff' }
});