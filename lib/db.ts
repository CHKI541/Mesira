import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, isFirebaseConfigured } from "./firebase";

// Product Type definition
export interface Product {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  condition: "perfecto" | "buen" | "funcional" | "reparar";
  neighborhood: string;
  customNeighborhood?: string;
  createdAt: any; // Date, Timestamp or number
  isActive: boolean;
  contactCount: number;
  viewsCount: number;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  maxContacts?: number;
  contactedUserIds?: string[];
  deactivatedAt?: any;
  viewedUserIds?: string[];
  contactPreferences?: string[];
  sellerEmail?: string;
}

// User Profile Type definition
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  isPhoneVerified: boolean;
  createdAt: any;
}

// --- MOCK DATABASE IMPLEMENTATION (LOCAL STORAGE) ---
const MOCK_STORAGE_KEY_PRODUCTS = "mesira_products_mock";
const MOCK_STORAGE_KEY_USERS = "mesira_users_mock";

// Mock data generator for initial state if storage is empty
const getInitialMockProducts = (): Product[] => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  return [
    {
      id: "mock-1",
      title: "Silla de escritorio ergonómica",
      description: "Silla giratoria con regulación de altura. Tiene algunos detalles de desgaste en el tapizado pero el pistón neumático funciona perfecto. La regalo porque me compré otra.",
      imageUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80",
      condition: "buen",
      neighborhood: "Palermo",
      createdAt: now - 2 * oneHour,
      isActive: true,
      contactCount: 1,
      viewsCount: 14,
      sellerId: "mock-user-1",
      sellerName: "Carlos Gómez",
      sellerPhone: "+5491133333333"
    },
    {
      id: "mock-2",
      title: "Libros de texto secundarios y novelas",
      description: "Lote de libros escolares de 3er y 4to año de secundaria. También incluyo un par de novelas de Julio Verne. Se retiran por la tarde.",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      condition: "perfecto",
      neighborhood: "Flores",
      createdAt: now - 5 * oneHour,
      isActive: true,
      contactCount: 0,
      viewsCount: 8,
      sellerId: "mock-user-2",
      sellerName: "María Del Carmen",
      sellerPhone: "+5491144444444"
    },
    {
      id: "mock-3",
      title: "Cafetera de goteo Peabody",
      description: "Cafetera eléctrica común. Funciona bien, pero la jarra de vidrio original se rompió y tiene una jarra alternativa que calza justo. Ideal para una oficina pequeña.",
      imageUrl: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=600&q=80",
      condition: "funcional",
      neighborhood: "Villa Crespo",
      createdAt: now - oneDay - 1 * oneHour,
      isActive: true,
      contactCount: 2,
      viewsCount: 25,
      sellerId: "mock-user-3",
      sellerName: "Lucas Pérez",
      sellerPhone: "+5491155555555"
    },
    {
      id: "mock-4",
      title: "Teclado y mouse inalámbrico Genius",
      description: "Teclado español y mouse óptico. El receptor USB anda perfecto. Al teclado le falta la tapita de las pilas pero no afecta su funcionamiento.",
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
      condition: "buen",
      neighborhood: "Once",
      createdAt: now - oneDay - 4 * oneHour,
      isActive: true,
      contactCount: 0,
      viewsCount: 4,
      sellerId: "mock-user-1",
      sellerName: "Carlos Gómez",
      sellerPhone: "+5491133333333"
    },
    {
      id: "mock-5",
      title: "Monitor CRT 15 pulgadas LG (Para reparar)",
      description: "Monitor antiguo de tubo. Enciende pero la pantalla queda en color azulado. Sirve para repuesto o para alguien que sepa soldar placas antiguas.",
      imageUrl: "https://images.unsplash.com/photo-1551645121-d1034da75057?auto=format&fit=crop&w=600&q=80",
      condition: "reparar",
      neighborhood: "Barracas",
      createdAt: now - oneDay - 8 * oneHour,
      isActive: true,
      contactCount: 0,
      viewsCount: 19,
      sellerId: "mock-user-4",
      sellerName: "Eduardo Alvarez",
      sellerPhone: "+5491166666666"
    }
  ];
};

