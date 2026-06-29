import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase configuration is complete
export const isFirebaseConfigured = 
  typeof window !== "undefined" &&
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app: any;
let auth: any = null;
let db: any = null;
let storage: any = null;
const googleProvider = new GoogleAuthProvider();

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

export const getClientMessaging = async () => {
  if (typeof window !== "undefined" && isFirebaseConfigured && app) {
    try {
      const supported = await isSupported();
      if (supported) {
        return getMessaging(app);
      }
    } catch (e) {
      console.warn("FCM is not supported in this browser:", e);
    }
  }
  return null;
};

export { auth, db, storage, googleProvider };

