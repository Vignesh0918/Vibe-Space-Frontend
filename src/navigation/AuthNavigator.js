/**
 * AuthNavigator.js
 * 
 * Stack navigator coordinating authentication screens: Splash, Onboarding, Login, OTP, and Profile Setup.
 * Employs tailored slide/fade animations and helper functions for transitions.
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SCREENS } from '../constants';
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createStackNavigator();

/**
 * Transition Helper: Navigates to the Login screen.
 * 
 * @param {object} navigation - React Navigation controller
 */
export function navigateToLogin(navigation) {
  navigation.navigate(SCREENS.LOGIN);
}

/**
 * Transition Helper: Navigates to the OTP Verification screen with params.
 * 
 * @param {object} navigation - React Navigation controller
 * @param {string} phone - User-inputted phone number
 */
export function navigateToOTP(navigation, phone) {
  navigation.navigate(SCREENS.OTP, { phoneNumber: phone });
}

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.ONBOARDING}
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false,
        cardStyle: { backgroundColor: '#1a0533' }
      }}
    >
      <Stack.Screen 
        name={SCREENS.SPLASH} 
        component={SplashScreen} 
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        }}
      />
      <Stack.Screen 
        name={SCREENS.ONBOARDING} 
        component={OnboardingScreen} 
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        }}
      />
      <Stack.Screen 
        name={SCREENS.LOGIN} 
        component={LoginScreen} 
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
      <Stack.Screen 
        name={SCREENS.OTP} 
        component={OTPScreen} 
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
      <Stack.Screen 
        name={SCREENS.PROFILE_SETUP} 
        component={ProfileSetupScreen} 
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
    </Stack.Navigator>
  );
}