const getMockProducts = (): Product[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MOCK_STORAGE_KEY_PRODUCTS);
  if (!stored) {
    const initial = getInitialMockProducts();
    localStorage.setItem(MOCK_STORAGE_KEY_PRODUCTS, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const saveMockProducts = (products: Product[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }
};

const getMockUsers = (): Record<string, UserProfile> => {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(MOCK_STORAGE_KEY_USERS);
  return stored ? JSON.parse(stored) : {};
};

const saveMockUsers = (users: Record<string, UserProfile>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_STORAGE_KEY_USERS, JSON.stringify(users));
  }
};


// --- DATABASE INTERFACE API ---

// 1. User Profile Operations
export const saveUserProfile = async (uid: string, profile: Omit<UserProfile, "uid" | "createdAt">): Promise<UserProfile> => {
  const createdAt = new Date();
  const fullProfile: UserProfile = {
    uid,
    createdAt: isFirebaseConfigured ? createdAt : createdAt.getTime(),
    ...profile
  };

  if (isFirebaseConfigured) {
    await setDoc(doc(db, "users", uid), fullProfile);
  } else {
    const users = getMockUsers();
    users[uid] = fullProfile;
    saveMockUsers(users);
  }

  return fullProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        uid,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as UserProfile;
    }
    return null;
  } else {
    const users = getMockUsers();
    return users[uid] || null;
  }
};

// Helper to compress images client-side to fit inside Firestore documents (under 100KB)
const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.7 quality (typically results in ~40-70KB)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 2. Image Upload (directly returns compressed Base64 to save in Firestore, bypassing Firebase Storage completely to avoid timeouts)
export const uploadProductImage = async (file: File): Promise<string> => {
  const compressedBase64 = await compressImage(file);
  return compressedBase64;
};

// 3. Products Retrieval with sorting & filtering
export interface FilterOptions {
  neighborhood?: string;
  condition?: string;
  searchQuery?: string;
}

export const getProducts = async (filters?: FilterOptions): Promise<Product[]> => {
  // Active publications remain up to 60 days in the feed
  const cutoffTimeMs = Date.now() - 60 * 24 * 60 * 60 * 1000;

  if (isFirebaseConfigured) {
    const productsRef = collection(db, "products");
    const cutoffTime = new Date(cutoffTimeMs);

    // Initial query filters active products
    let q = query(
      productsRef,
      where("isActive", "==", true),
      where("createdAt", ">=", Timestamp.fromDate(cutoffTime)),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    let results: Product[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as Product);
    });

    // Apply filters and search query on the result set
    if (filters) {
      const { neighborhood, condition, searchQuery } = filters;

      if (neighborhood && neighborhood !== "Todos") {
        results = results.filter(p => 
          p.neighborhood.toLowerCase() === neighborhood.toLowerCase() || 
          (p.neighborhood === "Otro" && p.customNeighborhood?.toLowerCase() === neighborhood.toLowerCase())
        );
      }

      if (condition && condition !== "Todos") {
        results = results.filter(p => p.condition === condition);
      }

      if (searchQuery && searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        results = results.filter(p => 
          p.title.toLowerCase().includes(query) || 
          p.description.toLowerCase().includes(query) ||
          p.neighborhood.toLowerCase().includes(query) ||
          (p.customNeighborhood && p.customNeighborhood.toLowerCase().includes(query))
        );
      }
    }

    return results;
  } else {
    // Mock Mode
    let results = getMockProducts();

    // Filter active products not older than 48 hours
    results = results.filter(p => {
      const createdTime = typeof p.createdAt === "number" ? p.createdAt : new Date(p.createdAt).getTime();
      return p.isActive === true && createdTime >= cutoffTimeMs;
    });

    // Sort by createdAt descending
    results.sort((a, b) => {
      const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt).getTime();
      const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    // Filter by options
    if (filters) {
      const { neighborhood, condition, searchQuery } = filters;

      if (neighborhood && neighborhood !== "Todos") {
        results = results.filter(p => 
          p.neighborhood.toLowerCase() === neighborhood.toLowerCase() || 
          (p.neighborhood === "Otro" && p.customNeighborhood?.toLowerCase() === neighborhood.toLowerCase())
        );
      }

      if (condition && condition !== "Todos") {
        results = results.filter(p => p.condition === condition);
      }

      if (searchQuery && searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        results = results.filter(p => 
          p.title.toLowerCase().includes(query) || 
          p.description.toLowerCase().includes(query) ||
          p.neighborhood.toLowerCase().includes(query) ||
          (p.customNeighborhood && p.customNeighborhood.toLowerCase().includes(query))
        );
      }
    }

    return results;
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as Product;
    }
    return null;
  } else {
    const products = getMockProducts();
    return products.find(p => p.id === id) || null;
  }
};

