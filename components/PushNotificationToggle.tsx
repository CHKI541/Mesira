"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getClientMessaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { saveUserFCMToken, removeUserFCMToken } from "@/lib/db";
import { Bell, BellOff, Info, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export function PushNotificationToggle() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | "loading">("loading");
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Detect iOS: iPhones/iPods use iphone/ipod, but modern iPads use Mac UA + touch
      const ua = window.navigator.userAgent.toLowerCase();
      const ios = /iphone|ipad|ipod/.test(ua) || 
        (ua.includes('mac') && navigator.maxTouchPoints > 0);
      setIsIOS(ios);

      if (!("Notification" in window)) {
        setPermission("unsupported");
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (!("Notification" in window)) {
        setPermission("unsupported");
        setLoading(false);
        return;
      }

      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === "granted") {
        const messaging = await getClientMessaging();
        if (messaging) {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.warn("FCM VAPID Key is missing. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env.local");
            setStatusText("Falta configurar la clave VAPID de notificaciones.");
            setLoading(false);
            return;
          }
          // Bind token to the specific firebase-messaging-sw.js SW
          let swReg: ServiceWorkerRegistration | undefined;
          if ("serviceWorker" in navigator) {
            try {
              swReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
              if (!swReg) {
                swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
              }
            } catch (swErr) {
              console.warn("SW lookup failed:", swErr);
            }
          }
          const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
          if (token) {
            await saveUserFCMToken(user.uid, token);
            setStatusText("¡Notificaciones activadas correctamente!");
          }
        }
      } else if (res === "denied") {
        setStatusText("Permiso denegado. Tenés que habilitar las notificaciones en la barra de tu navegador.");
      }
    } catch (error) {
      console.error("Error activating push notifications:", error);
      setStatusText("Ocurrió un error al activar las notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const messaging = await getClientMessaging();
      if (messaging) {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (vapidKey) {
          try {
            const token = await getToken(messaging, { vapidKey });
            if (token) {
              await removeUserFCMToken(user.uid, token);
            }
          } catch (tokenErr) {
            // Token may not exist if permission already revoked
            console.warn("Could not fetch token to remove:", tokenErr);
          }
        }
      }
      setStatusText("Notificaciones desactivadas en este navegador.");
      // We cannot programmatically reset browser permission from "granted" back to "default".
      // Set to "denied" so we don't re-trigger the auto-prompt next time they open the app.
      setPermission("denied");
    } catch (error) {
      console.error("Error disabling push notifications:", error);
      setStatusText("Ocurrió un error al desactivar las notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  if (permission === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
        <Loader2 className="animate-spin text-ml-blue" size={14} />
        <span>Verificando estado de notificaciones...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 border border-gray-150 rounded-xl p-4 space-y-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-xs font-bold text-ml-dark uppercase tracking-wider mb-1">
            Campana de Notificaciones en el celular / navegador
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Habilitá las alertas push para enterarte al instante de nuevos regalos directamente en la pantalla de tu dispositivo.
          </p>
        </div>
        <span className="shrink-0">
          {permission === "granted" ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-250">
              <CheckCircle size={10} />
              Activas
            </span>
          ) : permission === "denied" ? (
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-250">
              <AlertTriangle size={10} />
              Bloqueadas
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-150 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-250">
              Desactivadas
            </span>
          )}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {permission === "default" && (
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={loading}
            className="bg-[#0043C6] hover:bg-[#0036A3] text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:bg-gray-300"
          >
            {loading ? <Loader2 className="animate-spin" size={13} /> : <Bell size={13} />}
            <span>Activar notificaciones Push</span>
          </button>
        )}

        {permission === "granted" && (
          <button
            type="button"
            onClick={handleDisableNotifications}
            disabled={loading}
            className="border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold py-2 px-4 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:bg-gray-100"
          >
            {loading ? <Loader2 className="animate-spin" size={13} /> : <BellOff size={13} />}
            <span>Desactivar notificaciones en este equipo</span>
          </button>
        )}

        {permission === "denied" && (
          <div className="text-xs text-red-700 bg-red-50/50 p-2.5 rounded-lg border border-red-200 flex items-start gap-1.5 w-full">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-500" />
            <p>
              <strong>Notificaciones bloqueadas por el navegador:</strong> Para recibirlas, hacé clic en el icono del candado 🔒 al lado de la dirección de la web y activá el permiso de Notificaciones.
            </p>
          </div>
        )}
      </div>

      {statusText && (
        <p className="text-[11px] font-bold text-[#0043C6]">{statusText}</p>
      )}

      {/* iOS Clarification Notice */}
      {isIOS && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-800 leading-relaxed shadow-sm">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">⚠️ Notificaciones en iPhone (iOS):</p>
            <p>
              En dispositivos Apple, las notificaciones push <strong>solo funcionan</strong> si primero agregás la app a tu pantalla principal. Para hacerlo:
            </p>
            <ol className="list-decimal list-inside mt-1.5 font-semibold space-y-0.5 pl-1">
              <li>Tocá el botón de compartir de Safari (icono de la caja con flecha arriba 📤).</li>
              <li>Desplázate y tocá <strong>&quot;Añadir a la pantalla de inicio&quot;</strong>.</li>
              <li>Abrí la app desde tu pantalla principal y activá las notificaciones.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
