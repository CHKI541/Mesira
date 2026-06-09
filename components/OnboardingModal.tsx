"use client";

import React from "react";
import { Sparkles, Shield, Clock, Eye, Trash2, ArrowRight } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header decoration */}
        <div className="bg-ml-yellow px-6 py-6 text-ml-dark relative">
          <div className="inline-flex p-2 bg-white/40 rounded-lg text-ml-blue mb-2.5">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-bold">¡Bienvenido a Mesira Argentina!</h2>
          <p className="text-xs text-gray-700 mt-1">
            Tu cuenta está activa. Conocé las reglas básicas para empezar a publicar y regalar de forma segura:
          </p>
        </div>

        {/* Rules Grid */}
        <div className="p-6 md:p-8 space-y-5">
          
          {/* Rule 1 */}
          <div className="flex gap-4">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-ml-blue">
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
              <h3 className="text-sm font-bold text-ml-dark">Baja automática a las 48 horas</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Para mantener el feed con productos reales y frescos, todas las publicaciones desaparecen del feed público después de <strong>48 horas</strong> de creadas.
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

          {/* Action button */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="bg-ml-blue hover:bg-ml-blue-hover text-white px-5 py-2.5 rounded font-bold text-sm transition flex items-center gap-2 shadow-sm focus:outline-none"
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
