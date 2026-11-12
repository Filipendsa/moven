"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ExternalLink, ArrowRight, MessageCircle, Clock } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const isWaitlist = searchParams.get("waitlist") === "true";
  const missionTitle = searchParams.get("mission") || "Missão Amazonas";
  const isMulti = searchParams.get("multi") === "true";
  const schoolUrl = searchParams.get("school_url") || searchParams.get("escola_url");
  const missionUrl = searchParams.get("mission_url") || searchParams.get("missao_url");

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
          ) : (
            <CheckCircle className="w-10 h-10" />
          )}
        </div>

        <h1 className="text-2xl font-bold font-heading mb-2">
          {isWaitlist
            ? "Você está na Lista de Espera!"
            : "Inscrição Pré-Registrada!"}
        </h1>
        <p className="text-sm text-[var(--mut)] mb-6">
          {isWaitlist
            ? `Seus dados foram registrados na lista de espera da ${missionTitle}. Assim que novas vagas forem liberadas, nossa liderança entrará em contato com você pelo WhatsApp.`
            : "Seus dados cadastrais foram salvos no sistema do MOVEN."}
          {orderId && (
            <span className="block mt-1 font-mono text-xs">
              Protocolo: {orderId.slice(0, 8)}...
            </span>
          )}
        </p>

        {!isWaitlist && isMulti && schoolUrl && missionUrl ? (
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
              <span>1. Pagar Escola de Missões (R$ 168,42)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={missionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-[var(--terra)] text-[#e9e1d0] font-heading font-semibold p-3 rounded-xl hover:bg-[var(--terra)]/80 transition-colors text-sm"
            >
              <span>2. Pagar Missão Amazonas (R$ 2.463,16)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : !isWaitlist ? (
          <p className="text-xs text-[var(--mut)] mb-6">
            Você será direcionado para o checkout. Caso não abra automaticamente, fale com a liderança pelo WhatsApp.
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/5511972246881?text=Ol%C3%A1%20Henrique!%20Acabei%20de%20fazer%20meu%20cadastro%20no%20MOVEN."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#8fa66a]/20 text-[#072119] dark:text-[#8fa66a] font-semibold py-3 px-4 rounded-xl hover:bg-[#8fa66a]/30 transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com a liderança no WhatsApp
          </a>

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
