import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.mesira.app',
  appName: 'Mesira',
  webDir: 'public',
  server: {
    url: 'https://mesira.net',
    // cleartext removido: la app usa HTTPS, no se necesita tráfico en texto plano
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      clientId: "67846483216-nuprff4bu2e0u0ia0a8rel2536pu78tj.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
