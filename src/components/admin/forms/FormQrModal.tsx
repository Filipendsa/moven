"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, Copy, Check, Download, MessageCircle, ExternalLink } from "lucide-react";
import { publicEnv } from "@/shared/config/env";

interface FormQrModalProps {
  title: string;
  slug: string;
  onClose: () => void;
}

export default function FormQrModal({ title, slug, onClose }: FormQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : publicEnv.appUrl;
  const formUrl = `${origin.replace(/\/$/, "")}/pt/forms/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(formUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: "#072119",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("Erro ao gerar QR Code do formulário:", err));
  }, [formUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-form-${slug}.png`;
    a.click();
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Responda ao formulário "${title}" do MOVEN:\n${formUrl}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--terra)]/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 text-left">
          <div className="min-w-0 pr-2">
            <h3 className="font-heading font-bold text-base truncate">{title}</h3>
            <p className="text-xs text-[var(--mut)]">
              Formulário publicado · QR Code e Link
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {qrDataUrl && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-black/10">
              <img
                src={qrDataUrl}
                alt={`QR Code ${title}`}
                className="w-56 h-56 object-contain"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-black/30 p-2.5 rounded-xl border border-black/10 dark:border-white/10 text-left">
          <span className="font-mono text-xs truncate text-[var(--ink)]">
            {formUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs font-semibold bg-[#8fa66a] text-[#072119] px-3 py-1.5 rounded-lg hover:bg-[#e9e1d0] transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={!qrDataUrl}
            className="inline-flex items-center justify-center gap-1.5 bg-[#072119] text-[#e9e1d0] font-heading font-semibold text-xs py-2.5 px-3 rounded-xl hover:bg-[var(--terra)] transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar PNG
          </button>
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-heading font-semibold text-xs py-2.5 px-3 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href={`/pt/forms/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-black/10 dark:bg-white/10 text-[var(--ink)] font-heading font-semibold text-xs py-2.5 px-3 rounded-xl hover:bg-black/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir
          </a>
        </div>
      </div>
    </div>
  );
}
