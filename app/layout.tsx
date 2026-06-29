import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PWARegister } from "@/components/PWARegister";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "#0043C6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Mesira Argentina - Regalos gratis y sin spam",
  description: "Publicá productos que ya no uses y encontrá regalos cerca tuyo en tu barrio de Buenos Aires. Rápido, gratuito, transparente y protegido contra spam.",
  keywords: "regalos gratis, donaciones, productos gratis, Argentina, Buenos Aires, Flores, Once, Palermo, sin spam, comunidad",
  authors: [{ name: "Mesira Argentina", url: "https://mesira.net" }],
  metadataBase: new URL("https://mesira.net"),
  manifest: "/manifest.json",
  openGraph: {
    title: "Mesira Argentina - Regalos gratis y sin spam",
    description: "Publicá productos que ya no uses y encontrá regalos cerca tuyo en tu barrio. Completamente gratis.",
    url: "https://mesira.net",
    siteName: "Mesira Argentina",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Mesira Argentina - Regalos gratis",
    description: "Publicá productos que ya no uses y encontrá regalos cerca tuyo. Completamente gratis.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-ml-gray text-ml-dark">
        <AuthProvider>
          {children}
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  );
}