export const getSellerProducts = async (sellerId: string): Promise<Product[]> => {
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

  if (isFirebaseConfigured) {
    const q = query(
      collection(db, "products"),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    let results: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
      } as Product);
    });

    // Filter out deactivated products older than 48 hours (based on deactivation time)
    results = results.filter(p => {
      const isDeactivated = !p.isActive || p.contactCount >= (p.maxContacts || 3);
      if (isDeactivated) {
        const deactTime = p.deactivatedAt
          ? (p.deactivatedAt instanceof Timestamp ? p.deactivatedAt.toDate().getTime() : new Date(p.deactivatedAt).getTime())
          : (p.createdAt instanceof Date ? p.createdAt.getTime() : new Date(p.createdAt).getTime());
        return deactTime >= fortyEightHoursAgo;
      }
      return true;
    });

    return results;
  } else {
    const products = getMockProducts();
    let results = products.filter(p => p.sellerId === sellerId);
    results.sort((a, b) => {
      const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt).getTime();
      const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    // Filter out deactivated products older than 48 hours (based on deactivation time)
    results = results.filter(p => {
      const isDeactivated = !p.isActive || p.contactCount >= (p.maxContacts || 3);
      if (isDeactivated) {
        const deactTime = p.deactivatedAt
          ? (typeof p.deactivatedAt === "number" ? p.deactivatedAt : new Date(p.deactivatedAt).getTime())
          : (typeof p.createdAt === "number" ? p.createdAt : new Date(p.createdAt).getTime());
        return deactTime >= fortyEightHoursAgo;
      }
      return true;
    });

    return results;
  }
};

// 4. Product Creation
export const createProduct = async (productData: Omit<Product, "id" | "createdAt" | "isActive" | "contactCount" | "viewsCount">): Promise<Product> => {
  const createdAt = new Date();
  const newProduct = {
    ...productData,
    createdAt: isFirebaseConfigured ? createdAt : createdAt.getTime(),
    isActive: true,
    contactCount: 0,
    viewsCount: 0,
    contactedUserIds: [],
    viewedUserIds: []
  };

  if (isFirebaseConfigured) {
    const docRef = await addDoc(collection(db, "products"), newProduct);
    return {
      ...newProduct,
      id: docRef.id,
      createdAt
    } as Product;
  } else {
    const products = getMockProducts();
    const productWithId: Product = {
      ...newProduct,
      id: `mock-prod-${Date.now()}`
    } as Product;
    products.push(productWithId);
    saveMockProducts(products);
    return productWithId;
  }
};

