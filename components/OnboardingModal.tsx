"use client";

import React, { useState } from "react";
import { Sparkles, Shield, Clock, Eye, Trash2, ArrowRight } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-lg shadow-xl overflow-y-auto animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header decoration */}
        <div className="bg-ml-yellow px-6 py-6 text-ml-dark relative">
          <div className="inline-flex p-2 bg-white/40 rounded-lg text-ml-blue mb-2.5">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-bold">¡Bienvenido a Mesira Argentina!</h2>
          <p className="text-xs text-gray-700 mt-1">
            Tu cuenta está activa. Conocé las reglas básicas para empezar:
          </p>
        </div>

        {/* Rules Grid */}
        <div className="p-6 md:p-8 space-y-5">
          
          {/* Rule 1 */}
          <div className="flex gap-4">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-cyan-50 text-ml-blue">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Límite anti-spam (configurable)</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Podés elegir que te contacten hasta un máximo de 10 personas distintas. Al alcanzar este límite, tu publicación se <strong>desactivará automáticamente</strong> del feed público para evitar llamadas molestas una vez que ya regalaste el producto.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="flex gap-4">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Baja definitiva de desactivados</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Los productos desactivados (por límite de contactos o desactivación manual) siguen viéndose en el feed como "Desactivados" durante <strong>48 horas</strong> antes de ser eliminados por completo de la página.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="flex gap-4">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-ml-green">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Control total en "Mi Cuenta"</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Tus productos desactivados seguirán guardados en tu panel. Desde allí podés elegir <strong>"Volver a activar"</strong> (lo que reinicia el contador de contactos y la fecha a cero) o <strong>"Eliminar"</strong> de forma permanente.
              </p>
            </div>
          </div>

          {/* Action footer with checkbox */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500/20 w-4 h-4 cursor-pointer"
              />
              <span>No volver a mostrar este mensaje</span>
            </label>

            <button
              onClick={() => onClose(dontShowAgain)}
              className="bg-ml-blue hover:bg-ml-blue-hover text-white px-5 py-2.5 rounded font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm focus:outline-none shrink-0 cursor-pointer w-full sm:w-auto"
            >
              <span>Entendido, ¡empezar!</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

