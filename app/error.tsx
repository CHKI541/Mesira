"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-md p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-red-50 text-red-500 mb-4">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Ocurrió un error inesperado
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Algo salió mal. Podés intentar recargar la página o volver al inicio.
            {process.env.NODE_ENV === "development" && error?.message && (
              <span className="block mt-2 text-xs text-red-400 font-mono bg-red-50 p-2 rounded text-left">
                {error.message}
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition"
            >
              <RefreshCw size={16} />
              Intentar de nuevo
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 px-5 py-2.5 rounded-lg font-bold text-sm transition"
            >
              Ir al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
