/**
 * firebase.js
 * 
 * Initializes and configures the Firebase modular SDK services.
 * Integrates AsyncStorage for persistent Authentication states.
 * Exports Firestore utilities, GeoPoints, Timestamps, and array/increment mutations.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  GeoPoint, 
  Timestamp, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove, 
  increment 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Paste your Firebase Config from the Firebase Console here.
// In development, these values are loaded from environment variables using react-native-dotenv.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Initialize Firebase App
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Firebase Auth with React Native Persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Fallback in case auth was already initialized
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Cloud Storage
const storage = getStorage(app);

// FieldValue compatibility mapping for legacy style arrayUnion/arrayRemove/increment calls
export const FieldValue = {
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
};

// Helper timestamp function shortcut
export const timestamp = serverTimestamp;

export { 
  app, 
  auth, 
  db, 
  storage, 
  GeoPoint, 
  Timestamp, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove, 
  increment 
};
