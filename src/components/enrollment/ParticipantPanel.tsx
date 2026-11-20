"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Shirt,
  CreditCard,
  QrCode,
  Loader2,
  ExternalLink,
  MessageCircle,
  UserCheck,
  Compass,
  Lock,
  Plus,
  Minus,
} from "lucide-react";
import { useDictionary } from "@/i18n/DictionaryContext";
import { Email } from "@/modules/enrollment/domain/value-objects/Email";
import { ShirtSizeType } from "@/modules/enrollment/domain/value-objects/ShirtSize";
import { CheckoutResult } from "@/modules/billing/domain/ports/IPaymentGateway";
import { PublicMissionDto } from "@/components/missions/MissionsShowcase";
import { publicEnv } from "@/shared/config/env";
import ShirtSizeSelector from "./ShirtSizeSelector";

interface ParticipantRegistrationView {
  id: string;
  protocol: string;
  fullName: string;
  email: string;
  phoneFormatted: string;
  cpfMasked: string;
  modality: "SCHOOL" | "MISSION" | "BOTH";
  modalityTitle: string;
  missionId?: string;
  missionTitle?: string;
  shirtSize: ShirtSizeType;
  amountCents: number;
  amountFormatted: string;
  paymentProvider: "EVEN3" | "INFINITEPAY" | "PIX";
  paymentMethod: "PIX" | "CARD";
  paymentStatus: "PENDING" | "PAID" | "WAITLIST" | "CANCELED";
  isApproved: boolean;
  checkout?: CheckoutResult;
  createdAt: string;
  updatedAt: string;
}

