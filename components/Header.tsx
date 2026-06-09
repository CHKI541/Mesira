"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Search, User, LogOut, HelpCircle, PlusCircle, AlertCircle } from "lucide-react";

interface HeaderProps {
  onOpenAuthModal?: () => void;
}

// Inner Header content that uses useSearchParams
const HeaderContent: React.FC<HeaderProps> = ({ onOpenAuthModal }) => {
  const { user, logOut, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [localQuery, setLocalQuery] = useState("");

  // Sync input value with URL search params
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setLocalQuery(q);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (localQuery.trim()) {
      params.set("q", localQuery.trim());
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setLocalQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
      {/* Left: Logo */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none group">
          {/* Logo Icon */}
          <div className="flex items-center">
            <svg 
              viewBox="0 0 100 80" 
              className="w-14 h-11 transition-transform duration-300 group-hover:scale-[1.02]"
            >
              {/* Teal diagonal loop */}
              <path 
                d="M22 25 L45 55 L70 25 L85 45" 
                stroke="#00A3A3" 
                strokeWidth="7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
              {/* Blue overlapping loop */}
              <path 
                d="M15 50 L15 25 L45 55 L75 25 L88 12" 
                stroke="#002366" 
                strokeWidth="7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
              {/* Arrow Head */}
              <path 
                d="M72 12 L88 12 L88 28" 
                stroke="#002366" 
                strokeWidth="7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
            </svg>
          </div>
          
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-[#002366] leading-none select-none">
              Mesira
            </span>
            <span className="text-xs font-bold text-[#002366] tracking-wider leading-none mt-1 select-none">
              Argentina
            </span>
          </div>
        </Link>
        
        {/* Mobile User/Action Indicators */}
        <div className="flex items-center gap-2.5 md:hidden">
          {user ? (
            <>
              <Link href="/mi-cuenta?tab=publicar" className="p-1 text-ml-dark hover:text-ml-blue transition" title="Publicar gratis">
                <PlusCircle size={20} />
              </Link>
              <Link href="/mi-cuenta" className="p-1 text-ml-dark hover:text-ml-blue transition" title="Mi Cuenta">
                <User size={20} />
              </Link>
            </>
          ) : (
            <button 
              onClick={onOpenAuthModal}
              className="p-1 text-ml-dark hover:text-ml-blue transition focus:outline-none" 
              title="Ingresar / Registrarse"
            >
              <User size={20} />
            </button>
          )}
          <Link href="/ayuda" className="p-1 text-ml-dark hover:text-ml-blue transition" title="Ayuda">
            <HelpCircle size={20} />
          </Link>
        </div>
      </div>

      {/* Center: Search Bar */}
      <form 
        onSubmit={handleSearchSubmit} 
        className="flex-1 max-w-xl w-full flex items-center bg-white rounded-full border border-gray-300 px-6 py-2.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm"
      >
        <input
          type="text"
          placeholder="Buscar productos gratis..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="flex-1 text-sm text-ml-dark placeholder-gray-400 focus:outline-none bg-transparent pr-2"
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-gray-400 hover:text-ml-dark text-xs transition mr-2"
          >
            Limpiar
          </button>
        )}
        <button 
          type="submit" 
          className="text-gray-400 hover:text-blue-600 transition focus:outline-none"
          aria-label="Buscar"
        >
          <Search size={18} />
        </button>
      </form>

      {/* Right: Navigation / Auth Controls */}
      <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-ml-dark">
        <Link href="/ayuda" className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition">
          <HelpCircle size={17} className="text-gray-500" />
          <span>Ayuda</span>
        </Link>

        {loading ? (
          <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : user ? (
          <div className="flex items-center gap-5">
            <Link 
              href="/mi-cuenta" 
              className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition"
            >
              <User size={17} className="text-gray-500" />
              <span>
                {user.isPhoneVerified ? (
                  `Hola, ${user.name || "Usuario"}`
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle size={14} />
                    Completar Registro
                  </span>
                )}
              </span>
            </Link>

            <Link 
              href="/mi-cuenta?tab=publicar" 
              className="bg-[#0043C6] hover:bg-[#0036A3] text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-sm transition-all"
            >
              Publicar Gratis
            </Link>
            
            <button 
              onClick={logOut} 
              className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition focus:outline-none"
              title="Cerrar sesión"
            >
              <LogOut size={17} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition focus:outline-none"
            >
              <User size={17} className="text-gray-500" />
              <span>Ingresá / Registrate</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Fallback skeleton while Suspense is loading
const HeaderFallback: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-cyan-50 rounded-lg">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-6 h-6 text-ml-blue"
          >
            <path 
              d="M4 11C4 9.89543 4.89543 9 6 9H18C19.1046 9 20 9.89543 20 11V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V11Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinejoin="round"
            />
            <path d="M3 11H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 9V20" stroke="currentColor" strokeWidth="2" />
            <path 
              d="M12 9C12 9 9.5 6 9.5 4.5C9.5 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5C14.5 6 12 9 12 9Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinejoin="round" 
            />
            <path 
              d="M12 9C12 9 14.5 6 14.5 4.5C14.5 3.11929 13.3807 2 12 2C10.6193 2 9.5 3.11929 9.5 4.5C9.5 6 12 9 12 9Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinejoin="round" 
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-ml-dark select-none leading-none">
            Mesira
          </span>
          <span className="text-[9px] font-bold text-[#002366] uppercase tracking-widest leading-none mt-0.5">
            Argentina
          </span>
        </div>
      </div>
      <div className="flex-1 max-w-xl h-[46px] bg-gray-200 rounded-full animate-pulse"></div>
      <div className="h-5 w-24 bg-gray-250 rounded animate-pulse"></div>
    </div>
  );
};

// Exported Suspense-wrapped Header
export const Header: React.FC<HeaderProps> = (props) => {
  const { user } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 py-[18px] md:py-[26px] px-6 shadow-sm">
      <Suspense fallback={<HeaderFallback />}>
        <HeaderContent {...props} />
      </Suspense>
      
      {/* Phone status alert (does not use searchParams, stays in parent wrapper) */}
      {user && !user.isPhoneVerified && (
        <div className="max-w-6xl mx-auto mt-2 bg-red-50 text-red-700 text-xs px-2.5 py-1.5 rounded flex items-center justify-between md:hidden">
          <span className="flex items-center gap-1">
            <AlertCircle size={14} />
            Tenés que verificar tu celular para poder publicar.
          </span>
          <Link href="/mi-cuenta" className="underline font-bold">
            Verificar ahora
          </Link>
        </div>
      )}
    </header>
  );
};
