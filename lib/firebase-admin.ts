import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let _adminAuth: Auth | undefined;
let _adminDb: Firestore | undefined;
let initError: string | null = null;

if (getApps().length === 0) {
  try {
    // Preferred: full service account JSON in a single env var
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mesira-argentina.firebasestorage.app",
      });
    } else {
      // Fallback: individual env vars
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!privateKey || !clientEmail) {
        initError = "Variables de entorno de Firebase Admin no configuradas (FIREBASE_SERVICE_ACCOUNT_KEY o FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL).";
        console.error("Firebase admin init skipped:", initError);
      } else {
        // Clean up the private key
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          try { privateKey = JSON.parse(privateKey) as string; } catch { /* ignore */ }
        }
        privateKey = privateKey.replace(/\\n/g, "\n");

        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mesira-argentina",
            clientEmail,
            privateKey,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mesira-argentina.firebasestorage.app",
        });
      }
    }

    if (adminApp) {
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
