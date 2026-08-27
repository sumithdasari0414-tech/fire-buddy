// Centralized Firebase initialization (Web SDK only — no Admin SDK / service accounts).
// Replace the placeholder values below with the "Web app" config from your Firebase project
// (Project settings > Your apps > SDK setup and configuration). These values are publishable.
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyATqchO2SbhQR3ToUOLqrehGOFy-cSoMFg",
  authDomain: "fire-buddy-f33c5.firebaseapp.com",
  projectId: "fire-buddy-f33c5",
  storageBucket: "fire-buddy-f33c5.firebasestorage.app",
  messagingSenderId: "870857085995",
  appId: "1:870857085995:web:d83a3777d6f2ab272f066e",
  measurementId: "G-1W33N6FJXV",
};

export const isFirebaseConfigured = !firebaseConfig.apiKey?.startsWith("YOUR_");

// Reuse the app across HMR reloads.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
