/// <reference types="vite/client" />
// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore } from "firebase/firestore";

// Helper function to safely get env variables
const getEnv = (key: string) => {
  // Check import.meta.env first (Vite)
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Fallback for some build environments
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

// Firebase configuration
// We try to use environment variables first.
// If they are missing during local dev or specific build phases, we handle it gracefully.
export const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID")
};

// Validate config to prevent white screen of death
// We only log a warning instead of stopping execution, to allow the build to proceed
const isConfigValid = Object.values(firebaseConfig).every(value => !!value);

if (!isConfigValid) {
  console.warn("Firebase Environment Variables might be missing. Checking connection...");
}

// Initialize Firebase
let app;
let dbInstance;

try {
  // Even if config is partial, we try to initialize to catch specific errors later
  // @ts-ignore - Firebase types might complain about partial config but runtime handles it
  app = initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// Export database connection
export const db = dbInstance;
