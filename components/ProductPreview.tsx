"use client";

import React from "react";
import { MapPin, Clock } from "lucide-react";

interface ProductPreviewProps {
  title: string;
  condition: "perfecto" | "buen" | "funcional" | "reparar";
  neighborhood: string;
  customNeighborhood?: string;
  imageSrc: string | null;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({
  title,
  condition,
  neighborhood,
  customNeighborhood,
  imageSrc,
}) => {
  const getConditionStyle = (cond: typeof condition) => {
    switch (cond) {
      case "perfecto":
        return { text: "Excelente", bg: "bg-green-50 text-green-700 border-green-200" };
      case "buen":
        return { text: "Buen estado", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "funcional":
        return { text: "Funcional", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "reparar":
        return { text: "A reparar", bg: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { text: "Usado", bg: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  const conditionStyle = getConditionStyle(condition);
  const neighborhoodLabel = neighborhood === "Otro" ? customNeighborhood || "Otro barrio" : neighborhood || "Seleccionar barrio";
  
  // Format current time for live preview hour
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const publishedHour = `${hours}:${minutes} hs`;

  return (
    <div className="w-full max-w-[240px] mx-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden select-none pointer-events-none">
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border-b border-gray-100 flex items-center justify-center">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt="Vista previa" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-4 text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-1 block text-xs font-semibold text-gray-400">Sin imagen</span>
          </div>
        )}
        
        {/* Condition Badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${conditionStyle.bg} shadow-sm uppercase tracking-wider`}>
          {conditionStyle.text}
        </span>
      </div>

      {/* Preview Content Details */}
      <div className="p-3.5 flex flex-col justify-between min-h-[120px]">
        <div>
          <h3 className="text-sm font-semibold text-ml-dark line-clamp-2 leading-tight">
            {title || "Título de tu publicación"}
          </h3>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{neighborhoodLabel}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock size={13} className="text-gray-300 shrink-0" />
            <span>Publicado {publishedHour}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
