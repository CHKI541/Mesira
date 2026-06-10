import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
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

    // Verify admin email
    if (decodedToken.email !== "israel.chueke@gmail.com") {
      return NextResponse.json({ error: "No tienes permisos de administrador." }, { status: 403 });
    }

    // 1. Fetch all products from Firestore via Admin SDK (bypasses security rules)
    const productsSnapshot = await adminDb
      .collection("products")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const products: any[] = [];
    productsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      products.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt ? (typeof data.createdAt.toDate === "function" ? data.createdAt.toDate().getTime() : data.createdAt) : 0,
        deactivatedAt: data.deactivatedAt ? (typeof data.deactivatedAt.toDate === "function" ? data.deactivatedAt.toDate().getTime() : data.deactivatedAt) : null,
      });
    });

    // 2. Fetch all users from Firestore via Admin SDK
    const usersSnapshot = await adminDb
      .collection("users")
      .orderBy("createdAt", "desc")
      .get();

    const users: any[] = [];
    usersSnapshot.forEach((doc: any) => {
      const data = doc.data();
      users.push({
        ...data,
        uid: doc.id,
        createdAt: data.createdAt ? (typeof data.createdAt.toDate === "function" ? data.createdAt.toDate().getTime() : data.createdAt) : 0,
      });
    });

    return NextResponse.json({
      products,
      users,
    });
  } catch (error: any) {
    console.error("Admin dashboard data fetch error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
