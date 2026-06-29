"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { saveFCMToken } from '@/lib/db';

export const PushManager: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initPush = async () => {
      if (typeof window === 'undefined') return;

      // Importar dinámicamente Capacitor para evitar errores en SSR
      const { Capacitor } = await import('@capacitor/core');
      
      if (!Capacitor.isNativePlatform()) {
        console.log("No es una plataforma nativa (Capacitor), saltando registro de Push.");
        return;
      }

      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn("Permiso de notificaciones push rechazado.");
          return;
        }

        // Registrar dispositivo con el servicio APNS/FCM
        await PushNotifications.register();

        // Escuchar el evento de registro exitoso
        pushRegistrationToken = await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registrado con éxito. Token:', token.value);
          if (user?.uid) {
            try {
              await saveFCMToken(user.uid, token.value);
            } catch (saveErr) {
              console.error("Error al guardar token FCM en Firestore:", saveErr);
            }
          }
        });

        // Escuchar errores de registro
        await PushNotifications.addListener('registrationError', (err) => {
          console.error('Error en registro de Push Notifications:', err);
        });

        // Escuchar notificaciones cuando la app está abierta en primer plano
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Notificación recibida en primer plano:', notification);
        });

        // Escuchar clic en notificación
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Acción de notificación realizada:', action);
          const data = action.notification.data;
          if (data && data.url) {
            window.location.href = data.url;
          }
        });

      } catch (err) {
        console.error("Error al inicializar Push Notifications con Capacitor:", err);
      }
    };

    let pushRegistrationToken: string | null = null;

    if (user?.uid) {
      initPush();
    }

    // Cleanup: remove listeners to prevent memory leaks
    return () => {
      pushRegistrationToken && PushNotifications.removeAllListeners();
    };
  }, [user]);

  return null;
};
export default PushManager;