export default function ParticipantPanel() {
  const searchParams = useSearchParams();
  const { locale, dict } = useDictionary();
  const t = dict.panel;

  const initialEmailParam = searchParams.get("email") || "";

  const [emailInput, setEmailInput] = useState(initialEmailParam);
  const [cpfLast4Input, setCpfLast4Input] = useState("");
  const [authenticatedLast4, setAuthenticatedLast4] = useState("");
  const [registration, setRegistration] =
    useState<ParticipantRegistrationView | null>(null);
  const [selectedShirtSize, setSelectedShirtSize] = useState<ShirtSizeType | "">(
    ""
  );
  const [missions, setMissions] = useState<PublicMissionDto[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");

  const [searching, setSearching] = useState(false);
  const [savingShirt, setSavingShirt] = useState(false);
  const [updatingMission, setUpdatingMission] = useState(false);
  const [cancelingUnpaid, setCancelingUnpaid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shirtSuccessMessage, setShirtSuccessMessage] = useState<string | null>(
    null
  );
  const [missionSuccessMessage, setMissionSuccessMessage] = useState<string | null>(
    null
  );

  const localizeUrl = (url: string) =>
    url.startsWith("/") && !url.startsWith(`/${locale}/`)
      ? `/${locale}${url}`
      : url;

  useEffect(() => {
    fetch("/api/missions")
      .then((res) => res.json())
      .then((data) => {
        const list: PublicMissionDto[] = (data.missions || []).filter(
          (m: PublicMissionDto) => m.canEnroll
        );
        setMissions(list);
      })
      .catch((err) => console.error("Error loading missions:", err));
  }, []);

  const fetchByCredentials = useCallback(
    async (rawEmail: string, rawLast4: string) => {
      setErrorMessage(null);
      setShirtSuccessMessage(null);
      setMissionSuccessMessage(null);

      const emailResult = Email.create(rawEmail);
      const cleanLast4 = rawLast4.replace(/\D/g, "");
      if (!emailResult.success || cleanLast4.length !== 4) {
        setErrorMessage(t.invalidCpfError);
        setRegistration(null);
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(
          `/api/enrollments/participant?email=${encodeURIComponent(
            emailResult.value.value
          )}&cpfLast4=${encodeURIComponent(cleanLast4)}`
        );
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 404 || data.code === "NOT_FOUND") {
            setErrorMessage(t.notFoundError);
          } else {
            setErrorMessage(data.error || t.invalidCpfError);
          }
          setRegistration(null);
          return;
        }

        const loaded: ParticipantRegistrationView = data.registration;
        setRegistration(loaded);
        setAuthenticatedLast4(cleanLast4);
        setSelectedShirtSize(loaded.shirtSize);
        if (loaded.missionId) {
          setSelectedMissionId(loaded.missionId);
        }
      } catch {
        setErrorMessage(t.notFoundError);
        setRegistration(null);
      } finally {
        setSearching(false);
      }
    },
    [t.invalidCpfError, t.notFoundError]
  );

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchByCredentials(emailInput, cpfLast4Input);
  };

  const handleSaveShirtSize = async () => {
    if (!registration || !selectedShirtSize || !authenticatedLast4) return;
    if (selectedShirtSize === registration.shirtSize) return;

    setSavingShirt(true);
    setShirtSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/enrollments/participant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registration.email,
          cpfLast4: authenticatedLast4,
          shirtSize: selectedShirtSize,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.invalidCpfError);
      }

      setRegistration((prev) =>
        prev
          ? {
              ...prev,
              shirtSize: data.shirtSize,
              updatedAt: data.updatedAt,
            }
          : null
      );
      setShirtSuccessMessage(t.shirtSavedSuccess);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.invalidCpfError;
      setErrorMessage(msg);
    } finally {
      setSavingShirt(false);
    }
  };

  const handleUpdateModality = async (
    nextModality: "SCHOOL" | "MISSION" | "BOTH",
    nextMissionId?: string
  ) => {
    if (!registration || !authenticatedLast4) return;
    setUpdatingMission(true);
    setMissionSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/enrollments/participant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registration.email,
          cpfLast4: authenticatedLast4,
          action: "UPDATE_ENROLLMENT",
          modality: nextModality,
          missionId: nextMissionId,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.invalidCpfError);
      }

      const updated: ParticipantRegistrationView = data.registration;
      setRegistration(updated);
      if (updated.missionId) {
        setSelectedMissionId(updated.missionId);
      }
      setMissionSuccessMessage(t.missionUpdatedSuccess);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.invalidCpfError;
      setErrorMessage(msg);
    } finally {
      setUpdatingMission(false);
    }
  };

  const handleCancelUnpaid = async () => {
    if (!registration || !authenticatedLast4) return;
    if (!window.confirm(t.cancelUnpaidConfirm)) return;

    setCancelingUnpaid(true);
    setMissionSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/enrollments/participant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registration.email,
          cpfLast4: authenticatedLast4,
          action: "CANCEL",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.invalidCpfError);
      }

      setRegistration(data.registration);
      setMissionSuccessMessage(t.canceledSuccess);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.invalidCpfError;
      setErrorMessage(msg);
    } finally {
      setCancelingUnpaid(false);
    }
  };

  const renderStatusBanner = (reg: ParticipantRegistrationView) => {
    switch (reg.paymentStatus) {
      case "PAID":
        return (
          <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-emerald-800 dark:text-emerald-300">
                {t.statusApprovedTitle}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-900/80 dark:text-emerald-200/85 mt-1">
                {t.statusApprovedDesc}
              </p>
            </div>
          </div>
        );
      case "WAITLIST":
        return (
          <div className="p-5 rounded-2xl bg-purple-500/15 border border-purple-500/35 flex items-start gap-3.5">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-purple-900 dark:text-purple-300">
                {t.statusWaitlistTitle}
              </h2>
              <p className="text-xs sm:text-sm text-purple-900/80 dark:text-purple-200/85 mt-1">
                {t.statusWaitlistDesc}
              </p>
            </div>
          </div>
        );
      case "CANCELED":
        return (
          <div className="p-5 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-start gap-3.5">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-red-800 dark:text-red-300">
                {t.statusCanceledTitle}
              </h2>
              <p className="text-xs sm:text-sm text-red-900/80 dark:text-red-200/85 mt-1">
                {t.statusCanceledDesc}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-5 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-start gap-3.5">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-amber-900 dark:text-amber-300">
                {t.statusPendingTitle}
              </h2>
              <p className="text-xs sm:text-sm text-amber-900/85 dark:text-amber-200/85 mt-1">
                {t.statusPendingDesc}
              </p>
            </div>
          </div>
        );
    }
  };

  const pendingCheckoutHref = (() => {
    if (!registration?.checkout) return null;
    const checkout = registration.checkout;
    if (checkout.provider === "PIX") {
      return localizeUrl(checkout.checkoutUrl);
    }
    if (checkout.isMultipleStep) {
      return `/${locale}/enrollment/success?order_id=${registration.id}&multi=true&school_url=${encodeURIComponent(
        checkout.checkoutUrl
      )}&mission_url=${encodeURIComponent(checkout.extraCheckoutUrl || "")}`;
    }
    return checkout.checkoutUrl;
  })();

  const treasuryWhatsappUrl = registration
    ? `https://wa.me/${publicEnv.receiptWhatsapp}?text=${encodeURIComponent(
        `Olá ${publicEnv.receiptContactName}! Gostaria de consultar/solicitar ajuda com minha inscrição no MOVEN (Protocolo: ${registration.protocol}, Nome: ${registration.fullName}, E-mail: ${registration.email}).`
      )}`
    : "#";

  const canModifyMissions =
    registration !== null &&
    registration.paymentStatus !== "PAID" &&
    registration.paymentStatus !== "CANCELED";

  const targetMissionId =
    selectedMissionId ||
    registration?.missionId ||
    missions.find((m) => m.isFeatured)?.id ||
    missions[0]?.id;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-5 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full bg-[var(--card)] p-7 sm:p-10 rounded-3xl border border-[var(--terra)]/20 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> {t.backHome}
          </Link>

          <Link
            href={`/${locale}/enrollment`}
            className="text-xs font-semibold text-[#8fa66a] hover:underline"
          >
            {t.newEnrollmentCta}
          </Link>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8fa66a] mb-2">
            <UserCheck className="w-4 h-4" />
            MOVEN
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-[var(--mut)]">{t.subtitle}</p>
        </div>

        {/* Missionary Login Form (Email + Last 4 digits of CPF) */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                {t.emailInputLabel}
              </label>
              <input
                type="email"
                required
                placeholder={t.emailInputPlaceholder}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                {t.cpfLast4Label}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                required
                placeholder={t.cpfLast4Placeholder}
                value={cpfLast4Input}
                onChange={(e) =>
                  setCpfLast4Input(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm font-mono tracking-widest text-center focus:outline-none focus:border-[#8fa66a]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.searching}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t.searchButton}
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {registration && (
          <div className="space-y-6 pt-2">
            {/* Approval Status Banner */}
            {renderStatusBanner(registration)}

            {/* Details Grid */}
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <h3 className="font-heading font-bold text-base">
                  {t.detailsTitle}
                </h3>
                <span className="font-mono text-xs bg-[#8fa66a]/20 text-[var(--ink)] px-2.5 py-1 rounded-full font-semibold">
                  {t.protocolLabel}: #{registration.protocol}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.participantLabel}
                  </span>
                  <span className="font-semibold">{registration.fullName}</span>
                </div>
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.cpfDetailLabel}
                  </span>
                  <span className="font-mono font-semibold">
                    {registration.cpfMasked}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.emailLabel}
                  </span>
                  <span className="font-medium break-all">
                    {registration.email}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.phoneLabel}
                  </span>
                  <span className="font-medium">
                    {registration.phoneFormatted}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.modalityLabel}
                  </span>
                  <span className="font-semibold">
                    {registration.modalityTitle}
                  </span>
                </div>
                {registration.missionTitle && (
                  <div>
                    <span className="block text-xs text-[var(--mut)]">
                      {t.missionLabel}
                    </span>
                    <span className="font-semibold">
                      {registration.missionTitle}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.amountLabel}
                  </span>
                  <span className="font-bold text-[#8fa66a]">
                    {registration.amountFormatted}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.dateLabel}
                  </span>
                  <span className="font-medium">
                    {new Date(registration.createdAt).toLocaleDateString(
                      locale === "pt"
                        ? "pt-BR"
                        : locale === "es"
                        ? "es-ES"
                        : "en-US"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2 font-heading font-bold text-base">
                {registration.paymentMethod === "PIX" ? (
                  <QrCode className="w-5 h-5 text-[#8fa66a]" />
                ) : (
                  <CreditCard className="w-5 h-5 text-[#8fa66a]" />
                )}
                <h3>{t.paymentTitle}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.paymentMethodLabel}
                  </span>
                  <span className="font-semibold">
                    {registration.paymentMethod === "PIX"
                      ? t.paymentMethodPix
                      : t.paymentMethodCard}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[var(--mut)]">
                    {t.paymentProviderLabel}
                  </span>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#8fa66a]/20 inline-block mt-0.5">
                    {registration.paymentProvider}
                  </span>
                </div>
              </div>

              {registration.paymentStatus === "PENDING" && (
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  {pendingCheckoutHref &&
                    (pendingCheckoutHref.startsWith("/") ? (
                      <Link
                        href={pendingCheckoutHref}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8fa66a] text-[#072119] font-heading font-bold py-2.5 px-4 rounded-xl hover:bg-[#8fa66a]/90 transition-colors text-xs sm:text-sm"
                      >
                        <QrCode className="w-4 h-4" />
                        {registration.paymentMethod === "PIX"
                          ? t.paymentActionPix
                          : t.paymentActionCard}
                      </Link>
                    ) : (
                      <a
                        href={pendingCheckoutHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8fa66a] text-[#072119] font-heading font-bold py-2.5 px-4 rounded-xl hover:bg-[#8fa66a]/90 transition-colors text-xs sm:text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t.paymentActionCard}
                      </a>
                    ))}

                  <a
                    href={treasuryWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-semibold py-2.5 px-4 rounded-xl hover:bg-[var(--terra)] transition-colors text-xs sm:text-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-[#8fa66a]" />
                    {t.sendReceiptCta}
                  </a>
                </div>
              )}
            </div>

            {/* Missions & Modality Management Card (only when NOT paid and NOT canceled) */}
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-[#8fa66a]/30 p-5 space-y-4">
              <div className="flex items-center gap-2 font-heading font-bold text-base">
                <Compass className="w-5 h-5 text-[#8fa66a]" />
                <h3>{t.missionManageTitle}</h3>
              </div>

              {missionSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{missionSuccessMessage}</span>
                </div>
              )}

              {registration.paymentStatus === "PAID" ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-900 dark:text-amber-300">
                    <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">{t.missionLockedPaidTitle}</p>
                      <p className="text-xs mt-1 opacity-90">
                        {t.missionLockedPaidDesc}
                      </p>
                    </div>
                  </div>
                  <a
                    href={treasuryWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-semibold py-2 px-4 rounded-xl hover:bg-[var(--terra)] transition-colors text-xs"
                  >
                    <MessageCircle className="w-4 h-4 text-[#8fa66a]" />
                    {t.contactAdminCta}
                  </a>
                </div>
              ) : registration.paymentStatus === "CANCELED" ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{t.missionLockedCanceledDesc}</span>
                </div>
              ) : canModifyMissions ? (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--mut)]">
                    {t.missionManageDesc}
                  </p>

                  {missions.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                        {t.selectMissionLabel}
                      </label>
                      <select
                        value={targetMissionId || ""}
                        onChange={(e) => setSelectedMissionId(e.target.value)}
                        disabled={updatingMission || cancelingUnpaid}
                        className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
                      >
                        {missions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title} ({m.startDate} - {m.endDate}) — {m.priceFormatted}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                    {registration.modality === "SCHOOL" && (
                      <button
                        type="button"
                        disabled={updatingMission || !targetMissionId}
                        onClick={() => handleUpdateModality("BOTH", targetMissionId)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold py-2.5 px-4 rounded-xl transition-colors text-xs sm:text-sm disabled:opacity-50"
                      >
                        {updatingMission ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        {updatingMission ? t.savingMissionChange : t.addMissionButton}
                      </button>
                    )}

                    {registration.modality === "BOTH" && (
                      <>
                        {missions.length > 0 &&
                          targetMissionId &&
                          targetMissionId !== registration.missionId && (
                            <button
                              type="button"
                              disabled={updatingMission}
                              onClick={() =>
                                handleUpdateModality("BOTH", targetMissionId)
                              }
                              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold py-2.5 px-4 rounded-xl transition-colors text-xs sm:text-sm disabled:opacity-50"
                            >
                              {updatingMission && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                              {t.switchMissionButton}
                            </button>
                          )}
                        <button
                          type="button"
                          disabled={updatingMission}
                          onClick={() => handleUpdateModality("SCHOOL", undefined)}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-300 border border-amber-600/30 font-heading font-bold py-2.5 px-4 rounded-xl transition-colors text-xs sm:text-sm disabled:opacity-50"
                        >
                          {updatingMission ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                          {t.removeMissionButton}
                        </button>
                      </>
                    )}

                    {registration.modality === "MISSION" && (
                      <>
                        <button
                          type="button"
                          disabled={updatingMission}
                          onClick={() =>
                            handleUpdateModality("BOTH", targetMissionId)
                          }
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold py-2.5 px-4 rounded-xl transition-colors text-xs sm:text-sm disabled:opacity-50"
                        >
                          {updatingMission ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {t.addSchoolButton}
                        </button>
                        {missions.length > 0 &&
                          targetMissionId &&
                          targetMissionId !== registration.missionId && (
                            <button
                              type="button"
                              disabled={updatingMission}
                              onClick={() =>
                                handleUpdateModality("MISSION", targetMissionId)
                              }
                              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#072119] text-[#e9e1d0] hover:bg-[var(--terra)] font-heading font-bold py-2.5 px-4 rounded-xl transition-colors text-xs sm:text-sm disabled:opacity-50"
                            >
                              {t.switchMissionButton}
                            </button>
                          )}
                        <button
                          type="button"
                          disabled={updatingMission}
                          onClick={() => handleUpdateModality("SCHOOL", undefined)}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-300 border border-amber-600/30 font-heading font-bold py-2.5 px-4 rounded-xl transition-colors text-xs sm:text-sm disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                          {t.removeMissionButton}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Cancel unpaid enrollment */}
                  <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold">{t.cancelUnpaidTitle}</p>
                      <p className="text-[11px] text-[var(--mut)]">
                        {t.cancelUnpaidDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={cancelingUnpaid || updatingMission}
                      onClick={handleCancelUnpaid}
                      className="inline-flex items-center justify-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 border border-red-500/30 font-heading font-bold py-2 px-4 rounded-xl transition-colors text-xs flex-shrink-0 disabled:opacity-50"
                    >
                      {cancelingUnpaid ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {cancelingUnpaid ? t.cancelingUnpaid : t.cancelUnpaidButton}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Shirt Size Editor Card */}
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-[#8fa66a]/30 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 font-heading font-bold text-base">
                  <Shirt className="w-5 h-5 text-[#8fa66a]" />
                  <h3>{t.shirtTitle}</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#8fa66a]/20 text-[var(--ink)]">
                  {t.shirtCurrentLabel}{" "}
                  <strong className="font-mono">{registration.shirtSize}</strong>
                </span>
              </div>

              <p className="text-xs text-[var(--mut)]">{t.shirtDesc}</p>

              {registration.paymentStatus === "CANCELED" ? (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {t.shirtCanceledNote}
                </p>
              ) : (
                <>
                  <ShirtSizeSelector
                    value={selectedShirtSize}
                    onChange={(size) => {
                      setSelectedShirtSize(size);
                      setShirtSuccessMessage(null);
                    }}
                    disabled={savingShirt}
                  />

                  {shirtSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{shirtSuccessMessage}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveShirtSize}
                    disabled={
                      savingShirt ||
                      !selectedShirtSize ||
                      selectedShirtSize === registration.shirtSize
                    }
                    className="w-full sm:w-auto bg-[#072119] hover:bg-[var(--terra)] text-[#e9e1d0] font-heading font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingShirt ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.shirtSaving}
                      </>
                    ) : (
                      <span>{t.shirtSaveButton}</span>
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setRegistration(null);
                  setCpfLast4Input("");
                  setAuthenticatedLast4("");
                  setErrorMessage(null);
                  setShirtSuccessMessage(null);
                  setMissionSuccessMessage(null);
                }}
                className="text-xs text-[var(--mut)] hover:text-[var(--ink)] underline"
              >
                {t.lookupAnotherCpf}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
