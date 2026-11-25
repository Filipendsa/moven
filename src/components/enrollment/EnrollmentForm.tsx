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
  Lock,
  Shirt,
  UserCheck,
  Ticket,
  X,
} from "lucide-react";
import { PublicMissionDto } from "@/components/missions/MissionsShowcase";
import { useDictionary } from "@/i18n/DictionaryContext";
import { formatBrl } from "@/i18n/config";
import { publicEnv } from "@/shared/config/env";
import { Cpf } from "@/modules/enrollment/domain/value-objects/Cpf";
import { Email } from "@/modules/enrollment/domain/value-objects/Email";
import { BrazilianPhone } from "@/modules/enrollment/domain/value-objects/BrazilianPhone";
import {
  ShirtSize,
  ShirtSizeType,
} from "@/modules/enrollment/domain/value-objects/ShirtSize";
import ShirtSizeSelector from "./ShirtSizeSelector";

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
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "PIX" | "">("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [shirtSize, setShirtSize] = useState<ShirtSizeType | "">("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateCpfDetected, setDuplicateCpfDetected] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
    finalAmountCents: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  const isFormFilled = Boolean(
    fullName.trim().length >= 3 &&
      Email.create(email).success &&
      BrazilianPhone.create(phone).success &&
      Cpf.create(cpf).success &&
      ShirtSize.create(shirtSize).success &&
      termsAccepted
  );

  const effectivePaymentMethod = isFormFilled ? paymentMethod : "";

  const baseAmountCents =
    modality === "SCHOOL"
      ? 17000
      : modality === "MISSION"
      ? activeMission
        ? activeMission.priceCents
        : 250000
      : 17000 + (activeMission ? activeMission.priceCents : 250000);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, [modality, effectivePaymentMethod, cpf]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput,
          cpf,
          modality,
          paymentMethod: effectivePaymentMethod,
          baseAmountCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppliedCoupon(null);
        setCouponError(data.error || "Cupom inválido.");
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discountCents: data.discountCents,
        finalAmountCents: data.finalAmountCents,
      });
    } catch {
      setCouponError("Erro ao validar cupom.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(Cpf.formatMask(e.target.value));
    setDuplicateCpfDetected(false);
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
    setDuplicateCpfDetected(false);

    if (!termsAccepted) {
      setErrorMessage(t.termsError);
      return;
    }

    if (!isFormFilled) {
      setErrorMessage(t.paymentLockedHint);
      return;
    }

    if (!isWaitlist && !effectivePaymentMethod) {
      setErrorMessage(t.selectPaymentMethodPrompt);
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
          shirtSize,
          paymentMethod: isWaitlist ? "CARD" : effectivePaymentMethod,
          couponCode:
            !isWaitlist && effectivePaymentMethod === "PIX" && appliedCoupon
              ? appliedCoupon.code
              : undefined,
          termsAccepted,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.code === "DUPLICATE_CPF") {
          setDuplicateCpfDetected(true);
          setLoading(false);
          return;
        }
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.unexpectedError;
      setErrorMessage(message);
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> {t.backHome}
          </Link>

          <Link
            href={`/${locale}/missionary`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8fa66a] hover:underline"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {t.alreadyEnrolledPrompt} {t.alreadyEnrolledLink}
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">
          {t.title}
        </h1>
        <p className="text-sm text-[var(--mut)] mb-6">{t.subtitle}</p>

        {duplicateCpfDetected && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-950 dark:text-amber-200 space-y-3">
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-300" />
              <div>
                <h2 className="font-heading font-bold text-sm sm:text-base">
                  {t.duplicateCpfTitle}
                </h2>
                <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                  {t.duplicateCpfDesc}
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/missionary?email=${encodeURIComponent(email)}`}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#072119] text-[#e9e1d0] hover:bg-[var(--terra)] font-heading font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors shadow-md"
            >
              <UserCheck className="w-4 h-4 text-[#8fa66a]" />
              {t.goToPanelCta}
            </Link>
          </div>
        )}

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

          {/* Shirt Size */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2">
              <Shirt className="w-4 h-4 text-[#8fa66a]" />
              <span>{t.shirtSizeLabel}</span>
            </label>
            <ShirtSizeSelector value={shirtSize} onChange={setShirtSize} />
            <p className="text-[11px] text-[var(--mut)] mt-1.5">
              {shirtSize ? t.shirtSizeHint : t.shirtSizePlaceholder}
            </p>
          </div>

          {/* LGPD Consent (required before unlocking payment method) */}
          <div className="pt-1">
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

          {/* Payment Method Selector (locked until form is completely filled) */}
          {!isWaitlist && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-semibold">
                  {t.paymentMethodLabel}
                </label>
                {!isFormFilled && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {!isFormFilled && (
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[var(--mut)] flex items-start gap-2">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#8fa66a]" />
                  <span>{t.paymentLockedHint}</span>
                </div>
              )}

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${
                  !isFormFilled ? "opacity-50 pointer-events-none select-none" : ""
                }`}
              >
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    isFormFilled ? "cursor-pointer" : "cursor-not-allowed"
                  } ${
                    effectivePaymentMethod === "CARD"
                      ? "border-[#8fa66a] bg-[#8fa66a]/15"
                      : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    disabled={!isFormFilled}
                    checked={effectivePaymentMethod === "CARD"}
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
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${
                    isFormFilled ? "cursor-pointer" : "cursor-not-allowed"
                  } ${
                    effectivePaymentMethod === "PIX"
                      ? "border-[#8fa66a] bg-[#8fa66a]/15"
                      : "border-black/10 dark:border-white/10 hover:border-[#8fa66a]/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PIX"
                    disabled={!isFormFilled}
                    checked={effectivePaymentMethod === "PIX"}
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

              {/* Pix Discount Coupon */}
              {effectivePaymentMethod === "PIX" && (
                <div className="mt-3 p-4 rounded-2xl bg-[#8fa66a]/10 border border-[#8fa66a]/30 space-y-2.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
                    <Ticket className="w-4 h-4 text-[#8fa66a]" />
                    <span>{t.couponLabel}</span>
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs">
                      <div>
                        <div className="font-bold text-emerald-800 dark:text-emerald-300">
                          {t.couponAppliedPrefix}{" "}
                          <span className="font-mono">{appliedCoupon.code}</span> (-
                          {formatBrl(appliedCoupon.discountCents, locale)})
                        </div>
                        <div className="text-[var(--ink)] mt-0.5">
                          {t.couponFinalTotalLabel}{" "}
                          <strong>
                            {formatBrl(appliedCoupon.finalAmountCents, locale)}
                          </strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponInput("");
                          setCouponError(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <X className="w-3.5 h-3.5" />
                        {t.couponRemove}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.couponPlaceholder}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-white/80 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-base sm:text-sm font-mono uppercase focus:outline-none focus:border-[#8fa66a]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponInput.trim()}
                        className="bg-[#072119] text-[#e9e1d0] font-heading font-semibold text-xs px-4 py-2 rounded-xl hover:bg-[var(--terra)] transition-colors disabled:opacity-50"
                      >
                        {validatingCoupon ? t.couponApplying : t.couponApply}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormFilled || (!isWaitlist && !effectivePaymentMethod)}
            className="w-full bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.submitLoading}
              </>
            ) : !isFormFilled ? (
              <>
                <Lock className="w-4 h-4" />
                <span>{t.submitFillFormFirst}</span>
              </>
            ) : isWaitlist ? (
              <>
                <span>{t.submitWaitlist}</span>
                <Clock className="w-5 h-5" />
              </>
            ) : !effectivePaymentMethod ? (
              <>
                <span>{t.selectPaymentMethodPrompt}</span>
              </>
            ) : effectivePaymentMethod === "PIX" ? (
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
