/**
 * firebase.js (src/config/firebase.js)
 * 
 * Re-exports initialized modules from src/services/firebase.js to avoid
 * duplicate initialization errors while maintaining compatibility for components.
 */

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
  increment,
  FieldValue,
  timestamp
} from '../services/firebase';

import appInstance from '../services/firebase';
export default appInstance;
