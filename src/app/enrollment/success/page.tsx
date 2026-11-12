"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  ExternalLink,
  ArrowRight,
  MessageCircle,
  Clock,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { Suspense, useState } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const isWaitlist = searchParams.get("waitlist") === "true";
  const isPix = searchParams.get("pix") === "true";
  const pixAmount = searchParams.get("amount") || "";
  const pixModality = searchParams.get("modality") || "";
  const participantName = searchParams.get("name") || "";
  const missionTitle = searchParams.get("mission") || "Missão Amazonas";
  const isMulti = searchParams.get("multi") === "true";
  const schoolUrl = searchParams.get("school_url") || searchParams.get("escola_url");
  const missionUrl = searchParams.get("mission_url") || searchParams.get("missao_url");

  const [copied, setCopied] = useState(false);

  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY || "11972246881";
  const receiptWhatsapp = process.env.NEXT_PUBLIC_RECEIPT_WHATSAPP || "5511972246881";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const gadielReceiptMessage = encodeURIComponent(
    `Olá Gadiel! Acabei de realizar o pagamento via Pix da minha inscrição no MOVEN.\n` +
      `• Nome: ${participantName}\n` +
      `• Modalidade: ${pixModality}\n` +
      `• Valor: ${pixAmount}\n` +
      `• Protocolo: ${orderId?.slice(0, 8) || ""}\n` +
      `Segue o comprovante em anexo:`
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-16 px-5 flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--card)] p-8 sm:p-10 rounded-3xl border border-[var(--terra)]/20 shadow-2xl text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isWaitlist
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-[#8fa66a]/20 text-[#8fa66a]"
          }`}
        >
          {isWaitlist ? (
            <Clock className="w-10 h-10" />
          ) : isPix ? (
            <QrCode className="w-10 h-10" />
          ) : (
            <CheckCircle className="w-10 h-10" />
          )}
        </div>

        <h1 className="text-2xl font-bold font-heading mb-2">
          {isWaitlist
            ? "Você está na Lista de Espera!"
            : isPix
            ? "Pagamento via Pix Direto"
            : "Inscrição Pré-Registrada!"}
        </h1>

        <p className="text-sm text-[var(--mut)] mb-6">
          {isWaitlist
            ? `Seus dados foram registrados na lista de espera da ${missionTitle}. Assim que novas vagas forem liberadas, nossa liderança entrará em contato com você pelo WhatsApp.`
            : isPix
            ? "Sua inscrição foi salva! Realize o Pix abaixo e envie o comprovante diretamente para o Gadiel no WhatsApp para confirmação da sua vaga."
            : "Seus dados cadastrais foram salvos no sistema do MOVEN."}
          {orderId && (
            <span className="block mt-1 font-mono text-xs">
              Protocolo: {orderId.slice(0, 8)}...
            </span>
          )}
        </p>

        {/* Pix Payment Box */}
        {isPix && (
          <div className="space-y-4 mb-6 text-left bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-[#8fa66a]/40">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--mut)]">Valor a transferir:</span>
              <span className="font-heading font-bold text-lg text-[#8fa66a]">
                {pixAmount}
              </span>
            </div>

            <div>
              <span className="block text-xs text-[var(--mut)] mb-1">
                Chave Pix (MOVEN / Gadiel):
              </span>
              <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-black/30 p-3 rounded-xl border border-black/10 dark:border-white/10">
                <span className="font-mono text-xs sm:text-sm font-semibold truncate">
                  {pixKey}
                </span>
                <button
                  onClick={handleCopyPix}
                  type="button"
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
            </div>

            <a
              href={`https://wa.me/${receiptWhatsapp}?text=${gadielReceiptMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-bold py-3.5 px-4 rounded-xl hover:bg-[var(--terra)] transition-colors text-sm shadow-lg"
            >
              <MessageCircle className="w-5 h-5 text-[#8fa66a]" />
              Enviar Comprovante p/ Gadiel
            </a>
          </div>
        )}

        {/* Even3 Two-Step Combo */}
        {!isWaitlist && !isPix && isMulti && schoolUrl && missionUrl ? (
          <div className="space-y-4 mb-8 text-left bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10">
            <p className="text-xs text-[var(--mut)]">
              Você escolheu o combo <strong>Escola + Missão Amazonas</strong>. Conclua os pagamentos em duas etapas no Even3:
            </p>
            <a
              href={schoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-[#8fa66a] text-[#072119] font-heading font-semibold p-3 rounded-xl hover:bg-[#e9e1d0] transition-colors text-sm"
            >
              <span>1. Pagar Escola de Missões (R$ 170,00)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={missionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-[var(--terra)] text-[#e9e1d0] font-heading font-semibold p-3 rounded-xl hover:bg-[var(--terra)]/80 transition-colors text-sm"
            >
              <span>2. Pagar Missão Amazonas (R$ 2.500,00)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : !isWaitlist && !isPix ? (
          <p className="text-xs text-[var(--mut)] mb-6">
            Você será direcionado para o checkout. Caso não abra automaticamente, fale com a liderança pelo WhatsApp.
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {!isPix && (
            <a
              href={`https://wa.me/${receiptWhatsapp}?text=${encodeURIComponent(
                "Olá! Acabei de fazer meu cadastro no MOVEN."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#8fa66a]/20 text-[#072119] dark:text-[#8fa66a] font-semibold py-3 px-4 rounded-xl hover:bg-[#8fa66a]/30 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com a liderança no WhatsApp
            </a>
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm text-[var(--terra)] hover:underline mt-2"
          >
            <span>Voltar à página inicial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EnrollmentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
