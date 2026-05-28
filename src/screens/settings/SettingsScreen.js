/**
 * SettingsScreen.js
 * 
 * High-fidelity Settings Screen for VibeSpace.
 * Migrated from the original Profile screen options list.
 */

import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/theme';
import { SCREENS } from '../../constants';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { logoutThunk } from '../../store/slices/authSlice';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={28} color="#ffffff" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Settings</Text>
      
      <View style={styles.headerPlaceholder} />
    </View>
  );

  return (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }
    ]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Options List */}
        <View style={styles.optionsListContainer}>
          {/* Account & Privacy */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.optionCard}
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Account & Privacy',
              text2: 'Open account details setup.'
            })}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(79, 110, 247, 0.15)' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#4f6ef7" />
              </View>
              <Text style={styles.optionTitle}>Account & Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Chat Expiry Settings */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.optionCard}
            onPress={() => navigation.navigate(SCREENS.CHAT_EXPIRY)}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="time-outline" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.optionTextColumn}>
                <Text style={styles.optionTitle}>Chat Expiry Settings ⏳</Text>
                <Text style={styles.optionSubtitle}>24 HOURS ACTIVE</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Circle Permissions */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.optionCard}
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Circle Permissions',
              text2: 'Manage circles entry access policies.'
            })}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="people-outline" size={20} color="#ec4899" />
              </View>
              <Text style={styles.optionTitle}>Circle Permissions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.optionCard}
            onPress={() => navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.NOTIFICATIONS })}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="notifications-outline" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.optionTitle}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>


          {/* Delete Account */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.optionCard}
            onPress={() => Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => alert('Account deleted') }
            ])}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </View>
              <Text style={styles.optionTitle}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.logoutButton}
          onPress={() => Alert.alert(
            'Logout',
            'Are you sure you want to logout from VibeSpace?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Logout', 
                style: 'destructive', 
                onPress: () => {
                  dispatch(logoutThunk());
                }
              }
            ]
          )}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer Details */}
        <Text style={styles.footerText}>
          VIBESPACE V2.4.0 • BUILT FOR THE NIGHT
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#1a0533',
  },
  scrollContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.background || '#1a0533',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 0.5,
    ...FONTS.bold,
  },
  optionsListContainer: {
    paddingHorizontal: 16,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card || '#2d1054',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.12)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextColumn: {
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#ffffff',
  },
  optionSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted || '#a78bfa',
    ...FONTS.bold,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    ...FONTS.bold,
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 11,
    ...FONTS.bold,
    letterSpacing: 1,
    marginBottom: 16,
  },
});