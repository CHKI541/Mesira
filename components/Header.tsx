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
        <Link href="/" className="flex items-center gap-1.5 focus:outline-none">
          <span className="text-2xl font-black italic tracking-tighter text-ml-blue select-none">
            Mesira
          </span>
          <span className="bg-ml-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Argentina
          </span>
        </Link>
        
        {/* Mobile User/Action Indicators */}
        <div className="flex items-center gap-3 md:hidden">
          {user && (
            <Link href="/mi-cuenta" className="p-1 text-ml-dark hover:text-ml-blue transition">
              <PlusCircle size={22} />
            </Link>
          )}
          <Link href="/ayuda" className="p-1 text-ml-dark hover:text-ml-blue transition">
            <HelpCircle size={22} />
          </Link>
        </div>
      </div>

      {/* Center: Search Bar */}
      <form 
        onSubmit={handleSearchSubmit} 
        className="flex-1 max-w-2xl w-full flex items-center bg-white rounded shadow-sm border border-transparent focus-within:border-ml-blue transition-all"
      >
        <input
          type="text"
          placeholder="Buscar productos gratis, ropa, muebles..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="flex-1 px-3 py-2 text-sm text-ml-dark placeholder-gray-400 focus:outline-none bg-transparent rounded-l"
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-2 text-gray-400 hover:text-ml-dark text-xs transition"
          >
            Limpiar
          </button>
        )}
        <button 
          type="submit" 
          className="px-4 py-2 border-l border-gray-100 text-gray-500 hover:text-ml-blue transition focus:outline-none"
          aria-label="Buscar"
        >
          <Search size={18} />
        </button>
      </form>

      {/* Right: Navigation / Auth Controls */}
      <div className="hidden md:flex items-center gap-6 text-sm font-normal text-ml-dark">
        <Link href="/ayuda" className="flex items-center gap-1 hover:text-ml-blue transition">
          <HelpCircle size={16} />
          <span>Ayuda</span>
        </Link>

        {loading ? (
          <div className="h-5 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : user ? (
          <div className="flex items-center gap-4">
            <Link 
              href="/mi-cuenta" 
              className="flex items-center gap-1.5 font-medium hover:text-ml-blue transition"
            >
              <User size={16} />
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
              className="bg-ml-blue hover:bg-ml-blue-hover text-white px-3 py-1.5 rounded font-medium text-xs transition shadow-sm"
            >
              Publicar Gratis
            </Link>
            
            <button 
              onClick={logOut} 
              className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition focus:outline-none"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuthModal}
            className="font-medium text-ml-dark hover:text-ml-blue transition focus:outline-none"
          >
            Ingresá / Registrate
          </button>
        )}
      </div>
    </div>
  );
};

// Fallback skeleton while Suspense is loading
const HeaderFallback: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        <span className="text-2xl font-black italic tracking-tighter text-ml-blue select-none">
          Mesira
        </span>
        <span className="bg-ml-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          Argentina
        </span>
      </div>
      <div className="flex-1 max-w-2xl h-9 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-5 w-24 bg-gray-250 rounded animate-pulse"></div>
    </div>
  );
};

// Exported Suspense-wrapped Header
export const Header: React.FC<HeaderProps> = (props) => {
  const { user } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 w-full bg-ml-yellow border-b border-ml-border py-2 px-4 shadow-sm">
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
