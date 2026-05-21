/**
 * MainNavigator.js
 * 
 * Bottom tab navigator orchestrating the primary flows: Home, Circles, Add Post, Chats, and Profile.
 * Incorporates a fully custom tab bar containing a glowing center "+" button and chat badge counters.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { SCREENS } from '../constants';
import { COLORS, SHADOWS, SIZES, FONTS } from '../constants/theme';

// Import sub-stacks
import { HomeStack, CirclesStack, ChatsStack, ProfileStack } from './HomeStack';
import AddPostScreen from '../screens/main/AddPostScreen';

const Tab = createBottomTabNavigator();

/**
 * Custom Tab Bar Component
 * Renders custom layout, badge logic, and the elevated gradient Add button.
 */
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useSelector((state) => state.chat);

  // Check if we should hide the tab bar on StoryViewer or PostDetail screens.
  // We inspect the navigation state of the currently active tab (HomeTab).
  const activeTabRoute = state.routes[state.index];
  let shouldHideTabBar = false;

  if (activeTabRoute.name === SCREENS.HOME_TAB && activeTabRoute.state) {
    const nestedRoutes = activeTabRoute.state.routes;
    const activeNestedIndex = activeTabRoute.state.index;
    if (nestedRoutes && nestedRoutes[activeNestedIndex]) {
      const activeNestedName = nestedRoutes[activeNestedIndex].name;
      if (activeNestedName === SCREENS.STORY_VIEWER || activeNestedName === SCREENS.POST_DETAIL) {
        shouldHideTabBar = true;
      }
    }
  }

  if (shouldHideTabBar) {
    return null;
  }

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            if (route.name === SCREENS.HOME_TAB) {
              navigation.navigate(SCREENS.HOME_TAB, { screen: SCREENS.HOME });
            } else if (route.name === SCREENS.CIRCLES_TAB) {
              navigation.navigate(SCREENS.CIRCLES_TAB, { screen: SCREENS.CIRCLES });
            } else if (route.name === SCREENS.CHATS_TAB) {
              navigation.navigate(SCREENS.CHATS_TAB, { screen: SCREENS.CHAT_LIST });
            } else if (route.name === SCREENS.PROFILE_TAB) {
              navigation.navigate(SCREENS.PROFILE_TAB, { screen: SCREENS.PROFILE });
            } else {
              navigation.navigate(route.name, route.params);
            }
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Render Add Post button uniquely
        if (route.name === SCREENS.ADD_POST_TAB) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.85}
              style={styles.centerButtonContainer}
              accessibilityRole="button"
              accessibilityLabel="Add post"
            >
              <LinearGradient
                colors={['#8b5cf6', '#4f6ef7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.centerButton, SHADOWS.large]}
              >
                <Ionicons name="add" size={28} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        // Determine icon names and label text
        let iconName = '';
        let displayLabel = '';

        if (route.name === SCREENS.HOME_TAB) {
          iconName = isFocused ? 'home' : 'home-outline';
          displayLabel = 'Home';
        } else if (route.name === SCREENS.CIRCLES_TAB) {
          iconName = isFocused ? 'people' : 'people-outline';
          displayLabel = 'Circles';
        } else if (route.name === SCREENS.CHATS_TAB) {
          iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
          displayLabel = 'Chats';
        } else if (route.name === SCREENS.PROFILE_TAB) {
          iconName = isFocused ? 'person' : 'person-outline';
          displayLabel = 'Profile';
        }

        const iconColor = isFocused ? COLORS.primary : (COLORS.textMuted || '#a0a0b0');

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={24} color={iconColor} />
              {route.name === SCREENS.CHATS_TAB && unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: iconColor }]}>
              {displayLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name={SCREENS.HOME_TAB}
        component={HomeStack}
      />
      <Tab.Screen
        name={SCREENS.CIRCLES_TAB}
        component={CirclesStack}
      />
      <Tab.Screen
        name={SCREENS.ADD_POST_TAB}
        component={AddPostScreen}
      />
      <Tab.Screen
        name={SCREENS.CHATS_TAB}
        component={ChatsStack}
      />
      <Tab.Screen
        name={SCREENS.PROFILE_TAB}
        component={ProfileStack}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card || '#2d1054',
    borderTopWidth: 1,
    borderTopColor: COLORS.border || 'rgba(255,255,255,0.1)',
    height: 80,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    ...FONTS.medium,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  centerButton: {
    top: -20, // Elevates the plus button above tab bar
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background || '#1a0533',
  },
  badgeContainer: {
    position: 'absolute',
    right: -8,
    top: -6,
    backgroundColor: COLORS.danger || '#ef4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.card || '#2d1054',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    ...FONTS.bold,
    textAlign: 'center',
  },
});
