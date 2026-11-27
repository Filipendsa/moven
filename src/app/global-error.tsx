"use client";

import { useEffect } from "react";
import { sendMovenObservatoryBeacon } from "@/shared/infrastructure/observatory/observatoryClient";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    sendMovenObservatoryBeacon("browser_error", window.location.pathname || "/", {
      name: error.name || "NextGlobalError",
      message: error.message || "Render error in Moven",
      stack: error.stack || null,
      severity: "error",
      meta: { digest: error.digest || null },
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col items-center justify-center bg-[#072119] text-[#e9e1d0] p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Algo inesperado aconteceu</h2>
        <p className="text-sm text-[#d5cfbf] mb-6">
          Nossa equipe técnica já foi notificada. Tente recarregar a página.
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-[#8fa66a] text-[#072119] font-semibold cursor-pointer"
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
