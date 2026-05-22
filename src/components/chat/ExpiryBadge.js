import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * ExpiryBadge
 * Calculates time remaining until auto-delete.
 * Renders hourglass icon and countdown string (e.g. 23h 45m).
 * Shifting colors: Green (>6h), Amber (1-6h), and Red (<1h).
 */
export default function ExpiryBadge({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [color, setColor] = useState('#10b981'); // Green (>6h)

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTime = () => {
      const difference = new Date(expiresAt) - new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        setColor('#ef4444'); // Red
        return;
      }

      const diffMins = Math.floor(difference / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours >= 6) {
        setColor('#10b981'); // Green
      } else if (hours >= 1) {
        setColor('#f59e0b'); // Amber
      } else {
        setColor('#ef4444'); // Red
      }

      let timeString = '';
      if (hours > 0) {
        timeString += `${hours}h `;
      }
      timeString += `${mins}m`;
      setTimeLeft(timeString);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // minute-interval updates

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Ionicons name="hourglass-outline" size={11} color={color} style={styles.icon} />
      <Text style={[styles.text, { color }]}>{timeLeft}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(26, 5, 51, 0.75)',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  }
});