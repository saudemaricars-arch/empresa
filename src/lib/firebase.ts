import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDR2680TnGtrAZwMLDshDeRk_OSjb7c0Og",
  authDomain: "empresa-251ac.firebaseapp.com",
  projectId: "empresa-251ac",
  storageBucket: "empresa-251ac.firebasestorage.app",
  messagingSenderId: "681749321907",
  appId: "1:681749321907:web:e90df5f3c00cc61495b8c6",
  measurementId: "G-TCFHG0Z552"
};

// Inicializa somente uma vez (hot reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore — banco principal
export const db = getFirestore(app);

// Auth — sistema de login
export const auth = getAuth(app);

// Analytics (opcional, só em browsers com suporte)
isSupported().then((ok) => {
  if (ok) getAnalytics(app);
});

// Storage — para arquivos e imagens
export const storage = getStorage(app);

export default app;
