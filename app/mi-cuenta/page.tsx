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
  deleteProduct, 
  uploadProductImage,
  Product 
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
  Sparkles
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function MiCuentaContent() {
  const { 
    user, 
    loading, 
    completeRegistrationDetails, 
    isFirebaseActive,
    isOnboardingCompleted, 
    setIsOnboardingCompleted 
  } = useAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: 'publicar' | 'mis-publicaciones'
  const [activeTab, setActiveTab] = useState<'publicar' | 'mis-publicaciones'>('publicar');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Form states for creation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<Product["condition"]>("buen");
  const [neighborhood, setNeighborhood] = useState("Flores");
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Dashboard states
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration/Verification details in page (fallback if they bypassed the modal)
  const [regName, setRegName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse tabs from URL search parameters (?tab=publicar)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "publicar" || tabParam === "mis-publicaciones") {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

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

  // Sync user values if registration details are empty
  useEffect(() => {
    if (user && !user.isPhoneVerified) {
      setRegName(user.name || "");
      setRegLastName(user.lastName || "");
      if (user.phone) {
        setRegPhone(user.phone.replace("+549", ""));
      }
    }
  }, [user]);

  // Trigger preview image reader
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDashboardError(null);
    setSuccessMessage(null);

    if (!user || !user.isPhoneVerified) return;

    if (!title.trim()) return setDashboardError("Por favor, ingresá un título.");
    if (title.length < 5) return setDashboardError("El título debe ser más descriptivo (mínimo 5 letras).");
    if (!description.trim()) return setDashboardError("Por favor, describí el producto.");
    if (!imageFile) return setDashboardError("Por favor, subí una foto de tu producto.");
    if (neighborhood === "Otro" && !customNeighborhood.trim()) {
      return setDashboardError("Por favor, ingresá el nombre del barrio.");
    }

    setFormLoading(true);
    try {
      // 1. Upload image
      const imageUrl = await uploadProductImage(imageFile);

      // 2. Create product document
      await createProduct({
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        condition,
        neighborhood,
        customNeighborhood: neighborhood === "Otro" ? customNeighborhood.trim() : "",
        sellerId: user.uid,
        sellerName: `${user.name} ${user.lastName}`.trim(),
        sellerPhone: user.phone
      });

      // 3. Clear form
      setTitle("");
      setDescription("");
      setCondition("buen");
      setNeighborhood("Flores");
      setCustomNeighborhood("");
      setImageFile(null);
      setImageSrc(null);
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

  // Page level registration handler (saves profile directly as verified)
  const handlePageDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) return setRegError("Ingresá tu nombre.");
    if (!regLastName.trim()) return setRegError("Ingresá tu apellido.");
    if (!/^\d{10}$/.test(regPhone)) {
      return setRegError("El número debe tener 10 dígitos (Ej: 1134567890).");
    }

    const fullPhone = `+549${regPhone}`;
    setRegLoading(true);
    try {
      await completeRegistrationDetails(regName.trim(), regLastName.trim(), fullPhone);
    } catch (err: any) {
      setRegError(err.message || "Error de registro.");
    } finally {
      setRegLoading(false);
    }
  };

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
      {/* Tab Header Controls */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t border-t border-x border-ml-border overflow-hidden">
        <button
          onClick={() => setActiveTab("publicar")}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all focus:outline-none ${
            activeTab === "publicar" 
              ? "border-ml-blue text-ml-blue bg-white" 
              : "border-transparent text-gray-500 hover:text-ml-dark hover:bg-gray-50/50"
          }`}
        >
          <PlusCircle size={18} />
          <span>Publicar un producto</span>
        </button>
        
        <button
          onClick={() => setActiveTab("mis-publicaciones")}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition-all focus:outline-none ${
            activeTab === "mis-publicaciones" 
              ? "border-ml-blue text-ml-blue bg-white" 
              : "border-transparent text-gray-500 hover:text-ml-dark hover:bg-gray-50/50"
          }`}
        >
          <FolderHeart size={18} />
          <span>Mis Publicaciones</span>
        </button>
      </div>

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
              Detalles del producto a donar
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
                  <span>Recomendación: Describe tu producto detalladamente para evitar que se contacten con usted sin motivo.</span>
                </p>
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

              {/* Image Picker */}
              <div>
                <label className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-1.5">
                  Foto del producto
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-ml-blue rounded-lg p-5 text-center cursor-pointer transition bg-gray-50 hover:bg-blue-50/20 flex flex-col items-center justify-center gap-1.5"
                >
                  <ImageIcon className="text-gray-400" size={32} />
                  <span className="text-xs font-bold text-ml-dark">Hacé click para subir una imagen</span>
                  <span className="text-[10px] text-gray-400">Archivos permitidos: JPG, PNG, WEBP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {imageFile && (
                  <div className="mt-2.5 bg-blue-50/50 border border-blue-100 rounded px-3 py-1.5 flex items-center justify-between text-xs text-ml-dark">
                    <span className="truncate font-semibold">{imageFile.name}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImageSrc(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-red-500 font-bold hover:underline"
                    >
                      Quitar
                    </button>
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
              imageSrc={imageSrc}
            />
          </div>
        </div>
      )}

      {/* TAB 2: MY PUBLICATIONS LIST */}
      {activeTab === "mis-publicaciones" && (
        <div className="bg-white border border-ml-border rounded-lg shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-ml-dark p-6 border-b border-gray-150">
            Administrar mis donaciones
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
                const isPast48 = ageHours > 48;
                const isDeactivated = !prod.isActive || isPast48;
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
                        
                        <div className="flex items-center gap-2 mt-2">
                          {isDeactivated ? (
                            <span className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-150 uppercase tracking-wide">
                              {isPast48 ? "Expirado (48 hs)" : "Deactivado (3 contactos)"}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-green-50 text-ml-green px-2 py-0.5 rounded border border-green-150 uppercase tracking-wide">
                              Activo
                            </span>
                          )}
                          
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                            {prod.contactCount} / 3 contactos
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

                      {isDeactivated && (
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
