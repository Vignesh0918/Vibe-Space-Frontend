import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function CirclePicker() {
  return (
    <View style={styles.picker}>
      <Text style={styles.text}>Circle Selector Dropdown</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { padding: 12, borderWidth: 1, borderColor: '#4c2885' },
  text: { color: '#fff' }
});