// 5. Contact Deactivation Logic (Configurable Max Contacts, Unique Users)
export const updateProductContact = async (id: string, userId: string): Promise<{ contactCount: number; isActive: boolean }> => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Product not found");

    const currentData = docSnap.data() as Product;
    const contactedUserIds = currentData.contactedUserIds || [];
    const maxLimit = currentData.maxContacts || 3;

    if (contactedUserIds.includes(userId)) {
      return { 
        contactCount: currentData.contactCount || contactedUserIds.length, 
        isActive: currentData.isActive 
      };
    }

    const updatedUserIds = [...contactedUserIds, userId];
    const newCount = (currentData.contactCount || 0) + 1;
    const isActive = newCount < maxLimit;

    await updateDoc(docRef, {
      contactCount: newCount,
      contactedUserIds: updatedUserIds,
      isActive: isActive,
      ...(!isActive ? { deactivatedAt: new Date() } : {})
    });

    return { contactCount: newCount, isActive };
  } else {
    const products = getMockProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");

    const product = products[index];
    const contactedUserIds = product.contactedUserIds || [];
    const maxLimit = product.maxContacts || 3;

    if (contactedUserIds.includes(userId)) {
      return { 
        contactCount: product.contactCount || contactedUserIds.length, 
        isActive: product.isActive 
      };
    }

    const updatedUserIds = [...contactedUserIds, userId];
    const newCount = (product.contactCount || 0) + 1;
    const isActive = newCount < maxLimit;

    products[index].contactCount = newCount;
    products[index].contactedUserIds = updatedUserIds;
    products[index].isActive = isActive;
    if (!isActive) {
      products[index].deactivatedAt = Date.now();
    } else {
      delete products[index].deactivatedAt;
    }

    saveMockProducts(products);
    return { contactCount: newCount, isActive };
  }
};

// 5b. Increment Product Views (Tracks unique visitors)
export const incrementProductViews = async (id: string, viewerId: string): Promise<void> => {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Product;
        const viewedUserIds = data.viewedUserIds || [];
        const updatedUserIds = viewedUserIds.includes(viewerId)
          ? viewedUserIds
          : [...viewedUserIds, viewerId];
        
        await updateDoc(docRef, {
          viewsCount: increment(1),
          viewedUserIds: updatedUserIds
        });
      }
    } catch (e) {
      console.warn("Failed to increment views:", e);
    }
  } else {
    const products = getMockProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const product = products[index];
      const viewedUserIds = product.viewedUserIds || [];
      const updatedUserIds = viewedUserIds.includes(viewerId)
        ? viewedUserIds
        : [...viewedUserIds, viewerId];

      products[index].viewsCount = (product.viewsCount || 0) + 1;
      products[index].viewedUserIds = updatedUserIds;
      saveMockProducts(products);
    }
  }
};

// 6. Reactivate Product (Resets createdAt to now and contactCount to 0)
export const reactivateProduct = async (id: string): Promise<Product> => {
  const now = new Date();
  if (isFirebaseConfigured) {
    const docRef = doc(db, "products", id);
    const updates = {
      createdAt: now,
      contactCount: 0,
      isActive: true,
      deactivatedAt: null
    };
    await updateDoc(docRef, updates);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    return {
      ...data,
      id,
      createdAt: now
    } as Product;
  } else {
    const products = getMockProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");

    products[index].createdAt = now.getTime();
    products[index].contactCount = 0;
    products[index].isActive = true;
    delete products[index].deactivatedAt;

    saveMockProducts(products);
    return products[index];
  }
};

// 7. Delete Product
export const deleteProduct = async (id: string, imageUrl?: string): Promise<void> => {
  if (isFirebaseConfigured) {
    // Delete Firestore document
    await deleteDoc(doc(db, "products", id));
    
    // Attempt to delete image from Firebase Storage if it's a storage URL
    if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (e) {
        console.warn("Could not delete storage image:", e);
      }
    }
  } else {
    const products = getMockProducts();
    const filtered = products.filter(p => p.id !== id);
    saveMockProducts(filtered);
  }
};
