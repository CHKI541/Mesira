"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ProductPreview } from "@/components/ProductPreview";
import { 
  getSellerProducts, 
  createProduct, 
  reactivateProduct, 
  deactivateProduct,
  deleteProduct, 
  uploadProductImage,
  Product,
  getAlerts,
  createAlert,
  deleteAlert,
  Alert,
  getAdminDashboardData,
  deleteUserAdmin,
  UserProfile,
  deactivateProductAdmin,
  reactivateProductAdmin,
  deleteProductAdmin,
  updateProductContent,
  editProductAdmin,
  ProductEditData
} from "@/lib/db";
import { 
  PlusCircle, 
  FolderHeart, 
  Image as ImageIcon, 
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Clock, 
  Sparkles, 
  PowerOff,
  User,
  Bell,
  ShieldAlert,
  Users,
  Lock,
  Shield,
  Search,
  Pencil,
  X
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const AVAILABLE_CATEGORIES = [
  { value: "ropa", label: "Ropa" },
  { value: "muebles", label: "Muebles" },
  { value: "electronica", label: "Electrónica" },
  { value: "bazar", label: "Bazar" },
  { value: "herramientas", label: "Herramientas" },
  { value: "farmacia", label: "Farmacia" },
  { value: "accesorios para vehiculos", label: "Accesorios para vehículos" },
  { value: "bebes", label: "Bebés" },
  { value: "juguetes", label: "Juguetes" },
  { value: "libros", label: "Libros" },
  { value: "kodesh y judaica", label: "Kodesh y Judaica" },
  { value: "otro", label: "Otro" }
];

function MiCuentaContent() {
  const { 
    user, 
    loading, 
    completeRegistrationDetails, 
    isFirebaseActive,
    isOnboardingCompleted, 
    setIsOnboardingCompleted,
    getIdToken
  } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: 'perfil' | 'mis-publicaciones' | 'publicar' | 'alertas' | 'administrar'
  const [activeTab, setActiveTab] = useState<'perfil' | 'mis-publicaciones' | 'publicar' | 'alertas' | 'administrar'>('perfil');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Admin authentication and view states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  
  // Admin dashboard lists
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'publicaciones' | 'usuarios'>('publicaciones');

  // Edit modal state (shared for user-own and admin editing)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editIsAdmin, setEditIsAdmin] = useState(false); // true = admin editing someone else's product
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCondition, setEditCondition] = useState<Product["condition"]>("buen");
  const [editNeighborhood, setEditNeighborhood] = useState("Flores");
  const [editCustomNeighborhood, setEditCustomNeighborhood] = useState("");
  const [editCategories, setEditCategories] = useState<string[]>([]);
  interface EditImageItem {
    id: string;
    src: string;
    file?: File;
  }
  const [editImages, setEditImages] = useState<EditImageItem[]>([]);
  const [editCoverId, setEditCoverId] = useState<string>("");
  const [editMaxContacts, setEditMaxContacts] = useState<number>(3);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Profile edit states
  const [profileName, setProfileName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileKehila, setProfileKehila] = useState("");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Publication contact phone state
  const [pubPhone, setPubPhone] = useState("");

  // Form states for creation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<Product["condition"]>("buen");
  const [neighborhood, setNeighborhood] = useState("Flores");
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [maxContacts, setMaxContacts] = useState(3);
  const [prefWhatsApp, setPrefWhatsApp] = useState(true);
  const [prefLlamadas, setPrefLlamadas] = useState(true);
  const [prefSMS, setPrefSMS] = useState(false);
  const [prefMail, setPrefMail] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Dashboard states
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Alert system states
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertKeyword, setAlertKeyword] = useState("");
  const [alertCategories, setAlertCategories] = useState<string[]>([]);
  const [alertConditions, setAlertConditions] = useState<string[]>([]);
  const [alertNeighborhoods, setAlertNeighborhoods] = useState<string[]>([]);
  const [savingAlert, setSavingAlert] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);

  // Registration/Verification details in page (fallback if they bypassed the modal)
  const [regName, setRegName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regKehila, setRegKehila] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse tabs from URL search parameters (?tab=publicar)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "publicar" || tabParam === "mis-publicaciones" || tabParam === "perfil" || tabParam === "alertas" || tabParam === "administrar") {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Load admin data when in active tab and authenticated
  useEffect(() => {
    async function loadAdminData() {
      if (!user || !user.email || !["israel.chueke@gmail.com", "eli2626cohen@gmail.com"].includes(user.email) || activeTab !== "administrar" || !isAdminAuthenticated) return;
      setLoadingAdminData(true);
      setDashboardError(null);
      try {
        const { products, users } = await getAdminDashboardData(getIdToken);
        setAdminProducts(products);
        setAdminUsers(users);
      } catch (err: any) {
        console.error("Error loading admin data:", err);
        setDashboardError(err.message || "No se pudieron cargar los datos de administración.");
      } finally {
        setLoadingAdminData(false);
      }
    }
    loadAdminData();
  }, [user, activeTab, isAdminAuthenticated]);

  // Load seller products when switching to 'mis-publicaciones'
  useEffect(() => {
    async function loadMyProducts() {
      if (!user || !user.isPhoneVerified || activeTab !== "mis-publicaciones") return;
      setLoadingProducts(true);
      setDashboardError(null);
      try {
        const data = await getSellerProducts(user.uid);
        setMyProducts(data);
      } catch (err) {
        console.error("Error loading products:", err);
        setDashboardError("No se pudieron cargar tus publicaciones.");
      } finally {
        setLoadingProducts(false);
      }
    }
    loadMyProducts();
  }, [user, activeTab]);

  // Load alerts when switching to 'alertas'
  useEffect(() => {
    async function loadMyAlerts() {
      if (!user || !user.isPhoneVerified || activeTab !== "alertas") return;
      setLoadingAlerts(true);
      setDashboardError(null);
      try {
        const data = await getAlerts(user.uid);
        setAlerts(data);
      } catch (err) {
        console.error("Error loading alerts:", err);
        setDashboardError("No se pudieron cargar tus alertas.");
      } finally {
        setLoadingAlerts(false);
      }
    }
    loadMyAlerts();
  }, [user, activeTab]);

  // Sync user values for registration or profile editing
  useEffect(() => {
    if (user) {
      if (!user.isPhoneVerified) {
        setRegName(user.name || "");
        setRegLastName(user.lastName || "");
        setRegKehila(user.kehila || "");
        if (user.phone) {
          setRegPhone(user.phone.replace("+549", ""));
        }
      } else {
        // Pre-fill profile editing fields
        setProfileName(user.name || "");
        setProfileLastName(user.lastName || "");
        setProfilePhone(user.phone ? user.phone.replace("+549", "") : "");
        setProfileEmail(user.email || "");
        setProfileKehila(user.kehila || "");
        // Pre-fill publication contact number (if not already modified)
        setPubPhone(prev => prev || (user.phone ? user.phone.replace("+549", "") : ""));
      }
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileName.trim()) return setProfileError("Ingresá tu nombre.");
    if (!profileLastName.trim()) return setProfileError("Ingresá tu apellido.");
    if (!profileEmail.trim()) return setProfileError("Ingresá tu email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)) {
      return setProfileError("Por favor, ingresá un correo electrónico válido.");
    }
    if (!/^\d{10}$/.test(profilePhone)) {
      return setProfileError("El número de celular debe tener exactamente 10 dígitos (Ej: 1134567890).");
    }
    if (!profileKehila.trim()) return setProfileError("Ingresá tu Kehila.");

    const fullPhone = `+549${profilePhone}`;
    setProfileLoading(true);
    try {
      await completeRegistrationDetails(profileName.trim(), profileLastName.trim(), fullPhone, profileKehila.trim(), profileEmail.trim());
      setProfileSuccess("¡Tus datos de perfil fueron actualizados con éxito!");
      setPubPhone(profilePhone);
    } catch (err: any) {
      setProfileError(err.message || "Error al actualizar los datos.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Trigger preview image reader (multiple files)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Max 5 images limit check
    const totalCount = imageFiles.length + files.length;
    if (totalCount > 5) {
      setDashboardError("Podés subir hasta 5 fotos como máximo.");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Read previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrcs((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDashboardError(null);
    setSuccessMessage(null);

    if (!user || !user.isPhoneVerified) return;

    if (!title.trim()) return setDashboardError("Por favor, ingresá un título.");
    if (title.length < 5) return setDashboardError("El título debe ser más descriptivo (mínimo 5 letras).");
    if (!description.trim()) return setDashboardError("Por favor, describí el producto.");
    
    // Construct and validate contact preferences
    const preferences = [];
    if (prefWhatsApp) preferences.push("whatsapp");
    if (prefLlamadas) preferences.push("llamadas");
    if (prefSMS) preferences.push("sms");
    if (prefMail) preferences.push("mail");
    
    if (preferences.length === 0) {
      return setDashboardError("Por favor, seleccioná al menos una preferencia de contacto.");
    }
    
    if (selectedCategories.length === 0) {
      return setDashboardError("Por favor, seleccioná al menos una categoría para tu producto.");
    }
    
    if (imageFiles.length === 0) return setDashboardError("Por favor, subí al menos una foto de tu producto.");
    if (neighborhood === "Otro" && !customNeighborhood.trim()) {
      return setDashboardError("Por favor, ingresá el nombre del barrio.");
    }
    if (!/^\d{10}$/.test(pubPhone)) {
      return setDashboardError("El número de contacto para la publicación debe tener exactamente 10 dígitos (Ej: 1134567890).");
    }

    setFormLoading(true);
    try {
      // 1. Upload images in parallel
      const imageUrls = await Promise.all(
        imageFiles.map((file) => uploadProductImage(file))
      );
      const imageUrl = imageUrls[coverImageIndex] || imageUrls[0];

      // 2. Create product document
      const createdProd = await createProduct({
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        imageUrls,
        condition,
        neighborhood,
        customNeighborhood: neighborhood === "Otro" ? customNeighborhood.trim() : "",
        sellerId: user.uid,
        sellerName: `${user.name} ${user.lastName}`.trim(),
        sellerPhone: `+549${pubPhone.trim()}`,
        sellerEmail: user.email || "",
        maxContacts: maxContacts,
        contactPreferences: preferences,
        categories: selectedCategories
      });

      // 2b. Trigger alerts matching & email notifications (fire-and-forget with proper error handling)
      try {
        const alertHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        // Include internal secret if available (protects against unauthorized API calls)
        if (process.env.NEXT_PUBLIC_ALERT_NOTIFY_SECRET) {
          alertHeaders["x-internal-secret"] = process.env.NEXT_PUBLIC_ALERT_NOTIFY_SECRET;
        }
        
        const alertPayload = isFirebaseActive
          ? { productId: createdProd.id }
          : { mockProduct: createdProd, mockAlerts: (() => {
              const stored = localStorage.getItem("mesira_alerts_mock");
              return stored ? JSON.parse(stored) : [];
            })() };
        
        // Non-blocking: don't await this so the publish experience is instant
        fetch("/api/alerts/notify", {
          method: "POST",
          headers: alertHeaders,
          body: JSON.stringify(alertPayload),
        }).catch((alertErr) => {
          console.warn("Error triggering alerts notification (non-blocking):", alertErr);
        });
      } catch (alertErr) {
        console.warn("Error setting up alerts check:", alertErr);
      }

      // 3. Clear form
      setTitle("");
      setDescription("");
      setCondition("buen");
      setNeighborhood("Flores");
      setCustomNeighborhood("");
      setImageFiles([]);
      setImageSrcs([]);
      setCoverImageIndex(0);
      setMaxContacts(3);
      setPrefWhatsApp(true);
      setPrefLlamadas(true);
      setPrefSMS(false);
      setPrefMail(false);
      setSelectedCategories([]);
      setPubPhone(user?.phone ? user.phone.replace("+549", "") : "");
      if (fileInputRef.current) fileInputRef.current.value = "";

      setSuccessMessage("¡Tu producto fue publicado con éxito en Mesira Argentina!");
      
      // Auto switch to list tab after 2 seconds
      setTimeout(() => {
        setActiveTab("mis-publicaciones");
        setSuccessMessage(null);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setDashboardError("Hubo un error al publicar el producto. Intentá nuevamente.");
    } finally {
      setFormLoading(false);
    }
  };

  // Reactivate handler
  const handleReactivate = async (id: string) => {
    setDashboardError(null);
    try {
      const updated = await reactivateProduct(id);
      setMyProducts(prev => 
        prev.map(p => p.id === id ? updated : p)
      );
    } catch (err) {
      setDashboardError("No se pudo reactivar la publicación.");
    }
  };

  // Deactivate handler
  const handleDeactivate = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés desactivar esta publicación? Dejará de mostrarse en el feed público de inmediato.")) return;
    setDashboardError(null);
    try {
      await deactivateProduct(id);
      setMyProducts(prev => 
        prev.map(p => {
          if (p.id === id) {
            return { ...p, isActive: false, deactivatedAt: Date.now() };
          }
          return p;
        })
      );
    } catch (err) {
      setDashboardError("No se pudo desactivar la publicación.");
    }
  };

  // Delete handler
  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar esta publicación permanentemente?")) return;
    setDashboardError(null);
    try {
      await deleteProduct(id, imageUrl);
      setMyProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setDashboardError("No se pudo eliminar la publicación.");
    }
  };

  // Create Alert handler
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setDashboardError(null);
    setSuccessMessage(null);

    if (!user) return;

    if (alerts.length >= 3) {
      setDashboardError("Límite alcanzado: Podés tener un máximo de 3 alertas activas por cuenta.");
      return;
    }

    // Validation: if everything is empty, suggest selecting at least one filter
    const categories = alertCategories.length > 0 ? alertCategories : ["Todos"];
    const conditions = alertConditions.length > 0 ? alertConditions : ["Todos"];
    const neighborhoods = alertNeighborhoods.length > 0 ? alertNeighborhoods : ["Todos"];

    setSavingAlert(true);
    try {
      const newAlert = await createAlert({
        userId: user.uid,
        userEmail: user.email || "",
        keyword: alertKeyword.trim(),
        categories,
        conditions,
        neighborhoods
      });
      setAlerts(prev => [newAlert, ...prev]);
      
      // Clear form
      setAlertKeyword("");
      setAlertCategories([]);
      setAlertConditions([]);
      setAlertNeighborhoods([]);

      setSuccessMessage("¡Alerta creada con éxito! Te avisaremos por email cuando haya coincidencias.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error creating alert:", err);
      setDashboardError("No se pudo crear la alerta.");
    } finally {
      setSavingAlert(false);
    }
  };

  // Delete Alert handler
  const handleDeleteAlert = async (id: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar esta alerta?")) return;
    setDashboardError(null);
    setDeletingAlertId(id);
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setSuccessMessage("Alerta eliminada con éxito.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting alert:", err);
      setDashboardError("No se pudo eliminar la alerta.");
    } finally {
      setDeletingAlertId(null);
    }
  };

  // Open edit modal for a product (owner or admin)
  const openEditModal = (prod: Product, isAdmin: boolean) => {
    setEditingProduct(prod);
    setEditIsAdmin(isAdmin);
    setEditTitle(prod.title);
    setEditDescription(prod.description);
    setEditCondition(prod.condition);
    setEditNeighborhood(prod.neighborhood);
    setEditCustomNeighborhood(prod.customNeighborhood || "");
    setEditCategories(prod.categories || []);
    setEditMaxContacts(prod.maxContacts || 3);
    
    // Load existing images
    const existingUrls = prod.imageUrls && prod.imageUrls.length > 0
      ? prod.imageUrls
      : [prod.imageUrl];
    const items = existingUrls.map((url, index) => ({
      id: `existing-${index}-${Date.now()}`,
      src: url
    }));
    setEditImages(items);
    
    // Find cover image ID
    const coverItem = items.find(item => item.src === prod.imageUrl) || items[0];
    setEditCoverId(coverItem ? coverItem.id : "");
    
    setEditError(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditImages([]);
    setEditCoverId("");
    setEditError(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const totalCount = editImages.length + files.length;
    if (totalCount > 5) {
      setEditError("Podés tener hasta 5 fotos en total.");
      return;
    }

    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImages((prev) => [
          ...prev,
          {
            id: `new-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            src: reader.result as string,
            file: file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !user) return;
    setEditError(null);
    if (!editTitle.trim()) return setEditError("El título no puede estar vacío.");
    if (!editDescription.trim()) return setEditError("La descripción no puede estar vacía.");
    if (editNeighborhood === "Otro" && !editCustomNeighborhood.trim()) return setEditError("Especificá el barrio.");
    if (editImages.length === 0) return setEditError("Tenés que incluir al menos una foto.");

    // Validate that the cover image exists in the current list
    const hasCover = editImages.some((img) => img.id === editCoverId);
    const coverIdToUse = hasCover ? editCoverId : editImages[0].id;

    setEditLoading(true);
    try {
      // 1. Upload all new images in parallel and keep existing ones
      const finalImageUrls = await Promise.all(
        editImages.map(async (img) => {
          if (img.file) {
            return await uploadProductImage(img.file);
          }
          return img.src; // existing URL
        })
      );

      // 2. Identify the selected cover URL
      const coverIndex = editImages.findIndex((img) => img.id === coverIdToUse);
      const imageUrl = finalImageUrls[coverIndex] || finalImageUrls[0];

      const editData: ProductEditData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        condition: editCondition,
        neighborhood: editNeighborhood,
        customNeighborhood: editNeighborhood === "Otro" ? editCustomNeighborhood.trim() : "",
        categories: editCategories,
        maxContacts: editMaxContacts,
        imageUrl,
        imageUrls: finalImageUrls,
      };

      if (editIsAdmin) {
        // Admin editing any product
        await editProductAdmin(editingProduct.id, editData, getIdToken);
        setAdminProducts(prev => prev.map(p => p.id === editingProduct.id
          ? { ...p, ...editData }
          : p
        ));
      } else {
        // User editing their own product
        const updated = await updateProductContent(editingProduct.id, user.uid, editData);
        setMyProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...editData } : p));
      }

      setSuccessMessage("¡Publicación actualizada con éxito!");
      setTimeout(() => setSuccessMessage(null), 4000);
      closeEditModal();
    } catch (err: any) {
      setEditError(err.message || "Error al guardar los cambios.");
    } finally {
      setEditLoading(false);
    }
  };


  // Admin action handlers
  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    
    let isValid = false;
    if (user?.email === "israel.chueke@gmail.com" && adminPassword === "541251") {
      isValid = true;
    } else if (user?.email === "eli2626cohen@gmail.com" && adminPassword === "1850") {
      isValid = true;
    }

    if (isValid) {
      setIsAdminAuthenticated(true);
      setAdminPassword("");
    } else {
      setAdminAuthError("Clave incorrecta. Intentá nuevamente.");
    }
  };

  const handleAdminDeactivate = async (id: string) => {
    if (!confirm("¿Desactivar esta publicación de forma administrativa?")) return;
    setDashboardError(null);
    try {
      await deactivateProductAdmin(id, getIdToken);
      setAdminProducts(prev => 
        prev.map(p => p.id === id ? { ...p, isActive: false, deactivatedAt: Date.now() } : p)
      );
      setSuccessMessage("Publicación desactivada.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setDashboardError(err.message || "No se pudo desactivar la publicación.");
    }
  };

  const handleAdminReactivate = async (id: string) => {
    setDashboardError(null);
    try {
      const updated = await reactivateProductAdmin(id, getIdToken);
      setAdminProducts(prev => 
        prev.map(p => p.id === id ? updated : p)
      );
      setSuccessMessage("Publicación reactivada.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setDashboardError(err.message || "No se pudo reactivar la publicación.");
    }
  };

  const handleAdminDeleteProduct = async (id: string, imageUrl: string) => {
    if (!confirm("¿Eliminar esta publicación permanentemente de la plataforma?")) return;
    setDashboardError(null);
    try {
      await deleteProductAdmin(id, imageUrl, getIdToken);
      setAdminProducts(prev => prev.filter(p => p.id !== id));
      setSuccessMessage("Publicación eliminada.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setDashboardError(err.message || "No se pudo eliminar la publicación.");
    }
  };

  const handleAdminDeleteUser = async (uid: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de que querés eliminar permanentemente al usuario ${userEmail}? Se borrará de la base de datos y de la autenticación.`)) return;
    
    const deleteProducts = confirm("¿Querés eliminar también todas las publicaciones de este usuario?");
    
    setDashboardError(null);
    setLoadingAdminData(true);
    try {
      await deleteUserAdmin(uid, deleteProducts, getIdToken);
      
      setAdminUsers(prev => prev.filter(u => u.uid !== uid));
      if (deleteProducts) {
        setAdminProducts(prev => prev.filter(p => p.sellerId !== uid));
      }
      
      setSuccessMessage("Usuario eliminado con éxito.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setDashboardError(err.message || "No se pudo eliminar al usuario.");
    } finally {
      setLoadingAdminData(false);
    }
  };


  // Page level registration handler (saves profile directly as verified)
  const handlePageDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) return setRegError("Ingresá tu nombre.");
    if (!regLastName.trim()) return setRegError("Ingresá tu apellido.");
    if (!/^\d{10}$/.test(regPhone)) {
      return setRegError("El número debe tener 10 dígitos (Ej: 1134567890).");
    }
    if (!regKehila.trim()) return setRegError("Ingresá tu Kehila.");

    const fullPhone = `+549${regPhone}`;
    setRegLoading(true);
    try {
      await completeRegistrationDetails(regName.trim(), regLastName.trim(), fullPhone, regKehila.trim());
    } catch (err: any) {
      setRegError(err.message || "Error de registro.");
    } finally {
      setRegLoading(false);
    }
  };

  // Filter admin lists client-side based on search query
  const filteredAdminProducts = adminProducts.filter(p => {
    const q = adminSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q) ||
      (p.sellerEmail && p.sellerEmail.toLowerCase().includes(q))
    );
  });

  const filteredAdminUsers = adminUsers.filter(u => {
    const q = adminSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.kehila && u.kehila.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    const kehilaA = (a.kehila || "").toLowerCase().trim();
    const kehilaB = (b.kehila || "").toLowerCase().trim();
    if (!kehilaA && kehilaB) return 1;
    if (kehilaA && !kehilaB) return -1;
    return kehilaA.localeCompare(kehilaB);
  });

  // Loading indicator for auth check
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-ml-blue border-t-transparent"></div>
        <p className="text-sm text-gray-500 mt-3">Validando cuenta...</p>
      </div>
    );
  }

  // CASE 1: NOT LOGGED IN
  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 w-full mt-12 text-center">
        <div className="bg-white rounded-lg border border-ml-border p-8 shadow-sm">
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={48} />
          <h1 className="text-xl font-bold text-ml-dark mb-2">Ingresá a tu cuenta</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Para poder publicar artículos gratuitos y administrar tus publicaciones, necesitás iniciar sesión.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full bg-ml-blue hover:bg-ml-blue-hover text-white py-3 rounded font-bold text-sm shadow-sm transition"
          >
            Iniciar sesión / Registrarse
          </button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    );
  }

  // CASE 2: LOGGED IN BUT PHONE NOT COMPLETE
  if (!user.isPhoneVerified) {
    return (
      <main className="max-w-md mx-auto px-4 w-full mt-12">
        <div className="bg-white rounded-lg border border-ml-border p-6 shadow-sm">
          <h1 className="text-xl font-bold text-ml-dark mb-2 flex items-center gap-1.5">
            <span>Completar tus Datos</span>
          </h1>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            Es necesario registrar tu nombre, apellido y celular argentino antes de poder publicar o contactar.
          </p>

          {regError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded mb-4">
              {regError}
            </div>
          )}

          <form onSubmit={handlePageDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Apellido</label>
              <input
                type="text"
                required
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Celular Argentino</label>
              <div className="flex gap-2">
                <span className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 font-medium flex items-center select-none">
                  +54 9
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Ej. 1134567890"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">
                Código de área sin el 0 y número celular sin el 15. Debe tener exactamente 10 dígitos.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Kehila</label>
              <input
                type="text"
                required
                placeholder="Ej. Templo Paso / Jabad / Sucath David"
                value={regKehila}
                onChange={(e) => setRegKehila(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>
            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-ml-blue hover:bg-ml-blue-hover text-white py-2.5 rounded font-bold text-sm transition flex items-center justify-center gap-2"
            >
              {regLoading && <Loader2 className="animate-spin" size={16} />}
              <span>Guardar datos de contacto</span>
            </button>
          </form>
        </div>
      </main>
    );
  }

  // CASE 3: FULLY LOGGED IN AND COMPLETED
  return (
    <>
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Column: Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 bg-white border border-ml-border rounded-lg p-4 shadow-sm flex flex-col gap-2">
        {/* User profile header */}
        <div className="flex items-center gap-3 p-2 mb-2 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-cyan-50 text-ml-blue flex items-center justify-center font-bold text-sm shrink-0 uppercase select-none">
            {user.name ? user.name[0] : (user.email ? user.email[0] : "U")}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ml-dark truncate">
              {user.name ? `${user.name} ${user.lastName}`.trim() : "Usuario"}
            </h4>
            <p className="text-[10px] text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Sidebar Tab buttons */}
        <button
          onClick={() => setActiveTab("perfil")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-lg transition-all focus:outline-none text-left ${
            activeTab === "perfil" 
              ? "bg-blue-50/50 text-[#0043C6]" 
              : "text-gray-500 hover:text-ml-dark hover:bg-gray-50/50"
          }`}
        >
          <User size={16} />
          <span>Mi Perfil</span>
        </button>

        <button
          onClick={() => setActiveTab("mis-publicaciones")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-lg transition-all focus:outline-none text-left ${
            activeTab === "mis-publicaciones" 
              ? "bg-blue-50/50 text-[#0043C6]" 
              : "text-gray-500 hover:text-ml-dark hover:bg-gray-50/50"
          }`}
        >
          <FolderHeart size={16} />
          <span>Productos publicados</span>
        </button>

        <button
          onClick={() => setActiveTab("publicar")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-lg transition-all focus:outline-none text-left ${
            activeTab === "publicar" 
              ? "bg-blue-50/50 text-[#0043C6]" 
              : "text-gray-500 hover:text-ml-dark hover:bg-gray-50/50"
          }`}
        >
          <PlusCircle size={16} />
          <span>Publicar producto</span>
        </button>

        <button
          onClick={() => setActiveTab("alertas")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-lg transition-all focus:outline-none text-left ${
            activeTab === "alertas" 
              ? "bg-blue-50/50 text-[#0043C6]" 
              : "text-gray-500 hover:text-ml-dark hover:bg-gray-50/50"
          }`}
        >
          <Bell size={16} />
          <span>Mis Alertas</span>
        </button>

        {user.email && ["israel.chueke@gmail.com", "eli2626cohen@gmail.com"].includes(user.email) && (
          <button
            onClick={() => setActiveTab("administrar")}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-lg transition-all focus:outline-none text-left border border-dashed border-red-200 hover:border-red-400 ${
              activeTab === "administrar" 
                ? "bg-red-50 text-red-700" 
                : "text-red-500 hover:text-red-700 hover:bg-red-50/50"
            }`}
          >
            <ShieldAlert size={16} />
            <span>Administrar</span>
          </button>
        )}
      </div>

      {/* Right Column: Content Area */}
      <div className="flex-1 w-full">

      {dashboardError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded mb-6 flex items-start gap-2.5">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <span>{dashboardError}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded mb-6 flex items-start gap-2.5">
          <CheckCircle className="shrink-0 mt-0.5 text-ml-green" size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TAB 1: PUBLISH PRODUCT */}
      {activeTab === "publicar" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-8 bg-white border border-ml-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ml-dark mb-4 pb-2 border-b border-gray-150">
              Detalles del producto a regalar
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Título de la publicación
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="Ej. Mesa de madera de pino con 4 sillas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue placeholder-gray-400"
                />
                <p className="text-[10px] text-gray-400 mt-1">Límite de 50 caracteres. Escribí un título descriptivo.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Descripción del producto
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribí aquí las medidas, detalles de desgaste, si hay que bajarlo por escalera o si necesitás que lo retiren antes de un día en específico..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue placeholder-gray-400"
                />
                <p className="text-xs text-amber-600 font-medium mt-1 leading-tight flex items-start gap-1">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>Recomendación: Describe tu producto detalladamente para evitar que te contacten sin motivo.</span>
                </p>
              </div>

              {/* Categorías */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Categoría del producto (Podés seleccionar varias)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50/50 border border-gray-150 rounded-xl p-3.5">
                  {AVAILABLE_CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.value);
                    return (
                      <label 
                        key={cat.value} 
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                          isChecked 
                            ? "bg-cyan-50/40 border-cyan-300 text-cyan-800" 
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories(prev => [...prev, cat.value]);
                            } else {
                              setSelectedCategories(prev => prev.filter(c => c !== cat.value));
                            }
                          }}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500/20 w-4 h-4 cursor-pointer"
                        />
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Condition & Neighborhood */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                    Estado del producto
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                  >
                    <option value="perfecto">Perfecto estado</option>
                    <option value="buen">Buen estado</option>
                    <option value="funcional">Estado funcional (Sirve con detalles)</option>
                    <option value="reparar">Mal estado / A reparar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                    Barrio de retiro
                  </label>
                  <select
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                  >
                    <option value="Flores">Flores</option>
                    <option value="Once">Once</option>
                    <option value="Barracas">Barracas</option>
                    <option value="Belgrano">Belgrano</option>
                    <option value="Palermo">Palermo</option>
                    <option value="Villa Crespo">Villa Crespo</option>
                    <option value="Otro">Otro barrio...</option>
                  </select>
                </div>
              </div>

              {/* Custom Neighborhood */}
              {neighborhood === "Otro" && (
                <div className="animate-in slide-in-from-top-2 duration-150">
                  <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                    Especificá el barrio
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Caballito o San Telmo"
                    value={customNeighborhood}
                    onChange={(e) => setCustomNeighborhood(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue placeholder-gray-400"
                  />
                </div>
              )}

              {/* Max Contacts Limit */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Límite de personas que te pueden contactar
                </label>
                <select
                  value={maxContacts}
                  onChange={(e) => setMaxContacts(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      Hasta {num} {num === 1 ? "persona" : "personas"} (desactivación automática)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Cuando esta cantidad de personas distintas te contacten, tu publicación se desactivará del feed para evitar spam.
                </p>
              </div>

              {/* Phone contact input for publication */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Número de celular de contacto para esta publicación
                </label>
                <div className="flex gap-2">
                  <span className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 font-medium flex items-center select-none">
                    +54 9
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Ej. 1134567890"
                    value={pubPhone}
                    onChange={(e) => setPubPhone(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Por defecto se completa con tu número de perfil, pero podés cambiarlo para esta publicación si preferís que te contacten a otro número.
                </p>
              </div>

              {/* Preferencias de contacto */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-2">
                  Preferencias de contacto
                </label>
                <div className="grid grid-cols-2 gap-3 bg-gray-50/50 border border-gray-150 rounded-xl p-3.5">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-ml-dark cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={prefWhatsApp} 
                      onChange={(e) => setPrefWhatsApp(e.target.checked)}
                      className="rounded border-gray-300 text-ml-blue focus:ring-ml-blue/20 w-4 h-4"
                    />
                    <span>WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-ml-dark cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={prefLlamadas} 
                      onChange={(e) => setPrefLlamadas(e.target.checked)}
                      className="rounded border-gray-300 text-ml-blue focus:ring-ml-blue/20 w-4 h-4"
                    />
                    <span>Llamadas</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-ml-dark cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={prefSMS} 
                      onChange={(e) => setPrefSMS(e.target.checked)}
                      className="rounded border-gray-300 text-ml-blue focus:ring-ml-blue/20 w-4 h-4"
                    />
                    <span>SMS</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-ml-dark cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={prefMail} 
                      onChange={(e) => setPrefMail(e.target.checked)}
                      className="rounded border-gray-300 text-ml-blue focus:ring-ml-blue/20 w-4 h-4"
                    />
                    <span>Email</span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Elegí de qué manera preferís que te contacten. Podés seleccionar más de una.
                </p>
              </div>

              {/* Image Picker */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Fotos del producto (Subí hasta 5 fotos. Hacé click en una para elegirla como Portada)
                </label>
                <div 
                  onClick={() => {
                    if (imageFiles.length < 5) {
                      fileInputRef.current?.click();
                    } else {
                      setDashboardError("Ya subiste el límite de 5 fotos.");
                    }
                  }}
                  className={`border-2 border-dashed border-gray-300 hover:border-ml-blue rounded-lg p-5 text-center cursor-pointer transition bg-gray-50 hover:bg-emerald-50/20 flex flex-col items-center justify-center gap-1.5 ${
                    imageFiles.length >= 5 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <ImageIcon className="text-gray-400" size={32} />
                  <span className="text-xs font-bold text-ml-dark">Hacé click para subir imágenes</span>
                  <span className="text-[10px] text-gray-400">Podés seleccionar varias. Permitidos: JPG, PNG, WEBP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {imageSrcs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] text-gray-400 font-semibold block">
                      Hacé click en la foto que querés que sea la de portada (estará marcada con ★ Portada):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-gray-50 border border-gray-150 rounded-xl p-3">
                      {imageSrcs.map((src, index) => {
                        const isCover = index === coverImageIndex;
                        return (
                          <div 
                            key={index}
                            onClick={() => setCoverImageIndex(index)}
                            className={`relative rounded-lg overflow-hidden aspect-square border-2 cursor-pointer transition select-none ${
                              isCover ? "border-ml-blue ring-2 ring-ml-blue/10" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <img src={src} alt={`preview-${index}`} className="w-full h-full object-cover" />
                            {isCover ? (
                              <div className="absolute bottom-0 left-0 right-0 bg-ml-blue text-white text-[9px] font-bold py-0.5 text-center flex items-center justify-center gap-0.5">
                                <span>★ Portada</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition">Usar portada</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageFiles((prev) => prev.filter((_, i) => i !== index));
                                setImageSrcs((prev) => prev.filter((_, i) => i !== index));
                                // adjust cover index
                                if (coverImageIndex === index) {
                                  setCoverImageIndex(0);
                                } else if (coverImageIndex > index) {
                                  setCoverImageIndex((prev) => prev - 1);
                                }
                              }}
                              className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition hover:scale-105"
                              title="Quitar imagen"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="pt-4 border-t border-gray-150 flex justify-end">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-ml-blue hover:bg-ml-blue-hover disabled:bg-gray-200 text-white font-bold py-3 px-6 rounded text-sm transition shadow-sm focus:outline-none flex items-center gap-2"
                >
                  {formLoading && <Loader2 className="animate-spin" size={16} />}
                  <span>Confirmar publicación</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Card Preview */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 w-full text-center lg:text-left px-1">
              Vista previa en tiempo real
            </h3>
            <ProductPreview
              title={title}
              condition={condition}
              neighborhood={neighborhood}
              customNeighborhood={customNeighborhood}
              imageSrc={imageSrcs[coverImageIndex] || null}
            />
          </div>
        </div>
      )}

      {/* TAB 2: MY PUBLICATIONS LIST */}
      {activeTab === "mis-publicaciones" && (
        <div className="bg-white border border-ml-border rounded-lg shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-ml-dark p-6 border-b border-gray-150">
            Administrar mis publicaciones
          </h2>

          {loadingProducts ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-ml-blue mb-2" size={28} />
              <span className="text-sm text-gray-500">Cargando tus publicaciones...</span>
            </div>
          ) : myProducts.length === 0 ? (
            <div className="p-12 text-center">
              <FolderHeart className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-sm font-semibold text-ml-dark">No tenés publicaciones todavía.</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-6">Regalá lo que ya no usás y dale una segunda vida.</p>
              <button
                onClick={() => setActiveTab("publicar")}
                className="bg-ml-blue hover:bg-ml-blue-hover text-white px-5 py-2.5 rounded font-bold text-xs shadow-sm transition"
              >
                Publicar mi primer producto
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-150">
              {myProducts.map(prod => {
                const createdTime = typeof prod.createdAt === "number" ? prod.createdAt : new Date(prod.createdAt).getTime();
                const ageHours = (Date.now() - createdTime) / (60 * 60 * 1000);
                
                const limit = prod.maxContacts || 3;
                const deactTime = prod.deactivatedAt
                  ? (typeof prod.deactivatedAt === "number" ? prod.deactivatedAt : new Date(prod.deactivatedAt).getTime())
                  : createdTime;
                const deactAgeHours = (Date.now() - deactTime) / (60 * 60 * 1000);
                
                const isExpiredActive = prod.isActive && prod.contactCount < limit && ageHours > 60 * 24;
                const isExpiredDeactivated = (!prod.isActive || prod.contactCount >= limit) && deactAgeHours > 48;
                const isDeactivated = !prod.isActive || prod.contactCount >= limit || isExpiredActive || isExpiredDeactivated;
                
                const neighborhoodLabel = prod.neighborhood === "Otro" ? prod.customNeighborhood : prod.neighborhood;

                return (
                  <div key={prod.id} className="p-4 md:p-6 flex flex-col md:flex-row items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <img 
                        src={prod.imageUrl} 
                        alt={prod.title} 
                        className="w-16 h-16 object-cover rounded border border-gray-200 bg-gray-50 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-ml-dark truncate max-w-[280px] md:max-w-md">
                          {prod.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Barrio: {neighborhoodLabel} • Creado el {new Date(createdTime).toLocaleDateString()}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {isDeactivated ? (
                            <span className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 uppercase tracking-wide">
                              {isExpiredActive ? "Expirado (60 días)" : isExpiredDeactivated ? "Expirado (48 hs)" : "Desactivado"}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-green-50 text-ml-green px-2 py-0.5 rounded border border-green-200 uppercase tracking-wide">
                              Activo
                            </span>
                          )}
                          
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                            {prod.contactCount} / {limit} contactos
                          </span>

                          <span className="text-[9px] font-bold bg-emerald-50 text-ml-blue px-2 py-0.5 rounded border border-emerald-200">
                            {prod.viewsCount || 0} {prod.viewsCount === 1 ? "visita" : "visitas"} ({prod.viewedUserIds?.length || 0} {prod.viewedUserIds?.length === 1 ? "usuario" : "usuarios"})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <a
                        href={`/producto/${prod.id}`}
                        className="flex items-center gap-1 border border-gray-300 hover:border-ml-blue hover:text-ml-blue rounded text-xs px-3 py-2 text-gray-600 font-bold bg-white transition"
                      >
                        <Eye size={14} />
                        <span>Ver</span>
                      </a>

                      <button
                        onClick={() => openEditModal(prod, false)}
                        className="flex items-center gap-1 border border-blue-200 hover:bg-blue-50 text-blue-600 hover:border-blue-300 rounded text-xs px-3 py-2 font-bold transition"
                        title="Editar publicación"
                      >
                        <Pencil size={14} />
                        <span>Editar</span>
                      </button>

                      {!isDeactivated ? (
                        <button
                          onClick={() => handleDeactivate(prod.id)}
                          className="flex items-center gap-1 border border-amber-200 hover:bg-amber-50 text-amber-600 hover:border-amber-300 rounded text-xs px-3 py-2 font-bold transition"
                          title="Desactivar publicación"
                        >
                          <PowerOff size={14} />
                          <span>Desactivar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(prod.id)}
                          className="flex items-center gap-1 bg-ml-blue hover:bg-ml-blue-hover text-white rounded text-xs px-3 py-2 font-bold transition shadow-sm"
                        >
                          <RefreshCw size={14} />
                          <span>Activar de nuevo</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(prod.id, prod.imageUrl)}
                        className="flex items-center gap-1 border border-red-200 hover:bg-red-50 text-red-600 hover:border-red-300 rounded text-xs px-3 py-2 font-bold transition"
                        title="Eliminar publicación"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE EDIT */}
      {activeTab === "perfil" && (
        <div className="max-w-xl mx-auto bg-white border border-ml-border rounded-lg p-6 shadow-sm w-full">
          <h2 className="text-lg font-bold text-ml-dark mb-4 pb-2 border-b border-gray-150">
            Editar datos de perfil y contacto
          </h2>

          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded mb-4">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-2.5 rounded mb-4">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Nombre</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Apellido</label>
              <input
                type="text"
                required
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Celular Argentino</label>
              <div className="flex gap-2">
                <span className="bg-gray-100 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 font-medium flex items-center select-none">
                  +54 9
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Ej. 1134567890"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">
                Código de área sin el 0 y número celular sin el 15. Debe tener exactamente 10 dígitos.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Email de contacto</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Kehila</label>
              <input
                type="text"
                required
                placeholder="Ej. Templo Paso / Jabad / Sucath David"
                value={profileKehila}
                onChange={(e) => setProfileKehila(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-[#0043C6] hover:bg-[#0036A3] text-white py-2.5 rounded font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {profileLoading && <Loader2 className="animate-spin" size={16} />}
              <span>Guardar cambios</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ALERTS SYSTEM */}
      {activeTab === "alertas" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create Alert Form Column */}
          <div className="lg:col-span-7 bg-white border border-ml-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ml-dark mb-4 pb-2 border-b border-gray-150 flex items-center gap-2">
              <Bell className="text-ml-blue" size={20} />
              <span>Crear alerta en tiempo real</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Configurá una alerta para recibir un correo electrónico al instante cuando alguien publique un producto de tu interés.
            </p>

            <form onSubmit={handleCreateAlert} className="space-y-5">
              {/* Keyword */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Palabra clave (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: cuna, cochecito, silla..."
                  value={alertKeyword}
                  onChange={(e) => setAlertKeyword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue placeholder-gray-400"
                />
                <p className="text-[10px] text-gray-400 mt-1">Buscaremos esta palabra en el título y descripción de las publicaciones.</p>
              </div>

              {/* Categorías */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider">
                    Categorías
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (alertCategories.length === AVAILABLE_CATEGORIES.length) {
                        setAlertCategories([]);
                      } else {
                        setAlertCategories(AVAILABLE_CATEGORIES.map(c => c.value));
                      }
                    }}
                    className="text-[10px] font-bold text-ml-blue hover:underline focus:outline-none cursor-pointer"
                  >
                    {alertCategories.length === AVAILABLE_CATEGORIES.length ? "Deseleccionar todas" : "Seleccionar todas"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50/50 border border-gray-150 rounded-xl p-3.5">
                  {AVAILABLE_CATEGORIES.map((cat) => {
                    const isChecked = alertCategories.includes(cat.value);
                    return (
                      <label 
                        key={cat.value} 
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                          isChecked 
                            ? "bg-cyan-50/40 border-cyan-300 text-cyan-800" 
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlertCategories(prev => [...prev, cat.value]);
                            } else {
                              setAlertCategories(prev => prev.filter(c => c !== cat.value));
                            }
                          }}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500/20 w-4 h-4 cursor-pointer"
                        />
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Estado / Condiciones */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider">
                    Estado
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const values = ["perfecto", "buen", "funcional", "reparar"];
                      if (alertConditions.length === values.length) {
                        setAlertConditions([]);
                      } else {
                        setAlertConditions(values);
                      }
                    }}
                    className="text-[10px] font-bold text-ml-blue hover:underline focus:outline-none cursor-pointer"
                  >
                    {alertConditions.length === 4 ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-gray-50/50 border border-gray-150 rounded-xl p-3.5">
                  {[
                    { value: "perfecto", label: "Perfecto estado" },
                    { value: "buen", label: "Buen estado" },
                    { value: "funcional", label: "Estado funcional" },
                    { value: "reparar", label: "Mal estado / A reparar" }
                  ].map((cond) => {
                    const isChecked = alertConditions.includes(cond.value);
                    return (
                      <label 
                        key={cond.value} 
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                          isChecked 
                            ? "bg-cyan-50/40 border-cyan-300 text-cyan-800" 
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlertConditions(prev => [...prev, cond.value]);
                            } else {
                              setAlertConditions(prev => prev.filter(c => c !== cond.value));
                            }
                          }}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500/20 w-4 h-4 cursor-pointer"
                        />
                        <span>{cond.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Barrios */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider">
                    Barrios de retiro
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const values = ["Flores", "Once", "Barracas", "Belgrano", "Palermo", "Villa Crespo", "Otro"];
                      if (alertNeighborhoods.length === values.length) {
                        setAlertNeighborhoods([]);
                      } else {
                        setAlertNeighborhoods(values);
                      }
                    }}
                    className="text-[10px] font-bold text-ml-blue hover:underline focus:outline-none cursor-pointer"
                  >
                    {alertNeighborhoods.length === 7 ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50/50 border border-gray-150 rounded-xl p-3.5">
                  {["Flores", "Once", "Barracas", "Belgrano", "Palermo", "Villa Crespo", "Otro"].map((barrio) => {
                    const isChecked = alertNeighborhoods.includes(barrio);
                    return (
                      <label 
                        key={barrio} 
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                          isChecked 
                            ? "bg-cyan-50/40 border-cyan-300 text-cyan-800" 
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlertNeighborhoods(prev => [...prev, barrio]);
                            } else {
                              setAlertNeighborhoods(prev => prev.filter(b => b !== barrio));
                            }
                          }}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500/20 w-4 h-4 cursor-pointer"
                        />
                        <span>{barrio}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-4 border-t border-gray-150 flex justify-end">
                <button
                  type="submit"
                  disabled={savingAlert}
                  className="bg-ml-blue hover:bg-ml-blue-hover disabled:bg-gray-200 text-white font-bold py-3 px-6 rounded text-sm transition shadow-sm focus:outline-none flex items-center gap-2 cursor-pointer"
                >
                  {savingAlert && <Loader2 className="animate-spin" size={16} />}
                  <span>Guardar Alerta</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Alerts List Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
              Mis Alertas Activas ({alerts.length})
            </h3>
            
            {loadingAlerts ? (
              <div className="bg-white border border-ml-border rounded-lg p-12 text-center flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-ml-blue mb-2.5" size={24} />
                <span className="text-xs text-gray-500">Cargando alertas configuradas...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-white border border-ml-border rounded-lg p-8 text-center">
                <Bell className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-xs font-bold text-ml-dark">No tenés alertas configuradas.</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Creá tu primera alerta a la izquierda para enterarte primero cuando regalen lo que buscás.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const hasKeyword = alert.keyword && alert.keyword.trim() !== "";
                  const catsLabel = alert.categories.includes("Todos") ? "Cualquier categoría" : alert.categories.map(c => {
                    const catMap: Record<string, string> = {
                      ropa: "Ropa", muebles: "Muebles", electronica: "Electrónica", bazar: "Bazar",
                      herramientas: "Herramientas", farmacia: "Farmacia", "accesorios para vehiculos": "Vehículos",
                      bebes: "Bebés", juguetes: "Juguetes", libros: "Libros", "kodesh y judaica": "Judaica", otro: "Otros"
                    };
                    return catMap[c] || c;
                  }).join(", ");
                  const condsLabel = alert.conditions.includes("Todos") ? "Cualquier estado" : alert.conditions.map(c => {
                    const map: Record<string, string> = { perfecto: "Perfecto", buen: "Bueno", funcional: "Funcional", reparar: "Reparar" };
                    return map[c] || c;
                  }).join(", ");
                  const barriosLabel = alert.neighborhoods.includes("Todos") ? "Cualquier barrio" : alert.neighborhoods.join(", ");

                  return (
                    <div 
                      key={alert.id}
                      className="bg-white border border-ml-border hover:border-gray-300 rounded-lg p-4 shadow-xs relative flex flex-col gap-2.5 transition animate-in fade-in-30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-ml-dark leading-tight flex items-center gap-1.5 flex-wrap">
                            <span className="text-ml-blue shrink-0">🔔</span>
                            {hasKeyword ? (
                              <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-xs font-bold font-mono">
                                "{alert.keyword}"
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Cualquier palabra clave</span>
                            )}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          disabled={deletingAlertId === alert.id}
                          className="text-gray-400 hover:text-red-500 transition p-1 hover:bg-gray-50 rounded cursor-pointer"
                          title="Eliminar alerta"
                        >
                          {deletingAlertId === alert.id ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5 border-t border-gray-150 pt-2 text-[11px] text-gray-500">
                        <p><strong className="text-gray-600 font-semibold">📁 Categorías:</strong> <span className="text-gray-500">{catsLabel}</span></p>
                        <p><strong className="text-gray-600 font-semibold">📍 Barrios:</strong> <span className="text-gray-500">{barriosLabel}</span></p>
                        <p><strong className="text-gray-600 font-semibold">🛡️ Estados:</strong> <span className="text-gray-500">{condsLabel}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN DASHBOARD */}
      {activeTab === "administrar" && ["israel.chueke@gmail.com", "eli2626cohen@gmail.com"].includes(user.email || "") && (
        <div className="bg-white border border-ml-border rounded-lg shadow-sm overflow-hidden p-6 w-full">
          {!isAdminAuthenticated ? (
            <div className="max-w-md mx-auto py-12 text-center">
              <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-xl font-bold text-ml-dark mb-2">Modo Administrador Requerido</h2>
              <p className="text-sm text-gray-500 mb-6">
                Ingresá la clave de acceso de administración para poder gestionar las publicaciones y usuarios.
              </p>

              {adminAuthError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded mb-4">
                  {adminAuthError}
                </div>
              )}

              <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
                <input
                  type="password"
                  required
                  placeholder="Ej. 123456"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-center text-ml-dark focus:outline-none focus:border-ml-blue"
                />
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold text-sm transition shadow-sm cursor-pointer"
                >
                  Confirmar Clave
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Admin Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-ml-dark flex items-center gap-2">
                    <Shield className="text-red-600" size={22} />
                    <span>Panel de Control Administrativo</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Gestioná publicaciones y usuarios registrados en la plataforma.
                  </p>
                </div>

                {/* Sub-tabs toggles */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setAdminActiveSubTab("publicaciones");
                      setAdminSearchQuery("");
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition ${
                      adminActiveSubTab === "publicaciones"
                        ? "bg-white text-ml-dark shadow-xs"
                        : "text-gray-500 hover:text-ml-dark"
                    }`}
                  >
                    <FolderHeart size={14} />
                    <span>Publicaciones ({adminProducts.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdminActiveSubTab("usuarios");
                      setAdminSearchQuery("");
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition ${
                      adminActiveSubTab === "usuarios"
                        ? "bg-white text-ml-dark shadow-xs"
                        : "text-gray-500 hover:text-ml-dark"
                    }`}
                  >
                    <Users size={14} />
                    <span>Usuarios ({adminUsers.length})</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={
                    adminActiveSubTab === "publicaciones"
                      ? "Buscar por título, vendedor, descripción..."
                      : "Buscar por nombre, email, celular..."
                  }
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded pl-10 pr-4 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue placeholder-gray-400"
                />
              </div>

              {/* Loader */}
              {loadingAdminData ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-ml-blue mb-2.5" size={32} />
                  <span className="text-sm text-gray-500">Procesando solicitud...</span>
                </div>
              ) : (
                <>
                  {/* SUBTAB 1: PRODUCTS LIST */}
                  {adminActiveSubTab === "publicaciones" && (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                            <th className="p-3.5">Producto</th>
                            <th className="p-3.5">Vendedor</th>
                            <th className="p-3.5">Barrio</th>
                            <th className="p-3.5">Contactos / Vistas</th>
                            <th className="p-3.5">Estado</th>
                            <th className="p-3.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {filteredAdminProducts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                No se encontraron publicaciones.
                              </td>
                            </tr>
                          ) : (
                            filteredAdminProducts.map((prod) => {
                              const isDeact = !prod.isActive || (prod.contactCount >= (prod.maxContacts || 3));
                              const dateStr = prod.createdAt ? new Date(prod.createdAt).toLocaleDateString() : "-";
                              return (
                                <tr key={prod.id} className="hover:bg-gray-50/50">
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={prod.imageUrl}
                                        alt=""
                                        className="w-10 h-10 object-cover rounded border border-gray-150 bg-gray-50"
                                      />
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-ml-dark truncate max-w-[200px]" title={prod.title}>
                                          {prod.title}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 mt-0.5">ID: {prod.id} • {dateStr}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3.5">
                                    <div className="font-medium text-ml-dark">{prod.sellerName}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{prod.sellerPhone}</div>
                                    {prod.sellerEmail && (
                                      <div className="text-[10px] text-gray-400">{prod.sellerEmail}</div>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-gray-600 font-medium">
                                    {prod.neighborhood === "Otro" ? prod.customNeighborhood : prod.neighborhood}
                                  </td>
                                  <td className="p-3.5">
                                    <div className="text-ml-dark font-medium">
                                      {prod.contactCount} / {prod.maxContacts || 3}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      {prod.viewsCount || 0} visitas
                                    </div>
                                  </td>
                                  <td className="p-3.5">
                                    {isDeact ? (
                                      <span className="text-[9px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-150 uppercase">
                                        Desactivado
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold bg-green-50 text-ml-green px-1.5 py-0.5 rounded border border-green-150 uppercase">
                                        Activo
                                      </span>
                                    )}
                                  </td>
                                    <td className="p-3.5 text-right">
                                      <div className="flex items-center gap-1.5 justify-end">
                                        <a
                                          href={`/producto/${prod.id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 border border-gray-200 hover:border-ml-blue hover:text-ml-blue bg-white rounded transition"
                                          title="Ver publicación"
                                        >
                                          <Eye size={13} />
                                        </a>
                                        <button
                                          onClick={() => openEditModal(prod, true)}
                                          className="p-1.5 border border-blue-200 hover:bg-blue-50 text-blue-600 rounded transition"
                                          title="Editar publicación"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                        {isDeact ? (
                                          <button
                                            onClick={() => handleAdminReactivate(prod.id)}
                                            className="p-1.5 border border-gray-200 hover:bg-green-50 hover:text-ml-green bg-white rounded transition"
                                            title="Activar de nuevo"
                                          >
                                            <RefreshCw size={13} />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleAdminDeactivate(prod.id)}
                                            className="p-1.5 border border-amber-200 hover:bg-amber-50 text-amber-600 rounded transition"
                                            title="Desactivar publicación"
                                          >
                                            <PowerOff size={13} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleAdminDeleteProduct(prod.id, prod.imageUrl)}
                                          className="p-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded transition"
                                          title="Eliminar permanentemente"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SUBTAB 2: USERS LIST */}
                  {adminActiveSubTab === "usuarios" && (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                            <th className="p-3.5">Nombre / Apellido</th>
                            <th className="p-3.5">Email</th>
                            <th className="p-3.5">Kehila</th>
                            <th className="p-3.5">Celular</th>
                            <th className="p-3.5">Fecha Registro</th>
                            <th className="p-3.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {filteredAdminUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                No se encontraron usuarios.
                              </td>
                            </tr>
                          ) : (
                            filteredAdminUsers.map((usr) => {
                              const dateStr = usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : "-";
                              return (
                                <tr key={usr.uid} className="hover:bg-gray-50/50">
                                  <td className="p-3.5 font-bold text-ml-dark">
                                    {usr.name || usr.lastName ? `${usr.name} ${usr.lastName}`.trim() : "Sin completar"}
                                  </td>
                                  <td className="p-3.5 text-gray-600 font-medium">{usr.email}</td>
                                  <td className="p-3.5 text-gray-600 font-medium">{usr.kehila || "No especificada"}</td>
                                  <td className="p-3.5 text-gray-600 font-mono">
                                    {usr.phone ? usr.phone : "No registrado"}
                                  </td>
                                  <td className="p-3.5 text-gray-400">{dateStr}</td>
                                  <td className="p-3.5 text-right">
                                    <button
                                      onClick={() => handleAdminDeleteUser(usr.uid, usr.email)}
                                      disabled={["israel.chueke@gmail.com", "eli2626cohen@gmail.com"].includes(usr.email)}
                                      className="p-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={["israel.chueke@gmail.com", "eli2626cohen@gmail.com"].includes(usr.email) ? "No se puede eliminar a un administrador" : "Eliminar usuario"}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>

    {/* ===== EDIT PRODUCT MODAL ===== */}
    {editingProduct && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeEditModal}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-150">
            <div>
              <h2 className="text-base font-bold text-ml-dark flex items-center gap-2">
                <Pencil size={16} className="text-blue-600" />
                {editIsAdmin ? "Editar publicación (Admin)" : "Editar mi publicación"}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-sm">{editingProduct.title}</p>
            </div>
            <button onClick={closeEditModal} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
              <X size={18} />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleEditSave} className="p-5 space-y-4">
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Título</label>
              <input
                type="text"
                required
                maxLength={50}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea
                required
                rows={4}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Categorías</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50/50 border border-gray-150 rounded-xl p-3">
                {AVAILABLE_CATEGORIES.map(cat => {
                  const isChecked = editCategories.includes(cat.value);
                  return (
                    <label key={cat.value} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${
                      isChecked ? "bg-cyan-50/40 border-cyan-300 text-cyan-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) setEditCategories(prev => [...prev, cat.value]);
                          else setEditCategories(prev => prev.filter(c => c !== cat.value));
                        }}
                        className="rounded border-gray-300 text-cyan-600 w-4 h-4 cursor-pointer"
                      />
                      <span>{cat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Condition & Neighborhood */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Estado</label>
                <select
                  value={editCondition}
                  onChange={e => setEditCondition(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                >
                  <option value="perfecto">Perfecto estado</option>
                  <option value="buen">Buen estado</option>
                  <option value="funcional">Estado funcional (Sirve con detalles)</option>
                  <option value="reparar">Mal estado / A reparar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Barrio</label>
                <select
                  value={editNeighborhood}
                  onChange={e => setEditNeighborhood(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                >
                  <option value="Flores">Flores</option>
                  <option value="Once">Once</option>
                  <option value="Barracas">Barracas</option>
                  <option value="Belgrano">Belgrano</option>
                  <option value="Palermo">Palermo</option>
                  <option value="Villa Crespo">Villa Crespo</option>
                  <option value="Otro">Otro barrio...</option>
                </select>
              </div>
            </div>

            {editNeighborhood === "Otro" && (
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">Especificá el barrio</label>
                <input
                  type="text"
                  required
                  value={editCustomNeighborhood}
                  onChange={e => setEditCustomNeighborhood(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                />
              </div>
            )}

            {/* Límite de contactos */}
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                Límite de personas que te pueden contactar
              </label>
              <select
                value={editMaxContacts}
                onChange={e => setEditMaxContacts(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>
                    Hasta {num} {num === 1 ? "persona" : "personas"} (desactivación automática)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                Cuando esta cantidad de personas distintas te contacten, tu publicación se desactivará automáticamente.
              </p>
            </div>

            {/* Fotos del producto (editar) */}
            <div>
              <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                Fotos del producto (Subí hasta 5 fotos en total. Hacé click en una para elegirla como Portada)
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-gray-50 border border-gray-150 rounded-xl p-3 mb-3">
                {editImages.map((img, index) => {
                  const isCover = img.id === editCoverId;
                  return (
                    <div 
                      key={img.id}
                      onClick={() => setEditCoverId(img.id)}
                      className={`relative rounded-lg overflow-hidden aspect-square border-2 cursor-pointer transition select-none ${
                        isCover ? "border-ml-blue ring-2 ring-ml-blue/10" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img src={img.src} alt={`edit-preview-${index}`} className="w-full h-full object-cover" />
                      {isCover ? (
                        <div className="absolute bottom-0 left-0 right-0 bg-ml-blue text-white text-[9px] font-bold py-0.5 text-center flex items-center justify-center gap-0.5">
                          <span>★ Portada</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition">Usar portada</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditImages((prev) => prev.filter((item) => item.id !== img.id));
                          if (editCoverId === img.id) {
                            const remaining = editImages.filter((item) => item.id !== img.id);
                            if (remaining.length > 0) setEditCoverId(remaining[0].id);
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition hover:scale-105"
                        title="Quitar foto"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {editImages.length < 5 && (
                <div>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageChange}
                    className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Podés seleccionar una o varias fotos adicionales para agregar.</p>
                </div>
              )}
            </div>

            {/* Submit buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="flex items-center gap-2 bg-ml-blue hover:bg-ml-blue-hover disabled:bg-gray-200 text-white font-bold py-2 px-5 rounded text-xs transition shadow-sm"
              >
                {editLoading && <Loader2 className="animate-spin" size={14} />}
                <span>Guardar cambios</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}

// Fallback spinner for Suspense
function MiCuentaFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-ml-border shadow-sm">
      <Loader2 className="animate-spin text-ml-blue mb-2.5" size={32} />
      <p className="text-xs text-gray-400">Cargando panel de control...</p>
    </div>
  );
}

// Exported Suspense Wrapper Component
export default function MiCuentaPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ml-bg flex flex-col pb-12">
      <Header onOpenAuthModal={() => setIsAuthOpen(true)} />

      <main className="max-w-6xl mx-auto px-4 w-full mt-6 flex-1">
        <Suspense fallback={<MiCuentaFallback />}>
          <MiCuentaContent />
        </Suspense>
      </main>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </div>
  );
}
