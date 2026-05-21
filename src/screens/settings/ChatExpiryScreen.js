import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

export default function ChatExpiryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State for chosen expiry option
  const [selectedOption, setSelectedOption] = useState('off');

  const expiryOptions = [
    { id: 'off', label: 'Off', iconName: 'ban-outline' },
    { id: '24h', label: '24 Hours', iconName: 'time-outline' },
    { id: '7d', label: '7 Days', iconName: 'grid-outline' },
    { id: '30d', label: '30 Days', iconName: 'calendar-outline' },
  ];

  const handleSave = () => {
    alert(`Message expiry set to: ${selectedOption === 'off' ? 'Off' : selectedOption}`);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#130424" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Expiry</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => alert('Options')}>
          <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stopwatch visual card */}
        <View style={styles.visualCardContainer}>
          <View style={styles.stopwatchCard}>
            <Ionicons name="timer-outline" size={72} color="#c084fc" />
            <View style={styles.trashBadge}>
              <Ionicons name="trash" size={16} color="#ffffff" />
            </View>
          </View>
        </View>

        {/* Subtext description */}
        <Text style={styles.descriptionText}>
          New messages in this chat will auto-delete after the selected time.
        </Text>

        {/* Selection options */}
        <View style={styles.optionsContainer}>
          {expiryOptions.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.8}
                onPress={() => setSelectedOption(option.id)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.iconName}
                    size={22}
                    color={isSelected ? '#c084fc' : '#a78bfa'}
                    style={styles.optionIcon}
                  />
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </View>

                {/* Radio Button */}
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note box */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={20} color="#60a5fa" style={styles.noteIcon} />
          <Text style={styles.noteText}>
            This setting won't affect messages already sent in the chat.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={[styles.saveButton, SHADOWS.medium]} activeOpacity={0.85} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#130424', // Deep aesthetic dark purple background
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 40, 133, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  visualCardContainer: {
    marginVertical: 16,
  },
  stopwatchCard: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 16, 84, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trashBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ec4899', // Pinkish trash badge
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#130424',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#a78bfa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
    opacity: 0.9,
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  optionCard: {
    width: '100%',
    height: 60,
    backgroundColor: 'rgba(45, 16, 84, 0.25)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: '#4f6ef7', // Light blue/purple border highlight
    backgroundColor: 'rgba(79, 110, 247, 0.05)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 14,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a78bfa',
  },
  optionLabelSelected: {
    color: '#ffffff',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#b5c4ff', // Light lavender radio border
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#b5c4ff',
  },
  noteBox: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.15)',
    flexDirection: 'row',
    padding: 14,
    marginBottom: 32,
    alignItems: 'center',
  },
  noteIcon: {
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#b5c4ff', // Clean light lavender
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#130424', // Dark text contrast
  },
});