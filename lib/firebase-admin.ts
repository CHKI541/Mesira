import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let _adminAuth: Auth | undefined;
let _adminDb: Firestore | undefined;
let initError: string | null = null;

if (getApps().length === 0) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    if (clientEmail) {
      if (clientEmail.startsWith('"') && clientEmail.endsWith('"')) {
        clientEmail = clientEmail.slice(1, -1);
      }
      if (clientEmail.startsWith("'") && clientEmail.endsWith("'")) {
        clientEmail = clientEmail.slice(1, -1);
      }
    }

    if (!privateKey || !clientEmail) {
      initError = "Variables de entorno de Firebase Admin no configuradas (FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL).";
      console.error("Firebase admin init skipped:", initError);
    } else {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mesira-argentina",
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mesira-argentina.firebasestorage.app",
      });
      _adminAuth = getAuth(adminApp);
      _adminDb = getFirestore(adminApp);
    }
  } catch (error: any) {
    initError = error.message || "Error desconocido al inicializar Firebase Admin.";
    console.error("Firebase admin initialization error:", error);
  }
} else {
  const existingApp = getApps()[0];
  try {
    _adminAuth = getAuth(existingApp);
    _adminDb = getFirestore(existingApp);
  } catch (error: any) {
    initError = error.message;
    console.error("Firebase admin get services error:", error);
  }
}

// Safe getters that throw a clear JSON-serializable error instead of crashing the module
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_adminAuth) {
      throw new Error(initError || "Firebase Admin Auth no está inicializado.");
    }
    return (_adminAuth as any)[prop];
  }
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_adminDb) {
      throw new Error(initError || "Firebase Admin Firestore no está inicializado.");
    }
    return (_adminDb as any)[prop];
  }
});
