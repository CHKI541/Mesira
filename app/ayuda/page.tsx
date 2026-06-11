"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, 
  ShieldAlert, 
  HelpCircle, 
  FileText, 
  Clock, 
  Smartphone, 
  RotateCcw, 
  Heart, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Mail
} from "lucide-react";

export default function AyudaPage() {
  const { user, isOnboardingCompleted, setIsOnboardingCompleted } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ml-bg flex flex-col pb-12">
      <Header onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      <main className="max-w-3xl mx-auto px-4 w-full mt-6 flex-1">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-ml-blue hover:text-ml-blue-hover font-semibold mb-4 focus:outline-none"
        >
          <ArrowLeft size={14} />
          <span>Volver al inicio</span>
        </Link>

        {/* Hero title */}
        <div className="bg-white rounded-lg border border-ml-border p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-ml-blue mb-2">
            <HelpCircle size={28} />
            <h1 className="text-2xl font-black text-ml-dark">Centro de Ayuda</h1>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Mesira Argentina es una red solidaria para regalar artículos. Diseñamos este sistema para que regalar lo que no usás sea rápido y sencillo.
          </p>
        </div>

        {/* Core Mechanics Section */}
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Funcionamiento Básico</h2>
        
        <div className="bg-white rounded-lg border border-ml-border divide-y divide-gray-150 shadow-sm mb-8">
          {/* Step 1 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-cyan-50 w-8 h-8 rounded-full flex items-center justify-center">1</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Iniciás sesión y completás tus datos</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Ingresás de forma segura con tu cuenta de Google. Completás tu Nombre, Apellido y celular de Argentina. Tu cuenta se activará al instante para poder usar la plataforma.
              </p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-cyan-50 w-8 h-8 rounded-full flex items-center justify-center">2</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Publicás gratis en segundos</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Subís una foto de tu producto, ponés el nombre, seleccionás el barrio donde se retira y describís el estado del artículo: Perfecto, Buen, Funcional o A Reparar.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-cyan-50 w-8 h-8 rounded-full flex items-center justify-center">3</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Límite de contactos automático</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Las personas que busquen tu producto verán los detalles. Para contactarte, deberán presionar 'Contactar', lo que les revelará tus datos de contacto elegidos (teléfono, email, etc.). Cuando se alcance el límite de contactos que elegiste al publicar (por defecto 3 de personas distintas), tu publicación se desactivará inmediatamente para no molestarte con más llamados.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-cyan-50 w-8 h-8 rounded-full flex items-center justify-center">4</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Vigencia y borrado automático</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Las publicaciones activas duran hasta 60 días para dar tiempo a que encuentren interesados. Pero si la publicación se desactiva (consigue 3 contactos), desaparecerá definitivamente tras 48 horas.
              </p>
            </div>
        </div>

        {/* Contact and Support Section */}
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1 mt-6">Contacto y Soporte</h2>
        <div className="bg-white rounded-lg border border-ml-border p-6 shadow-sm mb-6">
          <div className="flex gap-4 items-start">
            <div className="shrink-0 text-ml-blue bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark mb-1">¿Tenés dudas, sugerencias o querés reportar un error?</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Si encontrás alguna falla en el funcionamiento de la web, tenés alguna sugerencia para mejorar la red solidaria o querés contactarte con el equipo de soporte de Mesira Argentina, escribinos a nuestra dirección de correo electrónico:
              </p>
              <a 
                href="mailto:soporte@mesira.net" 
                className="inline-flex items-center gap-2 text-xs bg-ml-blue hover:bg-ml-blue-hover text-white font-bold py-2 px-4 rounded-lg transition shadow-sm"
              >
                <Mail size={14} />
                <span>soporte@mesira.net</span>
              </a>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-8"></div>
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
