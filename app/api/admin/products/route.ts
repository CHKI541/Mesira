import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";

const allowedAdmins = ["israel.chueke@gmail.com", "eli2626cohen@gmail.com"];

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No autorizado. Token faltante.");
  }
  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  if (!allowedAdmins.includes(decodedToken.email || "")) {
    throw new Error("No tienes permisos de administrador.");
  }
  return decodedToken;
}

// POST: Deactivate / Reactivate product
export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const { id, action } = await request.json(); // action: "deactivate" | "reactivate"

    if (!id || !action) {
      return NextResponse.json({ error: "ID de producto y acción requeridos." }, { status: 400 });
    }

    const docRef = adminDb.collection("products").doc(id);
    if (action === "deactivate") {
      await docRef.update({
        isActive: false,
        deactivatedAt: new Date(),
      });
    } else if (action === "reactivate") {
      await docRef.update({
        isActive: true,
        createdAt: new Date(),
        contactCount: 0,
        contactedUserIds: [],
        deactivatedAt: null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// PUT: Edit product content (admin can edit any product)
export async function PUT(request: Request) {
  try {
    await verifyAdmin(request);
    const { id, title, description, condition, neighborhood, customNeighborhood, categories, imageUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID de producto requerido." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (condition !== undefined) updates.condition = condition;
    if (neighborhood !== undefined) updates.neighborhood = neighborhood;
    if (customNeighborhood !== undefined) updates.customNeighborhood = customNeighborhood;
    if (categories !== undefined) updates.categories = categories;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;

    await adminDb.collection("products").doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin product edit error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}


// DELETE: Delete product
export async function DELETE(request: Request) {
  try {
    await verifyAdmin(request);
    const { id, imageUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID de producto requerido." }, { status: 400 });
    }

    // 1. Delete product document
    await adminDb.collection("products").doc(id).delete();

    // 2. Delete storage object if applicable
    if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const bucket = getStorage().bucket();
        const decodedUrl = decodeURIComponent(imageUrl);
        const parts = decodedUrl.split("/o/");
        if (parts.length > 1) {
          const filePath = parts[1].split("?")[0];
          await bucket.file(filePath).delete();
        }
      } catch (storageErr) {
        console.warn("Storage delete warning:", storageErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
