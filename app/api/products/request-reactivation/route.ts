import { NextResponse } from 'next/server';
// @ts-ignore
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "ID de producto requerido." }, { status: 400 });
    }

    const appUrl = request.headers.get("origin") || "https://mesira.net";
    const myAccountUrl = `${appUrl}/mi-cuenta`;

    // Fetch product using the shared firebase-admin module (avoids duplicate app init)
    const docRef = adminDb.collection("products").doc(productId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }

    const product: any = { id: docSnap.id, ...docSnap.data() };

    if (product.isDelivered) {
      return NextResponse.json({
        success: false,
        message: "El producto ya fue entregado y no se puede pedir reactivación."
      }, { status: 400 });
    }

    // If already requested, don't send email again (only once per deactivation cycle)
    if (product.reactivationRequested) {
      return NextResponse.json({
        success: true,
        message: "La reactivación ya fue solicitada anteriormente.",
        alreadyRequested: true
      });
    }

    // Mark reactivation as requested in the DB atomically
    await docRef.update({ reactivationRequested: true });

    // Send email to the owner
    const email = product.sellerEmail;
    if (!email) {
      return NextResponse.json({
        success: true,
        message: "Se guardó el pedido, pero el dueño no posee email registrado para notificar."
      });
    }

    const transporter = getTransporter();
    const subject = `¡Hay personas interesadas en tu publicación de Mesira!`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0043C6; margin-top: 0;">¡Hola ${product.sellerName || 'usuario de Mesira'}!</h2>
        <p>Alguien en la comunidad de <strong>Mesira Argentina</strong> está interesado en tu producto:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0043C6;">
          <h3 style="margin: 0 0 5px 0; color: #333;">${product.title}</h3>
          <p style="margin: 5px 0; font-size: 13px; color: #666;">Publicado en ${product.neighborhood || 'CABA'}</p>
        </div>

        <p>Este producto fue desactivado porque recibió la cantidad máxima de contactos.</p>

        <div style="background-color: #eef2ff; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #c7d2fe;">
          <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #3730a3;">¿Qué debés hacer?</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.5; color: #312e81;">
            <li><strong>Si YA lo entregaste:</strong> Por favor, ingresá a tu cuenta y marcalo como <strong>"Entregado"</strong>. Así figurará en la página y la gente sabrá que se concretó la mitzvá.</li>
            <li><strong>Si AÚN NO lo entregaste:</strong> Podés volver a <strong>"Activar de nuevo"</strong> la publicación para recibir más contactos y encontrar un destinatario.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${myAccountUrl}" style="background-color: #0043C6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">Ir a Mis Publicaciones</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center;">Mesira Argentina - Uniendo a la comunidad para regalar y recibir.</p>
      </div>
    `;

    const textContent = `
¡Hola ${product.sellerName || 'usuario de Mesira'}!

Alguien en la comunidad de Mesira Argentina está interesado en tu producto: "${product.title}".

Este producto fue desactivado porque recibió la cantidad máxima de contactos.

¿Qué debés hacer?
- Si YA lo entregaste: Por favor, ingresá a tu cuenta y marcalo como "Entregado" para que figure en la página.
- Si AÚN NO lo entregaste: Podés volver a "Activar de nuevo" la publicación para recibir más contactos.

Ingresá a tu cuenta en: ${myAccountUrl}

Mesira Argentina - Uniendo a la comunidad para regalar y recibir.
    `;

    if (transporter) {
      await transporter.sendMail({
        from: `"Mesira Argentina" <${process.env.SMTP_FROM || 'alertas@mesira.net'}>`,
        replyTo: process.env.SMTP_FROM || 'alertas@mesira.net',
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`Email de solicitud de reactivación enviado con éxito a ${email} para el producto "${product.title}".`);
    } else {
      console.warn("SMTP credentials are not configured. Reactivation email simulation:");
      console.log(`[EMAIL SIMULADO] Para: ${email} | Asunto: ${subject}`);
    }

    return NextResponse.json({
      success: true,
      message: "Se envió la solicitud de reactivación al dueño por email."
    });
  } catch (error: any) {
    console.error("Error en la solicitud de reactivación:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
