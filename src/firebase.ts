// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// BURAYA KENDİ FIREBASE BİLGİLERİNİZİ YAPIŞTIRIN
const firebaseConfig = {
  apiKey: "AIzaSyDyzqGDcTVJU1HIPRQO8KKRh-dQZDZskzM",
  authDomain: "bosfor-tekstil-79352.firebaseapp.com",
  projectId: "bosfor-tekstil-79352",
  storageBucket: "bosfor-tekstil-79352.firebasestorage.app",
  messagingSenderId: "906908262702",
  appId: "1:906908262702:web:37803b23210fdaf5131abf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);