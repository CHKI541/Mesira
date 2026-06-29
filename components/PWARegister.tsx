"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getClientMessaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { saveUserFCMToken } from "@/lib/db";
import { X, Download, Bell, AlertCircle, CheckCircle2 } from "lucide-react";

export function PWARegister() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default");
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [fcmRegistered, setFcmRegistered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Detect if app is running in standalone mode (installed PWA)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone = 
        window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true;
      
      setIsStandalone(standalone);

      // Check current Notification permission status
      if (!("Notification" in window)) {
        setPermissionStatus("unsupported");
      } else {
        setPermissionStatus(Notification.permission);
      }
    }
  }, []);

  // 2. Listen for the browser PWA install prompt
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent default browser banner
        e.preventDefault();
        // Save the event to trigger later
        setDeferredPrompt(e);
        // Show our premium custom banner only if not already standalone
        if (!isStandalone) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Detect if user installed it during this session
      window.addEventListener("appinstalled", () => {
        console.log("Mesira PWA was installed successfully!");
        setDeferredPrompt(null);
        setShowInstallBanner(false);
        // User just installed! Let's trigger the notification permission ask immediately
        triggerNotificationRequest();
      });

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, [isStandalone]);

  // 3. Auto-request permission on opening the installed app (standalone)
  useEffect(() => {
    if (isStandalone && permissionStatus === "default" && user) {
      // Delay slightly for better transition experience
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isStandalone, permissionStatus, user]);

  // 4. Register FCM Token with Firebase Cloud Messaging
  const registerFCMToken = async () => {
    if (!user) return;
    try {
      const messaging = await getClientMessaging();
      if (!messaging) {
        console.warn("FCM is not supported or not configured in this browser.");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn("FCM VAPID Key is missing in environment variables. Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local.");
        return;
      }

      // Get token from FCM Web SDK using VAPID key
      const token = await getToken(messaging, { vapidKey });
      if (token) {
        await saveUserFCMToken(user.uid, token);
        setFcmRegistered(true);
        // Auto-hide the success toast after 4 seconds
        setTimeout(() => setFcmRegistered(false), 4000);
        console.log("FCM registration token successfully saved to Firestore.");
      } else {
        console.warn("No registration token available. Request permission to generate one.");
      }
    } catch (err: any) {
      console.error("Error retrieving or saving FCM Web Token:", err);
      setErrorMsg("No se pudo registrar el dispositivo para alertas push.");
      // Auto-hide error toast after 6 seconds
      setTimeout(() => setErrorMsg(null), 6000);
    }
  };

  // 5. Trigger notification request flow
  const triggerNotificationRequest = async () => {
    if (!("Notification" in window)) {
      setPermissionStatus("unsupported");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setShowPermissionPrompt(false);

      if (permission === "granted") {
        await registerFCMToken();
      }
    } catch (e) {
      console.error("Error requesting notification permissions:", e);
    }
  };

  // 6. Handle custom install button click
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show browser install dialog
    deferredPrompt.prompt();
    
    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice outcome: ${outcome}`);
    
    // Clear prompt state
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Render nothing if no active prompt, permission is already configured, and no toast messages
  if (!showInstallBanner && !showPermissionPrompt && !fcmRegistered && !errorMsg) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-bottom duration-300">
      {/* 1. INSTALL APP BANNER */}
      {showInstallBanner && (
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-md border border-[#0043C6]/20 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-ml-dark">
          {/* Background glowing ambient blob */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0043C6]/5 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-start gap-3">
            <div className="bg-[#0043C6]/10 p-2.5 rounded-xl shrink-0">
              <Download className="text-[#0043C6]" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black tracking-tight text-ml-dark">Descargá la App de Mesira</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Instalá Mesira en tu pantalla de inicio para navegar más rápido y recibir alertas al instante.
              </p>
            </div>
            <button 
              onClick={() => setShowInstallBanner(false)} 
              className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-[#0043C6] hover:bg-[#0036A3] text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Instalar ahora</span>
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              Más tarde
            </button>
          </div>
        </div>
      )}

      {/* 2. AUTO NOTIFICATION PROMPT FOR INSTALLED APP */}
      {showPermissionPrompt && permissionStatus === "default" && (
        <div className="relative overflow-hidden bg-[#0043C6] text-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl shrink-0">
              <Bell className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black tracking-tight">¡Activá las Notificaciones!</h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed font-medium">
                Recibí alertas en tiempo real en tu celular en cuanto suban productos gratis de tu interés.
              </p>
            </div>
            <button 
              onClick={() => setShowPermissionPrompt(false)} 
              className="text-white/60 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={triggerNotificationRequest}
              className="flex-1 bg-white hover:bg-gray-100 text-[#0043C6] font-bold text-xs py-2.5 px-4 rounded-lg shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Permitir alertas</span>
            </button>
            <button
              onClick={() => setShowPermissionPrompt(false)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-lg transition cursor-pointer"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS / ERROR TOASTS */}
      {fcmRegistered && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold shadow-md animate-out fade-out delay-3000">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>¡Dispositivo registrado para recibir alertas push!</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold shadow-md">
          <AlertCircle size={16} className="text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
