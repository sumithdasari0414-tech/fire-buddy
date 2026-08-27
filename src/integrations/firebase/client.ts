// Centralized Firebase initialization (Web SDK only — no Admin SDK / service accounts).
// Replace the placeholder values below with the "Web app" config from your Firebase project
// (Project settings > Your apps > SDK setup and configuration). These values are publishable.
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const isFirebaseConfigured = !firebaseConfig.apiKey?.startsWith("YOUR_");

// Reuse the app across HMR reloads.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
