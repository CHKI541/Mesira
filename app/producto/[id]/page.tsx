"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getProductById, updateProductContact, incrementProductViews, Product } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Tag, 
  Phone, 
  AlertCircle, 
  Check, 
  ExternalLink,
  MessageSquare,
  ShieldCheck
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const { user, isOnboardingCompleted, setIsOnboardingCompleted } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasContacted, setHasContacted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load product details
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      try {
        // Increment views count in DB
        await incrementProductViews(productId);
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err) {
        console.error("Error loading product:", err);
        setError("No se pudo cargar el producto.");
      } finally {
        setLoadingProduct(false);
      }
    }
    loadProduct();
  }, [productId]);

  // Check if user has already revealed contact info in this session
  useEffect(() => {
    if (typeof window !== "undefined" && productId) {
      const alreadyContacted = sessionStorage.getItem(`contacted_${productId}`) === "true";
      setHasContacted(alreadyContacted);
    }
  }, [productId]);

  const handleContactClick = async () => {
    setError(null);

    // 1. Force Authentication
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // 2. Force Argentine Phone Verification
    if (!user.isPhoneVerified) {
      setIsAuthModalOpen(true); // Open modal which will prompt for details/verification
      return;
    }

    // If already contacted, we just show it without incrementing again
    if (hasContacted) return;

    setContactLoading(true);
    try {
      // Increment contacts in DB
      const result = await updateProductContact(productId);
      
      // Save contact status in session storage
      sessionStorage.setItem(`contacted_${productId}`, "true");
      setHasContacted(true);

      // Refresh local product state
      if (product) {
        setProduct({
          ...product,
          contactCount: result.contactCount,
          isActive: result.isActive
        });
      }
    } catch (err) {
      console.error("Error registering contact:", err);
      setError("Error al obtener los datos de contacto.");
    } finally {
      setContactLoading(false);
    }
  };

  const getConditionText = (cond: Product["condition"] | undefined) => {
    switch (cond) {
      case "perfecto": return "Perfecto estado (Como nuevo)";
      case "buen": return "Buen estado (Poco desgaste)";
      case "funcional": return "Estado funcional (Sirve, tiene detalles de uso)";
      case "reparar": return "Mal estado / a reparar";
      default: return "Usado";
    }
  };

  // Format creation date
  const formatFullDate = (dateInput: any) => {
    try {
      const date = typeof dateInput === "number" ? new Date(dateInput) : dateInput;
      if (!(date instanceof Date) || isNaN(date.getTime())) return "Desconocida";
      
      return date.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      }) + " hs";
    } catch (e) {
      return "";
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-ml-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-ml-blue border-t-transparent"></div>
          <p className="text-sm text-gray-500 mt-3">Cargando publicación...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ml-bg flex flex-col">
        <Header />
        <div className="max-w-2xl mx-auto px-4 w-full mt-12 text-center">
          <div className="bg-white rounded-lg border border-ml-border p-8 shadow-sm">
            <AlertCircle className="mx-auto text-red-500 mb-3" size={48} />
            <h1 className="text-xl font-bold text-ml-dark mb-2">Publicación no encontrada</h1>
            <p className="text-sm text-gray-500 mb-6">
              El producto que buscás no existe, ya fue retirado o expiró después de 48 horas.
            </p>
            <Link 
              href="/"
              className="bg-ml-blue hover:bg-ml-blue-hover text-white px-5 py-2.5 rounded font-bold text-sm transition inline-block shadow-sm"
            >
              Volver al feed principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = Date.now() - (typeof product.createdAt === "number" ? product.createdAt : new Date(product.createdAt).getTime()) > 48 * 60 * 60 * 1000;
  const isDeactivated = !product.isActive || isExpired;
  const neighborhoodLabel = product.neighborhood === "Otro" ? product.customNeighborhood : product.neighborhood;

  // Render variables for Argentine Phone Number formatting
  const formattedPhone = product.sellerPhone.startsWith("+54") 
    ? product.sellerPhone 
    : `+549${product.sellerPhone}`;

  // Direct WhatsApp link construction
  const rawPhone = formattedPhone.replace(/\+/g, "");
  const waLink = `https://wa.me/${rawPhone}?text=Hola%20${encodeURIComponent(product.sellerName)},%20te%20escribo%20desde%20Mesira%20por%20tu%20publicaci%C3%B3n%20"${encodeURIComponent(product.title)}"`;

  return (
    <div className="min-h-screen bg-ml-bg flex flex-col pb-12">
      <Header onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      <main className="max-w-5xl mx-auto px-4 w-full mt-6 flex-1">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-ml-blue hover:text-ml-blue-hover font-semibold mb-4 focus:outline-none"
        >
          <ArrowLeft size={14} />
          <span>Volver al listado</span>
        </Link>

        {/* Product Details Wrapper */}
        <div className="bg-white rounded-lg border border-ml-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* Left Column: Image (span 7) */}
          <div className="md:col-span-7 bg-gray-50 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-150 relative min-h-[320px] md:min-h-[480px]">
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="max-h-[440px] max-w-full object-contain rounded"
            />
            {isDeactivated && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-5 max-w-sm text-center shadow-md">
                  <AlertCircle className="mx-auto text-red-600 mb-2" size={32} />
                  <h3 className="font-bold text-red-800 text-sm">Publicación desactivada</h3>
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                    Este producto ya recibió el límite de contactos permitidos o superó las 48 horas de vigencia y fue retirado.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Meta details (span 5) */}
          <div className="md:col-span-5 p-6 flex flex-col justify-between">
            <div>
              {/* Published Time & Condition */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                <span>Publicado el {formatFullDate(product.createdAt)}</span>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-ml-blue">{getConditionText(product.condition)}</span>
                <span className="text-gray-300">•</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                  {product.viewsCount || 0} visitas
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl md:text-2xl font-bold text-ml-dark leading-tight mb-4">
                {product.title}
              </h1>

              {/* Price (Always Gratis) */}
              <div className="mb-6">
                <span className="text-3xl font-light text-ml-green tracking-tight flex items-baseline">
                  Gratis
                  <span className="text-xs font-bold text-ml-green uppercase ml-2 bg-green-50 px-1.5 py-0.5 rounded border border-green-150">
                    Donación
                  </span>
                </span>
              </div>

              {/* Location Card */}
              <div className="border border-ml-border rounded p-3 mb-6 flex items-start gap-2.5 bg-gray-50/50">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-ml-dark">Lugar de retiro</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{neighborhoodLabel}, Buenos Aires</p>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-ml-dark mb-2">Descripción del producto</h3>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/30 p-3 rounded border border-gray-100">
                  {product.description || "El publicador no ha provisto una descripción detallada."}
                </p>
              </div>
            </div>

            {/* Bottom Actions: Contact Button */}
            <div className="pt-4 border-t border-gray-100">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded mb-3 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Display phone if revealed */}
              {hasContacted ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded p-4 text-center">
                    <ShieldCheck className="mx-auto text-ml-green mb-1.5 animate-bounce" size={24} />
                    <span className="block text-[11px] font-semibold text-green-700 uppercase tracking-wider">
                      Contacto Revelado
                    </span>
                    <strong className="block text-xl text-ml-dark mt-1 font-mono tracking-wider selection:bg-green-100">
                      {formattedPhone}
                    </strong>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      Donante: {product.sellerName}
                    </span>
                  </div>

                  <a 
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 px-4 rounded text-sm transition shadow-sm focus:outline-none"
                  >
                    <MessageSquare size={18} />
                    <span>Enviar WhatsApp al donante</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleContactClick}
                  disabled={isDeactivated || contactLoading}
                  className="w-full bg-ml-blue hover:bg-ml-blue-hover disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 px-4 rounded text-sm transition shadow-sm focus:outline-none flex items-center justify-center gap-2"
                >
                  {contactLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Phone size={18} />
                  )}
                  <span>
                    {isDeactivated 
                      ? "Publicación inactiva" 
                      : user?.uid === product.sellerId 
                        ? "Ver mis datos de contacto" 
                        : "Contactar para retirar"}
                  </span>
                </button>
              )}
              
              {!isDeactivated && !hasContacted && (
                <p className="text-[10px] text-center text-gray-400 mt-2">
                  Quedan {3 - product.contactCount} de 3 contactos disponibles para este producto.
                </p>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Auth Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsOnboardingCompleted(true)}
      />

      <OnboardingModal 
        isOpen={user !== null && user.isPhoneVerified && !isOnboardingCompleted} 
        onClose={() => setIsOnboardingCompleted(true)}
      />
    </div>
  );
}
