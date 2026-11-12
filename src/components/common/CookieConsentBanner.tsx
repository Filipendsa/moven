"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("moven_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("moven_cookie_consent", "accepted");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#072119] text-[#e9e1d0] border border-[#8fa66a]/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cookie className="w-5 h-5 text-[#8fa66a] flex-shrink-0" />
          <h4 className="font-semibold text-sm">Privacidade e Cookies</h4>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-[#e9e1d0]/60 hover:text-[#e9e1d0] p-1 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-[#d5cfbf] leading-relaxed">
        Utilizamos cookies essenciais para garantir o funcionamento seguro da
        central de inscrições e preferências de navegação, em total conformidade
        com a LGPD. Saiba mais na nossa{" "}
        <Link
          href="/privacy"
          className="text-[#8fa66a] underline hover:text-[#e9e1d0]"
        >
          Política de Privacidade
        </Link>
        .
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={handleAccept}
          className="bg-[#8fa66a] text-[#072119] font-semibold text-xs px-4 py-2 rounded-full hover:bg-[#e9e1d0] transition-colors"
        >
          Entendido e Aceitar
        </button>
      </div>
    </div>
  );
}
