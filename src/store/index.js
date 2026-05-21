/**
 * store/index.js
 * Configures the Redux store with redux-persist for offline caching of user session state.
 * Combines auth, user, post, chat, and circle slices.
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer, 
  FLUSH, 
  REHYDRATE, 
  PAUSE, 
  PERSIST, 
  PURGE, 
  REGISTER 
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import postReducer from './slices/postSlice';
import chatReducer from './slices/chatSlice';
import circleReducer from './slices/circleSlice';

// Combine all 5 features reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  post: postReducer,
  chat: chatReducer,
  circle: circleReducer,
});

// Configure redux-persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Cache auth state and profiles; sync feed, chats, and circles live from Firestore
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions since they contain non-serializable objects (promises/functions)
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
