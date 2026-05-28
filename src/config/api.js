import axios from 'axios';
import { Platform } from 'react-native';
import { auth } from './firebase';

// Development Ngrok URL or production endpoint constant
//const API_URL = 'https://luann-interprofessional-verbally.ngrok-free.dev';
const API_URL = 'https://vibe-space-production.up.railway.app';

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
