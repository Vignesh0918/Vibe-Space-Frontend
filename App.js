/**
 * App.js
 * 
 * Application entry point for VibeSpace.
 * Wraps routing in Redux Providers, PersistGate, SafeAreaProvider, and GestureHandlerRootView.
 * Handles custom font loading placeholders and monitors app foreground/background cycles to sync user online status.
 */

import React, { useEffect, useState } from 'react';
import { AppState, StatusBar, StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Expo AV has been deprecated',
]);

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Safe copy helper to avoid crashing if deprecated Clipboard is removed
const setClipboardString = (str) => {
  try {
    const Clipboard = require('react-native').Clipboard;
    if (Clipboard && Clipboard.setString) {
      Clipboard.setString(str);
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
};

// Error Boundary to catch any JS-level exceptions and render an actionable trace page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught app crash:", error, errorInfo);
  }

  handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error ? this.state.error.toString() : ''}\n\nComponent Stack:\n${this.state.errorInfo ? this.state.errorInfo.componentStack : ''}`;
    const success = setClipboardString(errorDetails);
    if (success) {
      alert('Error details copied to clipboard!');
    } else {
      alert('Could not copy automatically. Please take a screenshot!');
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <ScrollView contentContainerStyle={errorStyles.scroll}>
            <Text style={errorStyles.title}>🛸 VibeSpace Crash Guard</Text>
            <Text style={errorStyles.subtitle}>
              A cosmic anomaly occurred, causing a crash. Help us align the stars by sharing this error:
            </Text>
            
            <View style={errorStyles.errorBox}>
              <Text style={errorStyles.errorHeader}>Error Message:</Text>
              <Text style={errorStyles.errorMessage}>
                {this.state.error && this.state.error.toString()}
              </Text>
              
              <Text style={errorStyles.errorHeader}>Component Stack Trace:</Text>
              <Text style={errorStyles.stackTrace}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </Text>
            </View>

            <TouchableOpacity style={errorStyles.button} onPress={this.handleCopyError}>
              <Text style={errorStyles.buttonText}>📋 Copy Error Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[errorStyles.button, errorStyles.secondaryButton]} onPress={this.handleReset}>
              <Text style={errorStyles.buttonText}>🔄 Try Restarting App</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0533',
    paddingTop: 50,
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#a78bfa',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#2d1054',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 24,
  },
  errorHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  errorMessage: {
    fontSize: 14,
    color: '#ff4b4b',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  stackTrace: {
    fontSize: 11,
    color: '#d1d5db',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#8b5cf6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as Font from 'expo-font';

import { store, persistor } from './src/store';
import RootNavigator from './src/navigation';
import Loader from './src/components/common/Loader';
import { auth, db } from './src/services/firebase';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { COLORS, FONTS } from './src/constants/theme';

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: COLORS.success || '#10b981', backgroundColor: COLORS.surface || '#2d1054' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        ...FONTS.bold,
        color: '#ffffff'
      }}
      text2Style={{
        fontSize: 13,
        ...FONTS.medium,
        color: '#d1d5db'
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: COLORS.danger || '#ef4444', backgroundColor: COLORS.surface || '#2d1054' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        ...FONTS.bold,
        color: '#ffffff'
      }}
      text2Style={{
        fontSize: 13,
        ...FONTS.medium,
        color: '#d1d5db'
      }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: COLORS.primary || '#a78bfa', backgroundColor: COLORS.surface || '#2d1054' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        ...FONTS.bold,
        color: '#ffffff'
      }}
      text2Style={{
        fontSize: 13,
        ...FONTS.medium,
        color: '#d1d5db'
      }}
    />
  )
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load custom fonts using expo-font
  useEffect(() => {
    async function loadFonts() {
      try {
        // Load custom fonts or fallback vector icon fonts
        await Font.loadAsync({
          // Add custom font mappings here when assets are ready, e.g.
          // 'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });
      } catch (error) {
        console.warn('Error loading custom fonts:', error);
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Sync user isOnline status in Firebase based on AppState cycles
  useEffect(() => {
    const syncOnlineStatus = async (nextState) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          isOnline: nextState === 'active',
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.warn('Failed to update online state in firestore:', error);
      }
    };

    // Update status immediately on mount
    syncOnlineStatus(AppState.currentState);

    // Subscribe to state change events
    const subscription = AppState.addEventListener('change', syncOnlineStatus);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return <Loader overlay />;
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<Loader overlay />} persistor={persistor}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <StatusBar barStyle="light-content" backgroundColor="#1a0533" />
              <RootNavigator />
              <Toast config={toastConfig} />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

// NOTE: babel.config.js must contain 'react-native-reanimated/plugin' as the last entry in the plugins array.
