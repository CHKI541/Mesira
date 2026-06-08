"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Clock, Tag } from "lucide-react";
import { Product } from "@/lib/db";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Get condition label and styles
  const getConditionStyle = (cond: Product["condition"]) => {
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

  const condition = getConditionStyle(product.condition);

  // Formatter for exact time (HH:MM)
  const formatPublishedTime = (dateInput: any) => {
    try {
      const date = typeof dateInput === "number" ? new Date(dateInput) : dateInput;
      if (!(date instanceof Date) || isNaN(date.getTime())) return "Desconocida";
      
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes} hs`;
    } catch (e) {
      return "";
    }
  };

  const publishedHour = formatPublishedTime(product.createdAt);
  const neighborhoodLabel = product.neighborhood === "Otro" ? product.customNeighborhood : product.neighborhood;

  return (
    <Link 
      href={`/producto/${product.id}`}
      className="block ml-card group focus:outline-none"
    >
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden rounded-t-[5px] border-b border-gray-100">
        {/* Product Image */}
        <img 
          src={product.imageUrl || "/placeholder-image.png"} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Condition Badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${condition.bg} shadow-sm uppercase tracking-wider`}>
          {condition.text}
        </span>
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex flex-col justify-between min-h-[120px]">
        <div>
          {/* Title */}
          <h3 className="text-sm font-semibold text-ml-dark line-clamp-2 leading-tight group-hover:text-ml-blue transition-colors">
            {product.title}
          </h3>
        </div>

        <div className="mt-3 space-y-1">
          {/* Neighborhood */}
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{neighborhoodLabel}</span>
          </div>

          {/* Published Time */}
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock size={13} className="text-gray-300 shrink-0" />
            <span>Publicado {publishedHour}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
