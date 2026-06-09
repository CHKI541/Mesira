import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mesira Argentina - Regalos gratis y sin spam",
  description: "Publicá productos que ya no uses y encontrá regalos cerca tuyo. Rápido, transparente y protegido contra spam.",
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
        </AuthProvider>
      </body>
    </html>
  );
}
