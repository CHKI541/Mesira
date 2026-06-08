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
  ChevronUp
} from "lucide-react";

export default function AyudaPage() {
  const { user, isOnboardingCompleted, setIsOnboardingCompleted } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "¿Por qué las publicaciones tienen un límite de 3 contactos?",
      a: "El objetivo de Mesira es la donación ágil y directa. Cuando 3 personas presionan 'Contactar' en un producto, asumimos que ya hay suficientes interesados para coordinar la entrega. Desactivar la publicación de inmediato protege al donante de recibir cientos de mensajes innecesarios de WhatsApp o llamadas.",
      icon: <ShieldAlert className="text-red-500" size={18} />
    },
    {
      q: "¿Cuándo expiran las publicaciones?",
      a: "Para mantener el feed dinámico, las publicaciones activas se muestran en el listado principal hasta por 60 días. Sin embargo, las publicaciones desactivadas (las que ya consiguieron el límite de 3 contactos) se borran por completo tras 48 horas.",
      icon: <Clock className="text-amber-500" size={18} />
    },
    {
      q: "Si mi producto se desactivó, ¿lo perdí?",
      a: "No, mientras la publicación desactivada tenga menos de 48 horas, tendrás acceso a ella en 'Mi Cuenta'. Si la persona no retiró el producto, podés presionar 'Volver a activar' para restablecerla con 0 contactos y un período activo. Pasadas las 48 horas desactivada, se eliminará permanentemente.",
      icon: <RotateCcw className="text-ml-blue" size={18} />
    },
    {
      q: "¿Por qué es obligatorio registrar un celular argentino?",
      a: "Solicitamos tu celular para que los interesados puedan enviarte un mensaje directo a WhatsApp. Al ser un número argentino (+54 9), garantizamos que la comunidad de donación sea local y real para coordinar las entregas.",
      icon: <Smartphone className="text-purple-500" size={18} />
    },
    {
      q: "¿Tengo que pagar algo por usar Mesira?",
      a: "No, Mesira es 100% gratuita. Está prohibida la venta de productos en la plataforma. Todos los artículos publicados se ofrecen con carácter de donación a la comunidad.",
      icon: <Heart className="text-pink-500" size={18} />
    }
  ];

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
            Mesira Argentina es una red solidaria de donación de artículos. Diseñamos este sistema para que regalar lo que no usás sea rápido, sencillo y, sobre todo, libre de acoso y spam.
          </p>
        </div>

        {/* Core Mechanics Section */}
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Funcionamiento Básico</h2>
        
        <div className="bg-white rounded-lg border border-ml-border divide-y divide-gray-150 shadow-sm mb-8">
          {/* Step 1 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center">1</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Iniciás sesión y completás tus datos</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Ingresás de forma segura con tu cuenta de Google. Completás tu Nombre, Apellido y celular de Argentina. Tu cuenta se activará al instante para poder usar la plataforma.
              </p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center">2</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Publicás gratis en segundos</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Subís una foto de tu producto, ponés el nombre, seleccionás el barrio donde se retira y describís el estado del artículo: Perfecto, Buen, Funcional o A Reparar.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center">3</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Límite de contactos automático</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Las personas que busquen tu producto verán los detalles. Para contactarte, deberán presionar 'Contactar', lo que les revelará tu WhatsApp. Cuando <strong>3 personas distintas</strong> hagan click, tu publicación se desactivará inmediatamente para no molestarte con más llamados.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 flex gap-4">
            <div className="shrink-0 font-black text-xl text-ml-blue bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center">4</div>
            <div>
              <h3 className="text-sm font-bold text-ml-dark">Vigencia y borrado automático</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Las publicaciones activas duran hasta 60 días para dar tiempo a que encuentren interesados. Pero si la publicación se desactiva (consigue 3 contactos), desaparecerá definitivamente tras 48 horas.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Preguntas Frecuentes (FAQ)</h2>
        
        <div className="bg-white rounded-lg border border-ml-border divide-y divide-gray-100 shadow-sm mb-6">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={index} className="overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-ml-dark hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {faq.icon}
                    <span>{faq.q}</span>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                
                {isOpen && (
                  <div className="px-10 pb-4 text-xs text-gray-500 leading-relaxed bg-gray-50/50 animate-in slide-in-from-top-1 duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
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
