// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore } from "firebase/firestore";

// Sizin sağladığınız Firebase yapılandırması
export const firebaseConfig = {
  apiKey: "AIzaSyDyzqGDcTVJU1HIPRQO8KKRh-dQZDZskzM",
  authDomain: "bosfor-tekstil-79352.firebaseapp.com",
  projectId: "bosfor-tekstil-79352",
  storageBucket: "bosfor-tekstil-79352.firebasestorage.app",
  messagingSenderId: "906908262702",
  appId: "1:906908262702:web:37803b23210fdaf5131abf"
};

// Firebase başlatma
const app = initializeApp(firebaseConfig);

// Veritabanı bağlantısı
export const db = getFirestore(app);