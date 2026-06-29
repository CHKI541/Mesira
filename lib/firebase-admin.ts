import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminAuth: any = null;
let adminDb: any = null;

if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    let adminApp;
    if (getApps().length === 0) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey) {
        // Trim first to handle trailing spaces/newlines
        privateKey = privateKey.trim();
        // Strip surrounding quotes if present
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
          privateKey = privateKey.slice(1, -1);
        }
        // Trim again to handle potential trailing spaces/newlines inside the quotes
        privateKey = privateKey.trim();
        // Replace escaped newline characters
        privateKey = privateKey.replace(/\\n/g, "\n");
      }

      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mesira-argentina",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } else {
      adminApp = getApp();
    }

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
} else {
  console.warn("Firebase Admin credentials (FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY) are missing. Skipping admin initialization.");
}

export { adminAuth, adminDb };

