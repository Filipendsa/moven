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
  Sparkles,
} from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import QRCode from "qrcode";
import pix170 from "@/assets/pix/170.jpeg";
import pix2500 from "@/assets/pix/2500.jpeg";
import pix2670 from "@/assets/pix/2670.jpeg";
import { useDictionary } from "@/i18n/DictionaryContext";
import { publicEnv } from "@/shared/config/env";

const STATIC_PIX_QR_MAP: Record<string, string> = {
  "17000": pix170.src,
  "250000": pix2500.src,
  "267000": pix2670.src,
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const { locale, dict } = useDictionary();
  const t = dict.success;

  const orderId = searchParams.get("order_id");
  const isWaitlist = searchParams.get("waitlist") === "true";
  const isPix = searchParams.get("pix") === "true";
  const pixAmount = searchParams.get("amount") || "";
  const amountCents = searchParams.get("amount_cents") || "";
  const pixModality = searchParams.get("modality") || "";
  const participantName = searchParams.get("name") || "";
  const pixMessage =
    searchParams.get("pix_message") || "Oferta de 100% para Missão Amazonas";
  const pixCode = searchParams.get("pix_code") || "";
  const missionTitle = searchParams.get("mission") || "Missão Amazonas";
  const isMulti = searchParams.get("multi") === "true";
  const schoolUrl = searchParams.get("school_url") || searchParams.get("escola_url");
  const missionUrl = searchParams.get("mission_url") || searchParams.get("missao_url");
  const couponCode = searchParams.get("coupon_code") || "";
  const originalAmount = searchParams.get("original_amount") || "";
  const discountAmount = searchParams.get("discount_amount") || "";
  const isFreeCoupon = amountCents === "0";

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const pixKey = publicEnv.pixKey;
  const receiptWhatsapp = publicEnv.receiptWhatsapp;
  const receiptContactName = publicEnv.receiptContactName;

  const staticQrUrl =
    STATIC_PIX_QR_MAP[amountCents] ||
    (!amountCents
      ? pixAmount.includes("2.670")
        ? pix2670.src
        : pixAmount.includes("2.500")
        ? pix2500.src
        : pixAmount.includes("170")
        ? pix170.src
        : ""
      : "");

  useEffect(() => {
    if (isPix && !staticQrUrl && pixCode) {
      QRCode.toDataURL(pixCode, {
        width: 240,
        margin: 2,
        color: {
          dark: "#072119",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating Pix QR Code:", err));
    }
  }, [isPix, staticQrUrl, pixCode]);

  const activeQrUrl = staticQrUrl || qrDataUrl;

  const handleCopy = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  // Kept in Portuguese for MOVEN treasury
  const receiptMessage = encodeURIComponent(
    `Olá ${receiptContactName}! Segue o comprovante da minha inscrição no MOVEN:\n` +
      `• Descrição: ${pixMessage}\n` +
      `• Nome: ${participantName}\n` +
      `• Modalidade: ${pixModality}\n` +
      (couponCode
        ? `• Cupom aplicado: ${couponCode} (-${discountAmount})\n`
        : "") +
      `• Valor: ${pixAmount}\n` +
      `• Protocolo: ${orderId?.slice(0, 8) || ""}\n` +
      `Comprovante em anexo:`
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-5 flex items-center justify-center">
      <div className="max-w-lg w-full bg-[var(--card)] p-7 sm:p-10 rounded-3xl border border-[var(--terra)]/20 shadow-2xl text-center">
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
            ? t.waitlistTitle
            : isPix
            ? t.pixTitle
            : t.defaultTitle}
        </h1>

        <p className="text-sm text-[var(--mut)] mb-5">
          {isWaitlist
            ? `${t.waitlistDesc1} ${missionTitle}${t.waitlistDesc2}`
            : isPix
            ? `${t.pixDescPrefix} ${receiptContactName}.`
            : t.defaultDesc}
          {orderId && (
            <span className="block mt-1 font-mono text-xs">
              {t.protocol} {orderId.slice(0, 8)}...
            </span>
          )}
        </p>

        {/* Pix Payment Box */}
        {isPix && (
          <div className="space-y-4 mb-6 text-left">
            {/* Step 1: Automatic Offer Message */}
            <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.offerMessageLabel}
                </span>
                <button
                  onClick={() => handleCopy(pixMessage, setCopiedMessage)}
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-600 text-white px-2.5 py-1 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3 h-3" /> {t.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> {t.copyMessage}
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-bold text-[var(--ink)] bg-white/70 dark:bg-black/30 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10">
                {pixMessage}
              </p>
              <p className="text-[11px] text-[var(--mut)] mt-1.5">
                {t.offerMessageHint}
              </p>
            </div>

            {/* Step 2: QR Code + Valor + Pix Copia e Cola */}
            <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-[#8fa66a]/40 space-y-4">
              {couponCode && (
                <div className="space-y-1 text-xs border-b border-black/10 dark:border-white/10 pb-2.5">
                  <div className="flex items-center justify-between text-[var(--mut)]">
                    <span>{t.originalAmountLabel}</span>
                    <span className="line-through">{originalAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>
                      {t.couponDiscountLabel} ({couponCode}):
                    </span>
                    <span>-{discountAmount}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm border-b border-black/10 dark:border-white/10 pb-3">
                <span className="text-[var(--mut)]">{t.exactAmount}</span>
                <span className="font-heading font-bold text-xl text-[#8fa66a]">
                  {pixAmount}
                </span>
              </div>

              {isFreeCoupon && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold">{t.freeCouponTitle}</div>
                  <p>{t.freeCouponDesc}</p>
                </div>
              )}

              {!isFreeCoupon && activeQrUrl && (
                <div className="flex flex-col items-center py-2">
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-black/10">
                    <img
                      src={activeQrUrl}
                      alt={`QR Code Pix MOVEN ${pixAmount}`}
                      className="w-56 sm:w-64 h-auto object-contain rounded-xl"
                    />
                  </div>
                  <span className="text-[11px] text-[var(--mut)] mt-2 text-center">
                    {t.scanHint} ({pixAmount || t.exactValueWord})
                  </span>
                </div>
              )}

              {pixCode && (
                <div>
                  <span className="block text-xs text-[var(--mut)] mb-1">
                    {t.copyPasteLabel}
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-black/30 p-2.5 rounded-xl border border-black/10 dark:border-white/10">
                    <span className="font-mono text-[11px] truncate text-[var(--mut)]">
                      {pixCode}
                    </span>
                    <button
                      onClick={() => handleCopy(pixCode, setCopiedCode)}
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-[#8fa66a] text-[#072119] px-3 py-1.5 rounded-lg hover:bg-[#e9e1d0] transition-colors flex-shrink-0"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> {t.copiedCode}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> {t.copyCode}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {!isFreeCoupon && (
                <div>
                  <span className="block text-xs text-[var(--mut)] mb-1">
                    {t.pixKeyLabel}
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-black/30 p-2.5 rounded-xl border border-black/10 dark:border-white/10">
                    <span className="font-mono text-xs font-semibold truncate">
                      {pixKey}
                    </span>
                    <button
                      onClick={() => handleCopy(pixKey, setCopiedKey)}
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold bg-black/10 dark:bg-white/10 text-[var(--ink)] px-3 py-1.5 rounded-lg hover:bg-black/20 transition-colors flex-shrink-0"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> {t.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> {t.copyKey}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <a
                href={`https://wa.me/${receiptWhatsapp}?text=${receiptMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-bold py-3.5 px-4 rounded-xl hover:bg-[var(--terra)] transition-colors text-sm shadow-lg"
              >
                <MessageCircle className="w-5 h-5 text-[#8fa66a]" />
                {t.sendReceiptPrefix} {receiptContactName} {t.whatsappSuffix}
              </a>
            </div>
          </div>
        )}

        {/* Even3 Two-Step Combo */}
        {!isWaitlist && !isPix && isMulti && schoolUrl && missionUrl ? (
          <div className="space-y-4 mb-8 text-left bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10">
            <p className="text-xs text-[var(--mut)]">{t.even3ComboNote}</p>
            <a
              href={schoolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-[#8fa66a] text-[#072119] font-heading font-semibold p-3 rounded-xl hover:bg-[#e9e1d0] transition-colors text-sm"
            >
              <span>{t.even3Step1}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={missionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-[var(--terra)] text-[#e9e1d0] font-heading font-semibold p-3 rounded-xl hover:bg-[var(--terra)]/80 transition-colors text-sm"
            >
              <span>{t.even3Step2}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : !isWaitlist && !isPix ? (
          <p className="text-xs text-[var(--mut)] mb-6">
            {t.checkoutFallbackNote}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {!isPix && (
            <a
              href={`https://wa.me/${receiptWhatsapp}?text=${encodeURIComponent(
                t.whatsappInitialMsg
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#8fa66a]/20 text-[#072119] dark:text-[#8fa66a] font-semibold py-3 px-4 rounded-xl hover:bg-[#8fa66a]/30 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              {t.talkLeadership}
            </a>
          )}

          <Link
            href={`/${locale}/missionary`}
            className="inline-flex items-center justify-center gap-2 bg-[#8fa66a]/20 text-[#072119] dark:text-[#8fa66a] font-semibold py-3 px-4 rounded-xl hover:bg-[#8fa66a]/30 transition-colors text-sm"
          >
            {t.goToPanelCta}
          </Link>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 text-sm text-[var(--mut)] hover:text-[var(--ink)] py-2"
          >
            {t.backHome} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EnrollmentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
