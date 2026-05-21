import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function ReactionBar() {
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>Reactions Bar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', padding: 4 },
  text: { color: '#fff' }
});