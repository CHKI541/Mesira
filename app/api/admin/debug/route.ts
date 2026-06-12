import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {};

  // 1. Check env vars exist (without revealing full values)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  diagnostics.envVars = {
    FIREBASE_PRIVATE_KEY: privateKey
      ? `SET (length=${privateKey.length}, starts="${privateKey.substring(0, 30)}...", ends="...${privateKey.substring(privateKey.length - 30)}")`
      : "NOT SET",
    FIREBASE_CLIENT_EMAIL: clientEmail
      ? `SET (value="${clientEmail}")`
      : "NOT SET",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId || "NOT SET",
  };

  // 2. Try to initialize firebase-admin
  try {
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");

    // 3. Try to access adminDb (this triggers the proxy)
    try {
      const testCollection = adminDb.collection("products");
      diagnostics.adminDb = `OK - got collection reference: ${typeof testCollection}`;
    } catch (dbErr: any) {
      diagnostics.adminDb = `ERROR: ${dbErr.message}`;
    }

    // 4. Try to access adminAuth
    try {
      const authCheck = typeof adminAuth.verifyIdToken;
      diagnostics.adminAuth = `OK - verifyIdToken is ${authCheck}`;
    } catch (authErr: any) {
      diagnostics.adminAuth = `ERROR: ${authErr.message}`;
    }
  } catch (importErr: any) {
    diagnostics.importError = `IMPORT FAILED: ${importErr.message}`;
    diagnostics.importStack = importErr.stack?.substring(0, 500);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
