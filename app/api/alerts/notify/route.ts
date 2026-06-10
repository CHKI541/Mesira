import { NextResponse } from 'next/server';
// @ts-ignore
import nodemailer from 'nodemailer';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

    if (matches.length === 0) {
      return NextResponse.json({ success: true, message: "No matching alerts found.", sentCount: 0 });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn("SMTP configuration is missing (SMTP_USER/SMTP_PASS). Email alerts will NOT be sent. Logged matches:", matches.map(m => m.userEmail));
      return NextResponse.json({ 
        success: true, 
        message: "SMTP is not configured. Email notifications skipped, but matches were logged.", 
        matches: matches.map(m => ({ email: m.userEmail, alertId: m.id })),
        sentCount: 0
      });
    }

    const emailPromises = matches.map(async (alert) => {
      const email = alert.userEmail;
      const productUrl = `${appUrl}/producto/${productToNotify.id}`;
      
      const conditionLabelMap: Record<string, string> = {
        perfecto: "Perfecto estado",
        buen: "Buen estado",
        funcional: "Estado funcional (con detalles)",
        reparar: "A reparar / Mal estado"
      };
      const conditionLabel = conditionLabelMap[productToNotify.condition] || productToNotify.condition;
      const neighborhoodLabel = productToNotify.neighborhood === "Otro" ? productToNotify.customNeighborhood : productToNotify.neighborhood;

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

      return transporter.sendMail({
        from: `"Mesira Argentina" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `¡Nueva publicación coincide con tu alerta!: ${productToNotify.title}`,
        html: htmlContent,
      });
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Emails sent successfully to ${matches.length} matching users.`, 
      sentCount: matches.length 
    });
  } catch (error: any) {
    console.error("Error in alerts notification endpoint:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
