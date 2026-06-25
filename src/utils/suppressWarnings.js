import { LogBox } from 'react-native';

// Suppress the warning inside the React Native LogBox UI
LogBox.ignoreLogs([
  'Expo AV has been deprecated',
]);

// Intercept early evaluations before App rendering begins
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args && args.length > 0 && typeof args[0] === 'string' && (args[0].includes('Expo AV has been deprecated') || args[0].includes('expo-av'))) {
    return;
  }
  originalWarn(...args);
};
