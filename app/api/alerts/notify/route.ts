import { NextResponse } from 'next/server';
// @ts-ignore
import nodemailer from 'nodemailer';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize firebase-admin safely
let adminDb: any = null;
try {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
    adminDb = getFirestore();
  } else {
    console.warn("Firebase Admin credentials (FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY) are missing in environment variables. Real-time Firebase alert matching is disabled on localhost.");
  }
} catch (e) {
  console.warn("Firebase Admin failed to initialize or is not configured:", e);
}

// Nodemailer Transporter Setup
const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

// Helper matching logic
const checkAlertMatchesProduct = (alert: any, product: any) => {
  // 1. Keyword check
  if (alert.keyword && alert.keyword.trim() !== '') {
    const keyword = alert.keyword.toLowerCase().trim();
    const titleMatch = product.title?.toLowerCase().includes(keyword);
    const descMatch = product.description?.toLowerCase().includes(keyword);
    if (!titleMatch && !descMatch) return false;
  }

  // 2. Category check
  if (alert.categories && alert.categories.length > 0 && !alert.categories.includes('Todos')) {
    const prodCats = product.categories || [];
    const hasCategoryMatch = prodCats.some((cat: string) => alert.categories.includes(cat));
    if (!hasCategoryMatch) return false;
  }

  // 3. Condition check
  if (alert.conditions && alert.conditions.length > 0 && !alert.conditions.includes('Todos')) {
    if (!alert.conditions.includes(product.condition)) return false;
  }

  // 4. Neighborhood check
  if (alert.neighborhoods && alert.neighborhoods.length > 0 && !alert.neighborhoods.includes('Todos')) {
    const prodNeighborhood = (product.neighborhood === 'Otro' && product.customNeighborhood)
      ? product.customNeighborhood.toLowerCase().trim()
      : product.neighborhood?.toLowerCase().trim();

    const matchesNeighborhood = alert.neighborhoods.some((n: string) => {
      const alertN = n.toLowerCase().trim();
      return alertN === prodNeighborhood || (product.neighborhood === 'Otro' && alertN === 'otro');
    });

    if (!matchesNeighborhood) return false;
  }

  return true;
};

