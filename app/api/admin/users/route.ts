import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado. Token faltante." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
    }

    // Check if the user is the administrator
    const allowedAdmins = ["israel.chueke@gmail.com", "eli2626cohen@gmail.com"];
    if (!allowedAdmins.includes(decodedToken.email || "")) {
      return NextResponse.json({ error: "No tienes permisos de administrador." }, { status: 403 });
    }

    const body = await request.json();
    const { uid, deleteProducts } = body;

    if (!uid) {
      return NextResponse.json({ error: "UID del usuario requerido." }, { status: 400 });
    }

    // 1. Delete user from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: any) {
      // If user doesn't exist in Auth, we might still want to clean up their Firestore profile
      console.warn(`Auth user delete warning for ${uid}:`, authError.message);
    }

    // 2. Delete user profile from Firestore
    const userDocRef = adminDb.collection("users").doc(uid);
    await userDocRef.delete();

    // 3. Delete user alerts
    const alertsQuery = await adminDb.collection("alerts").where("userId", "==", uid).get();
    const alertsBatch = adminDb.batch();
    alertsQuery.forEach((doc: any) => {
      alertsBatch.delete(doc.ref);
    });
    await alertsBatch.commit();

    // 4. Optionally delete user products
    let deletedProductsCount = 0;
    if (deleteProducts) {
      const productsQuery = await adminDb.collection("products").where("sellerId", "==", uid).get();
      const productsBatch = adminDb.batch();
      productsQuery.forEach((doc: any) => {
        productsBatch.delete(doc.ref);
        deletedProductsCount++;
      });
      await productsBatch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Usuario ${uid} eliminado correctamente.`,
      deletedProductsCount,
    });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
