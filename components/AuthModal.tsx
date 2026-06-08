"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, ShieldCheck, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { 
    user, 
    signInWithGoogle, 
    completeRegistrationDetails
  } = useAuth();

  // Onboarding steps: 'login' | 'details' | 'success'
  const [step, setStep] = useState<'login' | 'details' | 'success'>('login');
  
  // Registration details form states
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState(""); // 10 digits, e.g. 1134567890
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Transition between steps depending on auth status
  useEffect(() => {
    if (!isOpen) return;

    if (!user) {
      setStep('login');
    } else if (!user.name || !user.lastName || !user.phone) {
      setStep('details');
    } else {
      setStep('success');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError("Ocurrió un error al iniciar sesión con Google. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Por favor, ingresá tu nombre.");
    if (!lastName.trim()) return setError("Por favor, ingresá tu apellido.");
    if (!/^\d{10}$/.test(phoneDigits)) {
      return setError("El número de celular debe tener exactamente 10 dígitos (característica sin 0 + número sin 15).");
    }

    const fullPhoneNumber = `+549${phoneDigits}`;
    setLoading(true);

    try {
      // Save data to backend directly (which marks isPhoneVerified as true)
      await completeRegistrationDetails(name.trim(), lastName.trim(), fullPhoneNumber);
      
      setStep('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al registrar tus datos. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header yellow border */}
        <div className="h-1.5 bg-ml-yellow w-full"></div>

        {/* Close Button */}
        {step !== 'success' && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-ml-dark transition focus:outline-none"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        )}

        <div className="p-6 md:p-8">
          {/* STEP 1: Login / Sign In */}
          {step === 'login' && (
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-yellow-50 text-ml-blue mb-4">
                <Sparkles size={32} />
              </div>
              <h2 className="text-2xl font-bold text-ml-dark mb-2">Bienvenido a Mesira</h2>
              <p className="text-sm text-gray-500 mb-6">
                Regístrate o inicia sesión para publicar productos gratuitos y ver los teléfonos de contacto.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2 text-left">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:border-gray-400 hover:shadow-sm text-ml-dark font-medium py-3 px-4 rounded transition-all focus:outline-none disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin text-gray-400" size={20} />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span>Continuar con Google</span>
              </button>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Al continuar, aceptas las reglas de Mesira Argentina: publicaciones automáticas gratis por 48 horas o hasta un máximo de 3 contactos para evitar el spam.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Profile Details Onboarding */}
          {step === 'details' && (
            <div>
              <h2 className="text-xl font-bold text-ml-dark mb-1">Completar tus datos</h2>
              <p className="text-xs text-gray-500 mb-5">
                Por seguridad de la comunidad, necesitamos asociar tu cuenta a un número de contacto de Argentina.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                      value={phoneDigits}
                      onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-ml-dark focus:outline-none focus:border-ml-blue"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">
                    Ingresá el código de área (sin el 0) y el número (sin el 15). Debe tener exactamente 10 dígitos.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ml-blue hover:bg-ml-blue-hover text-white font-medium py-3 rounded transition-all focus:outline-none disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  <span>Guardar y continuar</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="inline-flex p-3 rounded-full bg-green-50 text-ml-green mb-4">
                <ShieldCheck size={48} />
              </div>
              <h2 className="text-2xl font-bold text-ml-dark mb-2">¡Cuenta Registrada!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Tu perfil fue creado con éxito y tu teléfono argentino está registrado. Ya podés disfrutar de Mesira Argentina.
              </p>

              <button
                onClick={onClose}
                className="w-full bg-ml-blue hover:bg-ml-blue-hover text-white font-medium py-3 rounded transition-all focus:outline-none"
              >
                Comenzar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
