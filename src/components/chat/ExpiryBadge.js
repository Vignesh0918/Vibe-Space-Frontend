import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function ExpiryBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Expires in 24h</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { padding: 4, backgroundColor: '#ec4899', borderRadius: 4 },
  text: { color: '#fff', fontSize: 10 }
});