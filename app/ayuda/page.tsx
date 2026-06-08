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
      q: "¿Qué sucede después de 48 horas de publicado?",
      a: "Para evitar que la plataforma acumule productos que ya fueron regalados o que los dueños ya no tengan disponibles, todas las publicaciones activas expiran automáticamente a las 48 horas de su creación, desapareciendo del listado principal.",
      icon: <Clock className="text-amber-500" size={18} />
    },
    {
      q: "Si mi producto se desactivó o expiró, ¿lo perdí?",
      a: "No, en absoluto. En la sección 'Mi Cuenta' tendrás acceso a todas tus publicaciones. Si por algún motivo los contactos no retiraron el producto, podés presionar 'Volver a activar'. Esto restablecerá la publicación con 0 contactos y un nuevo lapso de 48 horas. También podés elegir 'Eliminar' si ya lo entregaste.",
      icon: <RotateCcw className="text-ml-blue" size={18} />
    },
    {
      q: "¿Por qué es obligatorio verificar un celular argentino?",
      a: "La verificación por SMS (+54 9) es un filtro de seguridad indispensable. Asegura que los usuarios sean personas reales dentro del país, desalienta las cuentas duplicadas creadas para acaparar productos gratis y evita que bots automatizados de spam capturen los teléfonos de los donantes.",
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
              <h3 className="text-sm font-bold text-ml-dark">Iniciás sesión y verificás tu celular</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Ingresás de forma segura con tu cuenta de Google. Para poder publicar o contactar, te solicitamos completar tu Nombre, Apellido y tu número celular argentino. Te llegará un código SMS para validarlo al instante.
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
              <h3 className="text-sm font-bold text-ml-dark">Expiración a las 48 horas</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Toda publicación activa desaparecerá del listado principal después de 48 horas de haber sido creada. Esto garantiza que todos los productos que la gente ve sigan vigentes.
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

        {/* Help footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            ¿Tenés alguna otra duda o consulta sobre Mesira?
          </p>
          <a href="mailto:soporte@mesira.com.ar" className="text-xs text-ml-blue font-bold hover:underline mt-1 inline-block">
            soporte@mesira.com.ar
          </a>
        </div>
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
