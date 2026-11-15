"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  CreditCard,
  QrCode,
} from "lucide-react";
import { PublicMissionDto } from "@/components/missions/MissionsShowcase";
import { useDictionary } from "@/i18n/DictionaryContext";
import { formatBrl } from "@/i18n/config";
import { publicEnv } from "@/shared/config/env";

export default function EnrollmentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, dict } = useDictionary();
  const t = dict.enrollment;

  const rawModality = (
    searchParams.get("modality") ||
    searchParams.get("modalidade") ||
    ""
  ).toUpperCase();
  let defaultModality = "SCHOOL";
  if (rawModality === "MISSION" || rawModality === "MISSAO") {
    defaultModality = "MISSION";
  }
  if (rawModality === "BOTH" || rawModality === "AMBOS") {
    defaultModality = "BOTH";
  }

  const preselectedMissionId = searchParams.get("mission") || "";

  const [missions, setMissions] = useState<PublicMissionDto[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState(preselectedMissionId);
  const [modality, setModality] = useState(defaultModality);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "PIX">("CARD");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/missions")
      .then((res) => res.json())
      .then((data) => {
        const list: PublicMissionDto[] = data.missions || [];
        setMissions(list);
        if (!preselectedMissionId && list.length > 0) {
          const featured = list.find((m) => m.isFeatured) || list[0];
          setSelectedMissionId(featured.id);
        }
      })
      .catch((err) => console.error("Error loading missions:", err));
  }, [preselectedMissionId]);

  const activeMission =
    missions.find((m) => m.id === selectedMissionId) ||
    missions.find((m) => m.isFeatured) ||
    missions[0];

  const includesMission = modality === "MISSION" || modality === "BOTH";
  const isWaitlist = Boolean(includesMission && activeMission?.isWaitlistMode);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) {
      v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
    } else if (v.length > 6) {
      v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    } else if (v.length > 3) {
      v = `${v.slice(0, 3)}.${v.slice(3)}`;
    }
    setCpf(v);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }
    setPhone(v);
  };

  const localizeUrl = (url: string) =>
    url.startsWith("/") && !url.startsWith(`/${locale}/`)
      ? `/${locale}${url}`
      : url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!termsAccepted) {
      setErrorMessage(t.termsError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          cpf,
          modality,
          missionId: includesMission ? activeMission?.id : undefined,
          paymentMethod: isWaitlist ? "CARD" : paymentMethod,
          termsAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.genericError);
      }

      if (data.isWaitlist) {
        router.push(
          `/${locale}/enrollment/success?order_id=${data.registrationId}&waitlist=true&mission=${encodeURIComponent(
            data.missionTitle || activeMission?.title || t.missionDefaultTitle
          )}`
        );
        return;
      }

      const checkout = data.checkout;
      if (checkout.provider === "PIX") {
        router.push(localizeUrl(checkout.checkoutUrl));
      } else if (checkout.isMultipleStep) {
        router.push(
          `/${locale}/enrollment/success?order_id=${data.registrationId}&multi=true&school_url=${encodeURIComponent(
            checkout.checkoutUrl
          )}&mission_url=${encodeURIComponent(checkout.extraCheckoutUrl || "")}`
        );
      } else {
        window.location.href = checkout.checkoutUrl;
      }
    } catch (err: any) {
      setErrorMessage(err.message || t.unexpectedError);
      setLoading(false);
    }
  };

  const schoolPriceLabel = formatBrl(17000, locale);
  const missionPriceCents = activeMission ? activeMission.priceCents : 250000;
  const missionPriceLabel = formatBrl(missionPriceCents, locale);
  const bothPriceLabel = formatBrl(17000 + missionPriceCents, locale);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-5 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full bg-[var(--card)] p-8 sm:p-10 rounded-3xl border border-[var(--terra)]/20 shadow-2xl">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> {t.backHome}
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">
          {t.title}
        </h1>
        <p className="text-sm text-[var(--mut)] mb-6">{t.subtitle}</p>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Modality Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              {t.chooseModality}
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <label
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  modality === "SCHOOL"
                    ? "border-[#8fa66a] bg-[#8fa66a]/15"
                    : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="radio"
                    name="modality"
                    value="SCHOOL"
                    checked={modality === "SCHOOL"}
                    onChange={(e) => setModality(e.target.value)}
                    className="accent-[#8fa66a] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm sm:text-base">
                      {t.schoolTitle}
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      {t.schoolDesc}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#8fa66a] flex-shrink-0 whitespace-nowrap">
                  {schoolPriceLabel}
                </div>
              </label>

              <label
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  modality === "MISSION"
                    ? "border-[#8fa66a] bg-[#8fa66a]/15"
                    : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="radio"
                    name="modality"
                    value="MISSION"
                    checked={modality === "MISSION"}
                    onChange={(e) => setModality(e.target.value)}
                    className="accent-[#8fa66a] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm sm:text-base">
                      {activeMission ? activeMission.title : t.missionDefaultTitle}
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      {activeMission?.isWaitlistMode
                        ? t.missionWaitlistDesc
                        : `${t.missionSlotsPrefix} ${activeMission?.minSlots || 28} ${t.missionSlotsSuffix}`}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#8fa66a] flex-shrink-0 whitespace-nowrap">
                  {missionPriceLabel}
                </div>
              </label>

              <label
                className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  modality === "BOTH"
                    ? "border-[#8fa66a] bg-[#8fa66a]/15"
                    : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="radio"
                    name="modality"
                    value="BOTH"
                    checked={modality === "BOTH"}
                    onChange={(e) => setModality(e.target.value)}
                    className="accent-[#8fa66a] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm sm:text-base">
                      {t.bothTitle}
                    </div>
                    <div className="text-xs text-[var(--mut)]">
                      {t.bothDesc}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#8fa66a] flex-shrink-0 whitespace-nowrap">
                  {bothPriceLabel}
                </div>
              </label>
            </div>
          </div>

          {/* Mission Selector when multiple active missions exist */}
          {includesMission && missions.length > 1 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                {t.selectMission}
              </label>
              <select
                value={selectedMissionId}
                onChange={(e) => setSelectedMissionId(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
              >
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.startDate} - {m.endDate}){" "}
                    {m.isWaitlistMode ? `— ${t.waitlistOption}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Waitlist Notice */}
          {isWaitlist && (
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>{t.waitlistNoticeTitle}</strong> {t.waitlistNoticeBody1}{" "}
                {activeMission?.minSlots} {t.waitlistNoticeBody2}{" "}
                <strong>{t.waitlistNoticeHighlight}</strong>{" "}
                {t.waitlistNoticeBody3}
              </span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.fullNameLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.fullNamePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              {t.emailLabel}
            </label>
            <input
              type="email"
              required
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          {/* Phone & CPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                {t.phoneLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                {t.cpfLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.cpfPlaceholder}
                value={cpf}
                onChange={handleCpfChange}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          {!isWaitlist && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t.paymentMethodLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "CARD"
                      ? "border-[#8fa66a] bg-[#8fa66a]/15"
                      : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === "CARD"}
                    onChange={() => setPaymentMethod("CARD")}
                    className="mt-1 accent-[#8fa66a]"
                  />
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#8fa66a]" />
                      {t.cardTitle}
                    </div>
                    <div className="text-xs text-[var(--mut)] mt-0.5">
                      {t.cardDesc}
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "PIX"
                      ? "border-[#8fa66a] bg-[#8fa66a]/15"
                      : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PIX"
                    checked={paymentMethod === "PIX"}
                    onChange={() => setPaymentMethod("PIX")}
                    className="mt-1 accent-[#8fa66a]"
                  />
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#8fa66a]" />
                      {t.pixTitle}
                    </div>
                    <div className="text-xs text-[var(--mut)] mt-0.5">
                      {t.pixDescPrefix} {publicEnv.receiptContactName}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* LGPD Consent */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 accent-[#8fa66a] w-4 h-4 rounded"
              />
              <span className="text-xs text-[var(--mut)] leading-relaxed">
                {t.termsPrefix}{" "}
                <Link
                  href={`/${locale}/terms`}
                  target="_blank"
                  className="text-[#8fa66a] underline hover:text-[var(--ink)]"
                >
                  {t.termsLink}
                </Link>{" "}
                {t.termsMiddle}{" "}
                <Link
                  href={`/${locale}/privacy`}
                  target="_blank"
                  className="text-[#8fa66a] underline hover:text-[var(--ink)]"
                >
                  {t.privacyLink}
                </Link>{" "}
                {t.termsSuffix}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.submitLoading}
              </>
            ) : isWaitlist ? (
              <>
                <span>{t.submitWaitlist}</span>
                <Clock className="w-5 h-5" />
              </>
            ) : paymentMethod === "PIX" ? (
              <>
                <span>{t.submitPix}</span>
                <QrCode className="w-5 h-5" />
              </>
            ) : (
              <>
                <span>{t.submitCard}</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
