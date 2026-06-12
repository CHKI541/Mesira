import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: Record<string, any> = {};

  // 1. Check raw env var
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  diagnostics.envVars = {
    FIREBASE_PRIVATE_KEY_length: rawKey ? rawKey.length : "NOT SET",
    FIREBASE_PRIVATE_KEY_startsWithQuote: rawKey ? rawKey.startsWith('"') : null,
    FIREBASE_PRIVATE_KEY_hasLiteralBackslashN: rawKey ? rawKey.includes("\\n") : null,
    FIREBASE_PRIVATE_KEY_hasRealNewline: rawKey ? rawKey.includes("\n") : null,
    FIREBASE_PRIVATE_KEY_first50_charCodes: rawKey
      ? Array.from(rawKey.substring(0, 50)).map((c) => c.charCodeAt(0))
      : null,
    FIREBASE_CLIENT_EMAIL: clientEmail || "NOT SET",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId || "NOT SET",
  };

  // 2. Process the key the same way firebase-admin.ts does
  if (rawKey) {
    let processed = rawKey;

    // Strip surrounding quotes
    try {
      if (processed.startsWith('"') && processed.endsWith('"')) {
        processed = JSON.parse(processed) as string;
        diagnostics.keyProcessing_step1 = "JSON.parse stripped quotes";
      } else if (processed.startsWith("'") && processed.endsWith("'")) {
        processed = processed.slice(1, -1);
        diagnostics.keyProcessing_step1 = "Stripped single quotes";
      } else {
        diagnostics.keyProcessing_step1 = "No quotes to strip";
      }
    } catch (e) {
      processed = processed.replace(/^["']|["']$/g, "");
      diagnostics.keyProcessing_step1 = "JSON.parse failed, regex stripped quotes";
    }

    // Replace literal \n with real newlines
    const before = processed.length;
    processed = processed.replace(/\\n/g, "\n");
    const after = processed.length;
    diagnostics.keyProcessing_step2 = {
      lengthBefore: before,
      lengthAfter: after,
      replacementsCount: before - after,
      startsCorrectly: processed.startsWith("-----BEGIN"),
      endsCorrectly: processed.trimEnd().endsWith("-----"),
      hasRealNewlines: processed.includes("\n"),
      lineCount: processed.split("\n").length,
    };

    // 3. Try to manually initialize with the processed key
    try {
      const { getApps, initializeApp, cert } = await import("firebase-admin/app");
      const { getAuth } = await import("firebase-admin/auth");
      const { getFirestore } = await import("firebase-admin/firestore");

      // Use a unique app name for this test
      const testAppName = `debug-test-${Date.now()}`;
      const testApp = initializeApp(
        {
          credential: cert({
            projectId: projectId || "mesira-argentina",
            clientEmail: clientEmail || "",
            privateKey: processed,
          }),
        },
        testAppName
      );

      const testAuth = getAuth(testApp);
      const testDb = getFirestore(testApp);

      diagnostics.manualInit = "SUCCESS";
      diagnostics.manualAuth = `OK - type: ${typeof testAuth.verifyIdToken}`;
      diagnostics.manualDb = `OK - type: ${typeof testDb.collection}`;
    } catch (initErr: any) {
      diagnostics.manualInit = `FAILED: ${initErr.message}`;
    }
  }

  // 4. Also test the existing module
  try {
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");
    try {
      adminDb.collection("products");
      diagnostics.moduleDb = "OK";
    } catch (e: any) {
      diagnostics.moduleDb = `ERROR: ${e.message}`;
    }
    try {
      typeof adminAuth.verifyIdToken;
      diagnostics.moduleAuth = "OK";
    } catch (e: any) {
      diagnostics.moduleAuth = `ERROR: ${e.message}`;
    }
  } catch (e: any) {
    diagnostics.moduleImport = `ERROR: ${e.message}`;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
