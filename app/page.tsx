"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProducts, Product } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ProductCard } from "@/components/ProductCard";
import { 
  SlidersHorizontal, 
  MapPin, 
  Tag, 
  Sparkles, 
  AlertCircle, 
  Search, 
  X,
  PlusCircle,
  HelpCircle,
  Loader2
} from "lucide-react";

// Inner Home component containing search and filter logic
function HomeContent() {
  const { user, isOnboardingCompleted, setIsOnboardingCompleted } = useAuth();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active filters in local state (synced with URL for search)
  const searchQuery = searchParams.get("q") || "";
  const filterNeighborhood = searchParams.get("barrio") || "Todos";
  const filterCondition = searchParams.get("estado") || "Todos";

  // Load products based on query & filters
  useEffect(() => {
    async function fetchFeed() {
      setLoadingProducts(true);
      setError(null);
      try {
        const data = await getProducts({
          searchQuery,
          neighborhood: filterNeighborhood !== "Todos" ? filterNeighborhood : undefined,
          condition: filterCondition !== "Todos" ? filterCondition : undefined
        });
        setProducts(data);
      } catch (err) {
        console.error("Error loading feed:", err);
        setError("Ocurrió un error al cargar las publicaciones.");
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchFeed();
  }, [searchQuery, filterNeighborhood, filterCondition]);

  // Handle setting filters
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "Todos") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const handleClearAllFilters = () => {
    router.push("/");
  };

  // Group products by day (Google Photos style)
  const groupProductsByDate = (items: Product[]) => {
    const groups: { [label: string]: Product[] } = {};
    const today = new Date().toDateString();
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    items.forEach((item) => {
      const itemDate = typeof item.createdAt === "number" ? new Date(item.createdAt) : item.createdAt;
      if (!(itemDate instanceof Date) || isNaN(itemDate.getTime())) return;

      const dateStr = itemDate.toDateString();
      let label = "";

      if (dateStr === today) {
        label = "Hoy";
      } else if (dateStr === yesterday) {
        label = "Ayer";
      } else {
        // Format as e.g. "8 de Junio"
        const day = itemDate.getDate();
        const month = itemDate.toLocaleDateString("es-AR", { month: "long" });
        // Capitalize month name
        const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
        label = `${day} de ${capitalizedMonth}`;
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });

    return groups;
  };

  const groupedProducts = groupProductsByDate(products);
  const groupedKeys = Object.keys(groupedProducts);

  const neighborhoods = ["Todos", "Flores", "Once", "Barracas", "Belgrano", "Palermo", "Villa Crespo", "Otro"];
  const conditions = [
    { value: "Todos", label: "Todos los estados" },
    { value: "perfecto", label: "Perfecto estado" },
    { value: "buen", label: "Buen estado" },
    { value: "funcional", label: "Estado funcional" },
    { value: "reparar", label: "Mal estado / A reparar" }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-56 shrink-0 flex flex-col gap-4">
        
        {/* Active Search & Filters Info */}
        {(searchQuery || filterNeighborhood !== "Todos" || filterCondition !== "Todos") && (
          <div className="bg-white border border-ml-border rounded p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold text-ml-dark uppercase tracking-wider">Filtros activos</h3>
              <button 
                onClick={handleClearAllFilters}
                className="text-[10px] text-ml-blue hover:text-ml-blue-hover font-bold uppercase transition"
              >
                Limpiar todos
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-ml-dark text-[10px] font-semibold px-2 py-1 rounded border border-gray-200 max-w-full">
                  <span className="truncate">"{searchQuery}"</span>
                  <button onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("q");
                    router.push(`/?${params.toString()}`);
                  }}>
                    <X size={10} className="text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              )}
              {filterNeighborhood !== "Todos" && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-ml-dark text-[10px] font-semibold px-2 py-1 rounded border border-gray-200">
                  <span>{filterNeighborhood}</span>
                  <button onClick={() => updateFilters("barrio", "Todos")}>
                    <X size={10} className="text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              )}
              {filterCondition !== "Todos" && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-ml-dark text-[10px] font-semibold px-2 py-1 rounded border border-gray-200">
                  <span>{conditions.find(c => c.value === filterCondition)?.label}</span>
                  <button onClick={() => updateFilters("estado", "Todos")}>
                    <X size={10} className="text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filtering Card */}
        <div className="bg-white border border-ml-border rounded shadow-sm overflow-hidden divide-y divide-gray-100">
          <div className="p-4 flex items-center gap-2 text-ml-dark">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Filtrar por</h2>
          </div>

          {/* Filter by Neighborhood */}
          <div className="p-4">
            <span className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <MapPin size={13} className="text-gray-400" />
              <span>Barrio</span>
            </span>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {neighborhoods.map((barrio) => (
                <button
                  key={barrio}
                  onClick={() => updateFilters("barrio", barrio)}
                  className={`text-left text-xs py-0.5 hover:text-ml-blue hover:underline transition-all ${
                    filterNeighborhood === barrio 
                      ? "text-ml-blue font-bold" 
                      : "text-gray-500 font-normal"
                  }`}
                >
                  {barrio === "Todos" ? "Todos los barrios" : barrio === "Otro" ? "Otros barrios" : barrio}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Condition */}
          <div className="p-4">
            <span className="block text-xs font-bold text-ml-dark uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Tag size={13} className="text-gray-400" />
              <span>Estado</span>
            </span>
            <div className="flex flex-col gap-1.5">
              {conditions.map((cond) => (
                <button
                  key={cond.value}
                  onClick={() => updateFilters("estado", cond.value)}
                  className={`text-left text-xs py-0.5 hover:text-ml-blue hover:underline transition-all ${
                    filterCondition === cond.value 
                      ? "text-ml-blue font-bold" 
                      : "text-gray-500 font-normal"
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Info Box */}
        <div className="bg-blue-50/50 border border-blue-150 rounded p-4 shadow-sm text-xs text-blue-800 leading-relaxed">
          <h4 className="font-bold mb-1.5 flex items-center gap-1">
            <Sparkles size={14} className="text-blue-600" />
            ¿Cómo funciona?
          </h4>
          <p className="mb-2">Publicá gratis artículos que no uses.</p>
          <p className="mb-2">Para evitar spam, cada producto se desactiva automáticamente al recibir el límite de contactos elegido (por defecto 3 de personas distintas).</p>
          <p>Las publicaciones expiran a las <strong>48 horas</strong> para mantener el feed activo.</p>
          <Link href="/ayuda" className="font-bold text-ml-blue hover:underline mt-2.5 inline-block">
            Ver más en Ayuda →
          </Link>
        </div>
      </aside>

      {/* Products Feed Area */}
      <section className="flex-1">
        {/* Welcome Hero Banner */}
        <div className="mb-6 relative overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-500/8 via-purple-500/5 to-pink-500/8 p-6 shadow-sm">
          {/* Decorative glowing gradient shapes behind */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1 bg-indigo-50 text-ml-blue text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider mb-2.5">
              <Sparkles size={11} className="animate-pulse" />
              <span>Regalos gratis en Argentina</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
              Dale una segunda vida a lo que ya no usás
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-lg">
              Publicá de forma simple, segura y 100% gratuita. Las publicaciones desaparecen automáticamente del feed público al recibir suficientes contactos de personas distintas para evitar molestias.
            </p>
            
            <div className="flex flex-wrap gap-2 mt-4 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                🛡️ Cero Spam
              </span>
              <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                💬 Contacto directo por WhatsApp
              </span>
              <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                🤝 100% Gratis e ilimitado
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded mb-5 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loadingProducts ? (
          <div className="space-y-8">
            <div>
              <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-ml-border p-3 space-y-3">
                    <div className="aspect-square bg-gray-150 animate-pulse rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg border border-ml-border p-10 text-center shadow-sm max-w-xl mx-auto mt-6">
            <Search className="mx-auto text-gray-300 mb-3" size={48} />
            <h2 className="text-lg font-bold text-ml-dark mb-1">No hay publicaciones que coincidan</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Prueba buscando con otros términos o removiendo los filtros de barrio y estado del panel izquierdo.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={handleClearAllFilters}
                className="bg-ml-blue hover:bg-ml-blue-hover text-white px-5 py-2.5 rounded font-bold text-xs shadow-sm transition"
              >
                Ver todas las publicaciones
              </button>
              {user?.isPhoneVerified && (
                <Link
                  href="/mi-cuenta?tab=publicar"
                  className="border border-gray-300 hover:border-ml-blue hover:text-ml-blue text-gray-600 px-5 py-2.5 rounded font-bold text-xs bg-white transition"
                >
                  Publicar un producto gratis
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedKeys.map((dayLabel) => (
              <div key={dayLabel} className="animate-in fade-in duration-300">
                <h2 className="text-lg font-black text-ml-dark mb-4 border-b border-gray-200/60 pb-1 flex items-baseline gap-2">
                  {dayLabel}
                  <span className="text-xs font-normal text-gray-400">
                    ({groupedProducts[dayLabel].length} {groupedProducts[dayLabel].length === 1 ? "producto" : "productos"})
                  </span>
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedProducts[dayLabel].map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Auth Modal Trigger */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsOnboardingCompleted(true)}
      />

      {/* Welcome / Onboarding Rules Modal */}
      <OnboardingModal 
        isOpen={user !== null && user.isPhoneVerified && !isOnboardingCompleted} 
        onClose={() => setIsOnboardingCompleted(true)}
      />
    </div>
  );
}

// Fallback spinner during hydration
function HomeFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12">
      <Loader2 className="animate-spin text-ml-blue mb-2.5" size={32} />
      <p className="text-xs text-gray-400">Cargando Mesira Argentina...</p>
    </div>
  );
}

// Main Suspense-wrapped Page Component
export default function HomePage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ml-bg flex flex-col pb-16 relative overflow-hidden">
      {/* Decorative ambient background blur blobs */}
      <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <Header onOpenAuthModal={() => setIsAuthOpen(true)} />
      
      <main className="max-w-6xl mx-auto px-4 w-full mt-5 flex-1 flex flex-col md:flex-row gap-5 relative z-10">
        <Suspense fallback={<HomeFallback />}>
          <HomeContent />
        </Suspense>
      </main>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </div>
  );
}
