/// <reference types="vite/client" />
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables
// These keys must be set in Netlify Site Settings > Build & deploy > Environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate config to prevent white screen of death
const isConfigValid = Object.values(firebaseConfig).every(value => !!value);

if (!isConfigValid) {
  console.error("Firebase Environment Variables are missing! Please check Netlify settings.");
}

// Initialize Firebase
// We use a try-catch block to prevent the entire app from crashing during build/start if keys are missing
let app;
let dbInstance;

try {
  app = initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// Export database connection
export const db = dbInstance;