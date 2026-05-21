import axios from 'axios';
import { Platform } from 'react-native';
import { auth } from './firebase';

// On Android emulators, 10.0.2.2 routes to the host machine's localhost.
// On iOS simulators, localhost (or 127.0.0.1) routes directly to the host machine.
// For physical devices running Expo, replace with your local network IP (e.g. 'http://192.168.1.X:5000').
const getBaseUrl = () => {
  return 'https://luann-interprofessional-verbally.ngrok-free.dev';
};

const API_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject Bearer token from Firebase Auth
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Attempt to get ID token. Fallback to UID in dev if token retrieval fails.
        let token;
        try {
          token = await currentUser.getIdToken();
        } catch {
          token = currentUser.uid;
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('API Interceptor: Failed to attach authorization token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_URL };