export async function POST(request: Request) {
  try {
    // Security fix #4: Require an internal secret header to prevent abuse from external callers
    const internalSecret = process.env.ALERT_NOTIFY_SECRET;
    if (internalSecret) {
      const providedSecret = request.headers.get('x-internal-secret');
      if (providedSecret !== internalSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { productId, mockProduct, mockAlerts } = body;

    let productToNotify: any = null;
    let alertsToProcess: any[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Mode A: Mock Mode (Client sends product & alerts list directly)
    if (mockProduct && mockAlerts) {
      productToNotify = mockProduct;
      alertsToProcess = mockAlerts;
    } 
    // Mode B: Firebase Mode (API reads from Firestore)
    else if (productId) {
      if (!adminDb) {
        console.warn("Firebase Admin is not initialized. Skipping Firebase alert matching on localhost (no service account).");
        return NextResponse.json({ 
          success: true, 
          message: "Firebase Admin is not initialized. Skipping Firebase alert matching on localhost (no service account).",
          sentCount: 0 
        });
      }

      // Fetch product
      const productSnap = await adminDb.collection('products').doc(productId).get();
      if (!productSnap.exists) {
        return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
      }
      productToNotify = { id: productSnap.id, ...productSnap.data() };

      // Fetch all active alerts
      const alertsSnap = await adminDb.collection('alerts').where('active', '==', true).get();
      alertsSnap.forEach((doc: any) => {
        alertsToProcess.push({ id: doc.id, ...doc.data() });
      });
    } else {
      return NextResponse.json({ success: false, message: "Invalid request payload" }, { status: 400 });
    }

    // Process alerts
    const matches = alertsToProcess.filter(alert => checkAlertMatchesProduct(alert, productToNotify));
    const conditionLabelMap: Record<string, string> = {
      perfecto: "Perfecto estado",
      buen: "Buen estado",
      funcional: "Estado funcional (con detalles)",
      reparar: "A reparar / Mal estado"
    };
    const conditionLabel = conditionLabelMap[productToNotify.condition] || productToNotify.condition;
    const neighborhoodLabel = productToNotify.neighborhood === "Otro" ? productToNotify.customNeighborhood : productToNotify.neighborhood;

    // --- PUSH NOTIFICATIONS FLOW ---
    let pushSentCount = 0;
    let pushUsers: any[] = [];

    if (adminDb && !mockProduct) {
      try {
        // Fetch all users with registered FCM tokens
        const usersSnap = await adminDb.collection('users').where('fcmTokens', '!=', null).get();
        usersSnap.forEach((doc: any) => {
          const data = doc.data();
          if (data.fcmTokens && data.fcmTokens.length > 0) {
            pushUsers.push({ id: doc.id, ...data });
          }
        });

        // 1. Collect tokens for users who want to receive EVERYTHING (alertPreference == 'all' or default)
        const tokensAll: string[] = [];
        pushUsers.forEach((u) => {
          const pref = u.alertPreference || "all";
          // Make sure not to notify the seller of their own product
          if (pref === "all" && u.id !== productToNotify.sellerId) {
            tokensAll.push(...u.fcmTokens);
          }
        });

        // 2. Collect tokens for users who only want CUSTOM alerts matching this product
        const tokensCustom: string[] = [];
        const customAlertUsers = pushUsers.filter(u => u.alertPreference === "custom");
        
        matches.forEach((alert) => {
          // If alert is configured to notify by push (default true)
          if (alert.notifyByPush !== false && alert.userId !== productToNotify.sellerId) {
            const userObj = customAlertUsers.find(u => u.id === alert.userId);
            if (userObj && userObj.fcmTokens) {
              tokensCustom.push(...userObj.fcmTokens);
            }
          }
        });

        // Remove duplicates from lists just in case
        const uniqueTokensAll = Array.from(new Set(tokensAll));
        const uniqueTokensCustom = Array.from(new Set(tokensCustom));

        // Helper to multicast push messages (chunked in batches of 500 - FCM limit)
        const FCM_BATCH_LIMIT = 500;
        const sendMulticastPush = async (tokensList: string[], title: string, body: string) => {
          if (tokensList.length === 0) return;
          
          // Chunk tokens into batches of 500 (FCM sendEachForMulticast limit)
          const chunks: string[][] = [];
          for (let i = 0; i < tokensList.length; i += FCM_BATCH_LIMIT) {
            chunks.push(tokensList.slice(i, i + FCM_BATCH_LIMIT));
          }
          
          for (const chunk of chunks) {
            try {
              const response = await getMessaging().sendEachForMulticast({
                tokens: chunk,
                notification: { title, body },
                data: {
                  url: `${appUrl}/producto/${productToNotify.id}`
                }
              });

              pushSentCount += response.successCount;

              // Self-cleaning: Remove expired/invalid tokens from Firestore
              const tokensToRemove: Record<string, string[]> = {};
              response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                  const badToken = chunk[idx];
                  const error = resp.error;
                  console.log(`FCM send failed for token (Code: ${error?.code}): ${error?.message}`);

                  if (
                    error?.code === 'messaging/invalid-registration-token' ||
                    error?.code === 'messaging/registration-token-not-registered'
                  ) {
                    // Find owner user
                    const owner = pushUsers.find(u => u.fcmTokens?.includes(badToken));
                    if (owner) {
                      if (!tokensToRemove[owner.id]) {
                        tokensToRemove[owner.id] = [];
                      }
                      tokensToRemove[owner.id].push(badToken);
                    }
                  }
                }
              });

              // Update user profiles in batch
              for (const [uid, badTokens] of Object.entries(tokensToRemove)) {
                try {
                  await adminDb.collection('users').doc(uid).update({
                    fcmTokens: FieldValue.arrayRemove(...badTokens)
                  });
                  console.log(`Pruned ${badTokens.length} inactive FCM tokens for user: ${uid}`);
                } catch (pruneErr) {
                  console.error(`Failed to prune tokens for user ${uid}:`, pruneErr);
                }
              }
            } catch (fcmErr) {
              console.error("FCM send error:", fcmErr);
            }
          }
        };


        // Send push notifications
        await sendMulticastPush(
          uniqueTokensAll, 
          "¡Nuevo regalo publicado!", 
          `${productToNotify.title} en ${neighborhoodLabel}`
        );

        await sendMulticastPush(
          uniqueTokensCustom, 
          "¡Coincidencia con tu alerta!", 
          `Se publicó: ${productToNotify.title} en ${neighborhoodLabel}`
        );

      } catch (pushErr) {
        console.error("Error running push notification dispatcher: ", pushErr);
      }
    }

    // --- EMAIL NOTIFICATIONS FLOW ---
    // Only send email notifications to alerts that have notifyByEmail enabled (default: true)
    const emailMatches = matches.filter(alert => alert.notifyByEmail !== false);

    if (emailMatches.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Alert processed. Push notifications sent to ${pushSentCount} devices. No email matches.`, 
        sentCount: 0,
        pushSentCount
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn("SMTP configuration is missing (SMTP_USER/SMTP_PASS). Email alerts will NOT be sent. Logged matches:", emailMatches.map(m => m.userEmail));
      return NextResponse.json({ 
        success: true, 
        message: `SMTP is not configured. Email notifications skipped. Push sent to ${pushSentCount} devices.`, 
        matches: emailMatches.map(m => ({ email: m.userEmail, alertId: m.id })),
        sentCount: 0,
        pushSentCount
      });
    }

    const emailPromises = emailMatches.map(async (alert) => {
      const email = alert.userEmail;
      const productUrl = `${appUrl}/producto/${productToNotify.id}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0043C6; margin-top: 0;">¡Alerta de Mesira Argentina!</h2>
          <p>Se ha publicado un nuevo producto que coincide con tu alerta configurada.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0043C6;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${productToNotify.title}</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Estado:</strong> ${conditionLabel}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Barrio:</strong> ${neighborhoodLabel}</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">${productToNotify.description}</p>
          </div>

          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="${productUrl}" style="background-color: #0043C6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Ver Publicación</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
          <p style="font-size: 11px; color: #999; text-align: center;">Recibiste este correo porque tenés activa una alerta en Mesira Argentina. Podés darla de baja desde tu cuenta.</p>
        </div>
      `;

      const textContent = `
¡Alerta de Mesira Argentina!

Se ha publicado un nuevo producto que coincide con tu alerta configurada:

${productToNotify.title}
Estado: ${conditionLabel}
Barrio: ${neighborhoodLabel}
Descripción: ${productToNotify.description}

Ver Publicación: ${productUrl}

Recibiste este correo porque tenés activa una alerta en Mesira Argentina. Podés darla de baja desde tu cuenta.
      `;
      return transporter.sendMail({
        from: `"Mesira Argentina" <${process.env.SMTP_FROM || 'alertas@mesira.net'}>`,
        replyTo: process.env.SMTP_FROM || 'alertas@mesira.net',
        to: email,
        subject: `Nueva publicación coincide con tu alerta: ${productToNotify.title}`,
        text: textContent,
        html: htmlContent,
      });
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Emails sent successfully to ${emailMatches.length} matching users. Push sent to ${pushSentCount} devices.`, 
      sentCount: emailMatches.length,
      pushSentCount
    });
  } catch (error: any) {
    console.error("Error in alerts notification endpoint:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
