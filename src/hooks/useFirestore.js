/**
 * useFirestore.js
 * Custom Firestore hooks providing reactive document listeners,
 * reactive collection query listeners, and one-time fetch query executions.
 */

import { useState, useEffect } from 'react';
import { collection, doc, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Listens to a single document in Firestore in real-time.
 * @param {string} collectionPath - Name or path of the collection.
 * @param {string} docId - Unique document ID.
 * @returns {{data: any, loading: boolean, error: string|null}}
 */
export function useDocument(collectionPath, docId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, collectionPath, docId);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setData({ id: snapshot.id, ...snapshot.data() });
      } else {
        setData(null);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionPath, docId]);

  return { data, loading, error };
}

/**
 * Listens to a query on a Firestore collection in real-time.
 * Pass queryConstraints (e.g. where, orderBy, limit) and an explicit deps list to trigger updates.
 * @param {string} collectionPath - Name of the collection.
 * @param {any[]} queryConstraints - Array of query constraints.
 * @param {any[]} deps - Dependency array to trigger query rebuilding.
 * @returns {{data: array, loading: boolean, error: string|null}}
 */
export function useCollection(collectionPath, queryConstraints = [], deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const collectionRef = collection(db, collectionPath);
    let q = query(collectionRef, ...queryConstraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach((docSnap) => {
        docs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setData(docs);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionPath, ...deps]);

  return { data, loading, error };
}

/**
 * Executes a one-time fetch query on a collection.
 * @param {string} collectionPath - Name of the collection.
 * @param {any[]} queryConstraints - Array of query constraints.
 * @param {any[]} deps - Dependency array to trigger refetch.
 * @returns {{data: array, loading: boolean, error: string|null, refetch: function}}
 */
export function useFirestoreQuery(collectionPath, queryConstraints = [], deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const collectionRef = collection(db, collectionPath);
      const q = query(collectionRef, ...queryConstraints);
      const snapshot = await getDocs(q);
      const docs = [];
      snapshot.forEach((docSnap) => {
        docs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setData(docs);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectionPath, ...deps]);

  return { data, loading, error, refetch: fetchData };
}
