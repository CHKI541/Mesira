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
  Loader2,
  ChevronDown,
  ChevronUp,
  Shirt,
  Sofa,
  Tv,
  ShoppingBag,
  Wrench,
  Pill,
  Car,
  Baby,
  Gamepad2,
  BookOpen,
  Flame
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  ropa: Shirt,
  muebles: Sofa,
  electronica: Tv,
  bazar: ShoppingBag,
  herramientas: Wrench,
  farmacia: Pill,
  "accesorios para vehiculos": Car,
  bebes: Baby,
  juguetes: Gamepad2,
  libros: BookOpen,
  "kodesh y judaica": Flame,
  otro: Sparkles
};


// Inner Home component containing search and filter logic
function HomeContent() {
  const { user, isOnboardingCompleted, setIsOnboardingCompleted } = useAuth();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionOnboardingClosed, setSessionOnboardingClosed] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Accordion open states (closed by default)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isNeighborhoodsOpen, setIsNeighborhoodsOpen] = useState(false);
  const [isConditionsOpen, setIsConditionsOpen] = useState(false);

  // Parse active filters from URL
  const searchQuery = searchParams.get("q") || "";
  const activeCategories = searchParams.get("categorias") ? searchParams.get("categorias")!.split(",") : [];
  const activeNeighborhoods = searchParams.get("barrios") ? searchParams.get("barrios")!.split(",") : [];
  const activeConditions = searchParams.get("estados") ? searchParams.get("estados")!.split(",") : [];

  const isFiltering = searchQuery.trim() !== "" || activeCategories.length > 0 || activeNeighborhoods.length > 0 || activeConditions.length > 0;

  // Temporary local states for filter selection (applied on button click)
  const [tempCategories, setTempCategories] = useState<string[]>([]);
  const [tempNeighborhoods, setTempNeighborhoods] = useState<string[]>([]);
  const [tempConditions, setTempConditions] = useState<string[]>([]);

  // Sync temporary state with URL search params whenever they change
  useEffect(() => {
    setTempCategories(activeCategories);
    setTempNeighborhoods(activeNeighborhoods);
    setTempConditions(activeConditions);
  }, [searchParams]);

  // Load products based on query & filters
  useEffect(() => {
    async function fetchFeed() {
      setLoadingProducts(true);
      setError(null);
      try {
        const data = await getProducts({
          searchQuery,
          categories: activeCategories.length > 0 ? activeCategories : undefined,
          neighborhoods: activeNeighborhoods.length > 0 ? activeNeighborhoods : undefined,
          conditions: activeConditions.length > 0 ? activeConditions : undefined
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
  }, [searchQuery, searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (tempCategories.length > 0) {
      params.set("categorias", tempCategories.join(","));
    } else {
      params.delete("categorias");
    }

    if (tempNeighborhoods.length > 0) {
      params.set("barrios", tempNeighborhoods.join(","));
    } else {
      params.delete("barrios");
    }

    if (tempConditions.length > 0) {
      params.set("estados", tempConditions.join(","));
    } else {
      params.delete("estados");
    }

    router.push(`/?${params.toString()}`);
  };

  const handleRemoveCategory = (cat: string) => {
    const nextCats = activeCategories.filter(c => c !== cat);
    const params = new URLSearchParams(searchParams.toString());
    if (nextCats.length > 0) {
      params.set("categorias", nextCats.join(","));
    } else {
      params.delete("categorias");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleRemoveNeighborhood = (barrio: string) => {
    const nextBarrios = activeNeighborhoods.filter(b => b !== barrio);
    const params = new URLSearchParams(searchParams.toString());
    if (nextBarrios.length > 0) {
      params.set("barrios", nextBarrios.join(","));
    } else {
      params.delete("barrios");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleRemoveCondition = (cond: string) => {
    const nextConds = activeConditions.filter(c => c !== cond);
    const params = new URLSearchParams(searchParams.toString());
    if (nextConds.length > 0) {
      params.set("estados", nextConds.join(","));
    } else {
      params.delete("estados");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleClearAllFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
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
        const day = itemDate.getDate();
        const month = itemDate.toLocaleDateString("es-AR", { month: "long" });
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

  const AVAILABLE_NEIGHBORHOODS = ["Flores", "Once", "Barracas", "Belgrano", "Palermo", "Villa Crespo", "Otro"];

  const AVAILABLE_CONDITIONS = [
    { value: "perfecto", label: "Perfecto estado" },
    { value: "buen", label: "Buen estado" },
    { value: "funcional", label: "Estado funcional" },
    { value: "reparar", label: "Mal estado / A reparar" }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-56 shrink-0 flex flex-col gap-3">
        {/* Mobile Filter Toggle Button */}
        <button 
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden w-full flex items-center justify-center gap-2 bg-white border border-ml-border rounded-lg py-2.5 px-4 text-xs font-bold text-ml-dark shadow-sm hover:bg-gray-50 transition cursor-pointer"
        >
          <SlidersHorizontal size={14} className="text-gray-500" />
          <span>{showMobileFilters ? "Ocultar filtros" : "Mostrar filtros"}</span>
          {(activeCategories.length > 0 || activeNeighborhoods.length > 0 || activeConditions.length > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 ml-1"></span>
          )}
        </button>

        {/* Collapsible Filters container (hidden on mobile by default, always visible on desktop) */}
        <div className={`${showMobileFilters ? "flex" : "hidden"} md:flex flex-col gap-4 w-full`}>
          {/* Active Search & Filters Info */}
          {(searchQuery || activeCategories.length > 0 || activeNeighborhoods.length > 0 || activeConditions.length > 0) && (
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
                <span className="inline-flex items-center gap-1 bg-gray-150 text-ml-dark text-[10px] font-semibold px-2 py-1 rounded border border-gray-200 max-w-full">
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
              {activeCategories.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1 bg-gray-100 text-ml-dark text-[10px] font-semibold px-2 py-1 rounded border border-gray-200">
                  <span>{AVAILABLE_CATEGORIES.find(c => c.value === cat)?.label || cat}</span>
                  <button onClick={() => handleRemoveCategory(cat)}>
                    <X size={10} className="text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              ))}
              {activeNeighborhoods.map((barrio) => (
                <span key={barrio} className="inline-flex items-center gap-1 bg-gray-100 text-ml-dark text-[10px] font-semibold px-2 py-1 rounded border border-gray-200">
                  <span>{barrio === "Otro" ? "Otros barrios" : barrio}</span>
                  <button onClick={() => handleRemoveNeighborhood(barrio)}>
                    <X size={10} className="text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              ))}
              {activeConditions.map((cond) => (
                <span key={cond} className="inline-flex items-center gap-1 bg-gray-100 text-ml-dark text-[10px] font-semibold px-2 py-1 rounded border border-gray-200">
                  <span>{AVAILABLE_CONDITIONS.find(c => c.value === cond)?.label || cond}</span>
                  <button onClick={() => handleRemoveCondition(cond)}>
                    <X size={10} className="text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filtering Card */}
        <div className="bg-white border border-ml-border rounded shadow-sm overflow-hidden divide-y divide-gray-100">
          <div className="p-4 flex items-center gap-2 text-ml-dark bg-gray-50/50">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Filtrar artículos</h2>
          </div>

          {/* Filter by Categories */}
          <div className="flex flex-col">
            <button 
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="w-full text-left p-4 flex items-center justify-between text-xs font-bold text-ml-dark uppercase tracking-wider hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-1.5">
                <Tag size={13} className="text-gray-400" />
                <span>Categorías</span>
                {tempCategories.length > 0 && (
                  <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 select-none">
                    {tempCategories.length}
                  </span>
                )}
              </span>
              {isCategoriesOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            
            {isCategoriesOpen && (
              <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-x-3 gap-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar animate-in slide-in-from-top duration-150">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const isChecked = tempCategories.includes(cat.value);
                  const IconComp = CATEGORY_ICONS[cat.value] || Sparkles;
                  return (
                    <label 
                      key={cat.value} 
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-ml-dark cursor-pointer select-none py-0.5"
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempCategories(prev => [...prev, cat.value]);
                          } else {
                            setTempCategories(prev => prev.filter(c => c !== cat.value));
                          }
                        }}
                        className="sr-only"
                      />
                      {isChecked ? (
                        <IconComp size={15} className="text-[#0043C6] shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 border border-gray-300 rounded shrink-0 bg-white"></span>
                      )}
                      <span className={isChecked ? "font-semibold text-[#0043C6]" : ""}>{cat.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter by Neighborhood */}
          <div className="flex flex-col">
            <button 
              onClick={() => setIsNeighborhoodsOpen(!isNeighborhoodsOpen)}
              className="w-full text-left p-4 flex items-center justify-between text-xs font-bold text-ml-dark uppercase tracking-wider hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-gray-400" />
                <span>Barrios</span>
                {tempNeighborhoods.length > 0 && (
                  <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 select-none">
                    {tempNeighborhoods.length}
                  </span>
                )}
              </span>
              {isNeighborhoodsOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            
            {isNeighborhoodsOpen && (
              <div className="px-4 pb-4 pt-1.5 flex flex-wrap gap-x-3 gap-y-2 animate-in slide-in-from-top duration-150">
                {AVAILABLE_NEIGHBORHOODS.map((barrio) => {
                  const isChecked = tempNeighborhoods.includes(barrio);
                  return (
                    <button 
                      key={barrio}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setTempNeighborhoods(prev => prev.filter(b => b !== barrio));
                        } else {
                          setTempNeighborhoods(prev => [...prev, barrio]);
                        }
                      }}
                      className={`text-xs select-none transition-colors duration-150 cursor-pointer ${
                        isChecked 
                          ? "text-[#0043C6] font-extrabold underline decoration-2 underline-offset-2" 
                          : "text-gray-500 hover:text-ml-dark font-medium"
                      }`}
                    >
                      {barrio === "Otro" ? "Otros" : barrio}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter by Condition */}
          <div className="flex flex-col">
            <button 
              onClick={() => setIsConditionsOpen(!isConditionsOpen)}
              className="w-full text-left p-4 flex items-center justify-between text-xs font-bold text-ml-dark uppercase tracking-wider hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-gray-400" />
                <span>Estado</span>
                {tempConditions.length > 0 && (
                  <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 select-none">
                    {tempConditions.length}
                  </span>
                )}
              </span>
              {isConditionsOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>
            
            {isConditionsOpen && (
              <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2 animate-in slide-in-from-top duration-150">
                {[
                  { label: "Perfecto estado", value: "perfecto" },
                  { label: "Buen estado", value: "buen" },
                  { label: "Funcional", value: "funcional" },
                  { label: "Mal estado / a reparar", value: "reparar" }
                ].map((pill) => {
                  const isChecked = tempConditions.includes(pill.value);
                  return (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setTempConditions(prev => prev.filter(c => c !== pill.value));
                        } else {
                          setTempConditions(prev => [...prev, pill.value]);
                        }
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all duration-150 border cursor-pointer ${
                        isChecked
                          ? "bg-[#0043C6] border-[#0043C6] text-white shadow-sm"
                          : "bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apply Filters Button */}
          <div className="p-3 bg-gray-50/40">
            <button 
              onClick={handleApplyFilters}
              className="w-full bg-[#0043C6] hover:bg-[#0036A3] text-white text-xs font-bold py-2 px-4 rounded shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Aplicar filtros</span>
            </button>
          </div>
        </div>

          {/* Quick Info Box */}
          <div className="bg-cyan-50/50 border border-cyan-200 rounded-xl p-4 shadow-sm text-xs text-cyan-800 leading-relaxed">
            <h4 className="font-bold mb-1.5 flex items-center gap-1">
              <Sparkles size={14} className="text-cyan-600" />
              ¿Cómo funciona?
            </h4>
            <p className="mb-2">Publicá gratis artículos que no uses.</p>
            <p className="mb-2">Para evitar spam, cada producto se desactiva automáticamente al recibir el límite de contactos elegido (por defecto 3 de personas distintas).</p>
            <p>Luego, las publicaciones desactivadas desaparecerán tras 48 horas.</p>
            <Link href="/ayuda" className="font-bold text-ml-blue hover:underline mt-2.5 inline-block">
              Ver más en Ayuda →
            </Link>
          </div>
        </div>
      </aside>      {/* Products Feed Area */}
      <section className="flex-1">
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
                className="bg-[#0043C6] hover:bg-[#0036A3] text-white px-5 py-2.5 rounded font-bold text-xs shadow-sm transition cursor-pointer"
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
            {groupedKeys.map((dayLabel) => {
              const dayProducts = groupedProducts[dayLabel];
              return (
                <div key={dayLabel} className="animate-in fade-in duration-300">
                  <h2 className="text-lg font-black text-ml-dark mb-4 border-b border-gray-200/60 pb-1 flex items-baseline gap-2">
                    {dayLabel}
                    <span className="text-xs font-normal text-gray-400">
                      ({dayProducts.length} {dayProducts.length === 1 ? "producto" : "productos"})
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {dayProducts.map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
                    ))}
                  </div>
                </div>
              );
            })}
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
        isOpen={user !== null && user.isPhoneVerified && !isOnboardingCompleted && !sessionOnboardingClosed} 
        onClose={(dontShowAgain) => {
          if (dontShowAgain) {
            setIsOnboardingCompleted(true);
          } else {
            setSessionOnboardingClosed(true);
          }
        }}
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
      <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <Header onOpenAuthModal={() => setIsAuthOpen(true)} />

      {/* Delicate Support Message */}
      <div className="bg-white/60 backdrop-blur-[2px] border-b border-[#e2f1f3] py-2.5 text-center text-[11px] text-[#0e2a30]/80 z-20 relative">
        Para cualquier error o sugerencia comunicarse con{" "}
        <a 
          href="mailto:soporte@mesira.net" 
          className="text-[#0891b2] hover:text-[#0e7490] font-bold hover:underline transition-colors"
        >
          soporte@mesira.net
        </a>
      </div>
      
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
