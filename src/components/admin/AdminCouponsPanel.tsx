"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Loader2,
  Sparkles,
  Users,
  X,
  Calendar,
} from "lucide-react";

interface AdminCouponDto {
  id: string;
  code: string;
  description: string;
  kind: "SINGLE_USE" | "CAMPAIGN";
  discountType: "FIXED_AMOUNT" | "PERCENTAGE";
  discountValue: number;
  applicableScope: "SCHOOL" | "SCHOOL_AND_COMBO" | "ALL";
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  isExpired: boolean;
  hasRemainingUses: boolean;
  createdAt: string;
}

interface RedemptionDto {
  id: string;
  cpf: string;
  originalAmountCents: number;
  discountCents: number;
  finalAmountCents: number;
  redeemedAt: string;
}

const SCOPE_LABELS: Record<AdminCouponDto["applicableScope"], string> = {
  SCHOOL: "Somente Escola (R$ 170)",
  SCHOOL_AND_COMBO: "Escola + Combo (desconta na Escola)",
  ALL: "Todas as Modalidades (Pix)",
};

export default function AdminCouponsPanel() {
  const [coupons, setCoupons] = useState<AdminCouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [redemptionsModalCoupon, setRedemptionsModalCoupon] =
    useState<AdminCouponDto | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionDto[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // Create form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"SINGLE_USE" | "CAMPAIGN">("SINGLE_USE");
  const [discountType, setDiscountType] = useState<"FIXED_AMOUNT" | "PERCENTAGE">("FIXED_AMOUNT");
  const [discountAmountInput, setDiscountAmountInput] = useState("25");
  const [applicableScope, setApplicableScope] =
    useState<AdminCouponDto["applicableScope"]>("SCHOOL_AND_COMBO");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Erro ao carregar cupons:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    setCode(`MOVEN-${suffix}`);
  };

  const parsedValue = Number(discountAmountInput.replace(",", ".")) || 0;
  const previewDiscountCents =
    discountType === "FIXED_AMOUNT"
      ? Math.min(Math.max(Math.round(parsedValue * 100), 0), 17000)
      : Math.min(Math.max(Math.round((17000 * parsedValue) / 100), 0), 17000);
  const previewFinalSchoolCents = Math.max(0, 17000 - previewDiscountCents);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      const discountValue =
        discountType === "FIXED_AMOUNT"
          ? Math.round(parsedValue * 100)
          : Math.round(parsedValue);

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description,
          kind,
          discountType,
          discountValue,
          applicableScope,
          maxUses: kind === "CAMPAIGN" && maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar cupom.");
      }

      setCode("");
      setDescription("");
      setExpiresAt("");
      setMaxUses("");
      setShowForm(false);
      await loadCoupons();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao criar cupom.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: AdminCouponDto) => {
    const res = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
    });
    if (res.ok) loadCoupons();
  };

  const handleDelete = async (coupon: AdminCouponDto) => {
    const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadCoupons();
    } else {
      const data = await res.json();
      alert(data.error || "Não foi possível excluir o cupom.");
    }
  };

  const openRedemptionsModal = async (coupon: AdminCouponDto) => {
    setRedemptionsModalCoupon(coupon);
    setLoadingRedemptions(true);
    try {
      const res = await fetch(`/api/admin/coupons?couponId=${coupon.id}`);
      if (res.ok) {
        const data = await res.json();
        setRedemptions(data.redemptions || []);
      }
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const handleCopy = (coupon: AdminCouponDto) => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-[var(--ink)] flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#8fa66a]" />
            Cupons de Desconto no Pix
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mut)] mt-1">
            Crie cupons unitários (1 uso) ou de campanha (com data de término). Limitado a 1 uso por CPF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setErrorMsg(null);
          }}
          className="inline-flex items-center gap-2 bg-[#8fa66a] text-[#072119] font-heading font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full hover:bg-[#e9e1d0] transition-colors shadow-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Fechar Formulário" : "Novo Cupom Pix"}
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-[var(--card)] border border-[#8fa66a]/40 rounded-2xl p-5 sm:p-6 space-y-5 shadow-md"
        >
          <h3 className="font-heading font-bold text-base text-[var(--ink)]">
            Criar Novo Cupom de Desconto
          </h3>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Código do Cupom *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: ESCOLA25 ou MOVEN-7K9P"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase focus:outline-none focus:border-[#8fa66a]"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-black/10 dark:bg-white/10 px-3 py-2 rounded-xl hover:bg-[#8fa66a]/20 transition-colors whitespace-nowrap"
                  title="Gerar código aleatório"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8fa66a]" />
                  Gerar
                </button>
              </div>
            </div>

            {/* Kind */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Tipo de Cupom *
              </label>
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as "SINGLE_USE" | "CAMPAIGN")
                }
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              >
                <option value="SINGLE_USE">Unitário (uso único · 1 pessoa)</option>
                <option value="CAMPAIGN">Campanha (com data de término)</option>
              </select>
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Formato do Desconto *
              </label>
              <select
                value={discountType}
                onChange={(e) => {
                  const next = e.target.value as "FIXED_AMOUNT" | "PERCENTAGE";
                  setDiscountType(next);
                  setDiscountAmountInput(next === "FIXED_AMOUNT" ? "25" : "5");
                }}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              >
                <option value="FIXED_AMOUNT">Valor Bruto / Fixo (R$)</option>
                <option value="PERCENTAGE">Porcentagem (%)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                {discountType === "FIXED_AMOUNT"
                  ? "Valor do Desconto (R$ 1,00 a R$ 170,00) *"
                  : "Porcentagem de Desconto (1% a 100%) *"}
              </label>
              <input
                type="number"
                required
                min={1}
                max={discountType === "PERCENTAGE" ? 100 : 170}
                step={discountType === "FIXED_AMOUNT" ? "0.01" : "1"}
                value={discountAmountInput}
                onChange={(e) => setDiscountAmountInput(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>

            {/* Scope */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Onde o Cupom Pode Ser Usado (no Pix) *
              </label>
              <select
                value={applicableScope}
                onChange={(e) =>
                  setApplicableScope(
                    e.target.value as AdminCouponDto["applicableScope"]
                  )
                }
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              >
                <option value="SCHOOL_AND_COMBO">
                  Escola de Missões e Combo (desconta na Escola)
                </option>
                <option value="SCHOOL">Somente Escola de Missões (R$ 170)</option>
                <option value="ALL">Todas as Modalidades no Pix</option>
              </select>
            </div>

            {/* Expires At */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Data de Término {kind === "CAMPAIGN" ? "*" : "(Opcional)"}
              </label>
              <input
                type="date"
                required={kind === "CAMPAIGN"}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>

            {kind === "CAMPAIGN" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Limite Máximo de Usos (Opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Vazio = ilimitado até vencer"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
                />
              </div>
            )}

            <div className={kind === "CAMPAIGN" ? "" : "md:col-span-2"}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                Observação Interna (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Campanha culto de lançamento"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3.5 rounded-xl bg-[#8fa66a]/15 border border-[#8fa66a]/40 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            <span>
              <strong>Prévia na Escola de Missões:</strong> de{" "}
              <span className="line-through opacity-70">R$ 170,00</span> por{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {(previewFinalSchoolCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>{" "}
              (desconto de{" "}
              {(previewDiscountCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              )
            </span>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-bold px-5 py-2.5 rounded-full hover:bg-[var(--terra)] transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Cupom
            </button>
          </div>
        </form>
      )}

      {/* Coupons List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--mut)]">
          Carregando cupons...
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-10 text-center text-sm text-[var(--mut)]">
          Nenhum cupom cadastrado ainda. Clique em <strong>Novo Cupom Pix</strong> para criar o primeiro.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((c) => {
            const discountLabel =
              c.discountType === "FIXED_AMOUNT"
                ? `-${(c.discountValue / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}`
                : `-${c.discountValue}%`;

            const statusBadge = !c.isActive
              ? { text: "Desativado", cls: "bg-gray-500/20 text-gray-600 dark:text-gray-300" }
              : c.isExpired
              ? { text: "Expirado", cls: "bg-red-500/15 text-red-700 dark:text-red-400" }
              : !c.hasRemainingUses
              ? { text: "Esgotado", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" }
              : { text: "Ativo", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };

            return (
              <div
                key={c.id}
                className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base bg-[#072119] text-[#8fa66a] px-3 py-1 rounded-lg">
                        {c.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c)}
                        className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-[#8fa66a]/20 transition-colors"
                        title="Copiar código"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#8fa66a]/20 text-[var(--ink)]">
                        {discountLabel}
                      </span>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusBadge.cls}`}>
                      {statusBadge.text}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-xs text-[var(--mut)]">{c.description}</p>
                  )}

                  <div className="text-xs text-[var(--mut)] space-y-1 pt-1">
                    <div>
                      <strong>Tipo:</strong>{" "}
                      {c.kind === "SINGLE_USE" ? "Unitário (1 uso)" : "Campanha"} ·{" "}
                      <strong>Usos:</strong> {c.currentUses} /{" "}
                      {c.maxUses !== null ? c.maxUses : "∞"}
                    </div>
                    <div>
                      <strong>Aplicação:</strong> {SCOPE_LABELS[c.applicableScope]}
                    </div>
                    {c.expiresAt && (
                      <div className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#8fa66a]" />
                        <strong>Expira em:</strong>{" "}
                        {new Date(c.expiresAt).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => openRedemptionsModal(c)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-[#8fa66a]/20 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-[#8fa66a]" />
                    Ver Resgates ({c.currentUses})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(c)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-amber-500/20 transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                    {c.isActive ? "Desativar" : "Ativar"}
                  </button>

                  {c.currentUses === 0 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Redemptions Modal */}
      {redemptionsModalCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--terra)]/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base">
                Resgates · {redemptionsModalCoupon.code}
              </h3>
              <button
                type="button"
                onClick={() => setRedemptionsModalCoupon(null)}
                className="p-1.5 rounded-full hover:bg-black/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingRedemptions ? (
              <p className="text-xs text-[var(--mut)] py-6 text-center">
                Carregando...
              </p>
            ) : redemptions.length === 0 ? (
              <p className="text-xs text-[var(--mut)] py-6 text-center">
                Nenhum CPF utilizou este cupom ainda.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {redemptions.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold">{r.cpf}</div>
                      <div className="text-[var(--mut)]">
                        {new Date(r.redeemedAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700 dark:text-emerald-400">
                        {(r.finalAmountCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                      <div className="text-[var(--mut)]">
                        Desc:{" "}
                        {(r.discountCents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
