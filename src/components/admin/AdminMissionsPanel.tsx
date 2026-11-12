"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Star,
  Edit3,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Loader2,
  X,
} from "lucide-react";

interface AdminMissionDto {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  priceCents: number;
  priceFormatted: string;
  minSlots: number;
  maxSlots: number | null;
  waitlistEnabled: boolean;
  even3CheckoutUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  status: "OPEN" | "WAITLIST_ONLY" | "CLOSED" | "COMPLETED";
  paidCount: number;
  waitlistCount: number;
  pendingCount: number;
}

export default function AdminMissionsPanel() {
  const [missions, setMissions] = useState<AdminMissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceBrl, setPriceBrl] = useState("2463.16");
  const [minSlots, setMinSlots] = useState("28");
  const [maxSlots, setMaxSlots] = useState("28");
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);
  const [even3CheckoutUrl, setEven3CheckoutUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [status, setStatus] = useState<AdminMissionDto["status"]>("OPEN");

  const loadMissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/missions");
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (err) {
      console.error("Erro ao carregar missões:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setDescription("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setPriceBrl("2463.16");
    setMinSlots("28");
    setMaxSlots("28");
    setWaitlistEnabled(true);
    setEven3CheckoutUrl("");
    setIsFeatured(false);
    setIsActive(true);
    setStatus("OPEN");
  };

  const handleEdit = (m: AdminMissionDto) => {
    setEditingId(m.id);
    setTitle(m.title);
    setSubtitle(m.subtitle);
    setDescription(m.description);
    setLocation(m.location);
    setStartDate(m.startDate);
    setEndDate(m.endDate);
    setPriceBrl((m.priceCents / 100).toFixed(2));
    setMinSlots(String(m.minSlots));
    setMaxSlots(m.maxSlots !== null ? String(m.maxSlots) : "");
    setWaitlistEnabled(m.waitlistEnabled);
    setEven3CheckoutUrl(m.even3CheckoutUrl);
    setIsFeatured(m.isFeatured);
    setIsActive(m.isActive);
    setStatus(m.status);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const normalizedPrice = Number(priceBrl.replace(",", "."));
      const priceCents = Math.round(normalizedPrice * 100);

      const payload = {
        id: editingId || undefined,
        title,
        subtitle,
        description,
        location,
        startDate,
        endDate,
        priceCents,
        minSlots: Number(minSlots) || 28,
        maxSlots: maxSlots.trim() ? Number(maxSlots) : null,
        waitlistEnabled,
        even3CheckoutUrl,
        isFeatured,
        isActive,
        status,
      };

      const res = await fetch("/api/admin/missions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        setShowForm(false);
        loadMissions();
      }
    } catch (err) {
      console.error("Erro ao salvar missão:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFeature = async (id: string) => {
    await fetch("/api/admin/missions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "feature" }),
    });
    loadMissions();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-[var(--ink)]">
            Catálogo de Missões
          </h2>
          <p className="text-xs text-[var(--mut)]">
            Cadastre novas expedições, defina a missão em destaque na página inicial e gerencie vagas e lista de espera.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 bg-[#072119] text-[#e9e1d0] text-xs font-semibold px-4 py-2.5 rounded-full hover:bg-[var(--terra)] transition-colors"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Cancelar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-[#8fa66a]" /> Cadastrar Nova Missão
            </>
          )}
        </button>
      </div>

      {/* Create / Edit Mission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--card)] p-6 rounded-2xl border-2 border-[#8fa66a]/40 shadow-lg space-y-4"
        >
          <h3 className="font-bold font-heading text-lg">
            {editingId ? "Editar Missão" : "Nova Missão"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Título da Missão *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Missão Sertão 2028"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Subtítulo / Parceria
              </label>
              <input
                type="text"
                placeholder="Ex: Projeto Salva-Vidas"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Localidade *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Manaus / Rios do Amazonas"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Data Início *
                </label>
                <input
                  type="text"
                  required
                  placeholder="19/07/2027"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Data Fim *
                </label>
                <input
                  type="text"
                  required
                  placeholder="29/07/2027"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Valor (R$) *
              </label>
              <input
                type="text"
                required
                placeholder="2463.16"
                value={priceBrl}
                onChange={(e) => setPriceBrl(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Vagas Mínimas *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={minSlots}
                  onChange={(e) => setMinSlots(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Limite p/ Lista de Espera
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="28 (vazio = sem limite)"
                  value={maxSlots}
                  onChange={(e) => setMaxSlots(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Link Checkout Even3 (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://ingressos.eventodaigreja.com.br/..."
                value={even3CheckoutUrl}
                onChange={(e) => setEven3CheckoutUrl(e.target.value)}
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Status da Missão
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AdminMissionDto["status"])
                }
                className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
              >
                <option value="OPEN">Aberta (Inscrições Diretas)</option>
                <option value="WAITLIST_ONLY">Somente Lista de Espera</option>
                <option value="CLOSED">Fechada</option>
                <option value="COMPLETED">Concluída</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase mb-1">
              Descrição para o Público *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Descreva as atividades, formato da viagem e propósito da missão..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-1 text-xs font-medium">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={waitlistEnabled}
                onChange={(e) => setWaitlistEnabled(e.target.checked)}
                className="accent-[#8fa66a]"
              />
              Habilitar Lista de Espera após atingir o limite de vagas
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[#8fa66a]"
              />
              Colocar em Destaque na Página Inicial
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[#8fa66a]"
              />
              Visível para o público
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#8fa66a] text-[#072119] font-heading font-bold px-6 py-2.5 rounded-full hover:bg-[#8fa66a]/90 transition-colors text-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar Missão"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Missions List */}
      {loading ? (
        <div className="py-10 text-center text-sm text-[var(--mut)]">
          Carregando catálogo de missões...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((m) => (
            <div
              key={m.id}
              className={`bg-[var(--card)] p-5 rounded-2xl border shadow-sm flex flex-col justify-between gap-4 ${
                m.isFeatured
                  ? "border-2 border-[#8fa66a]"
                  : "border-[var(--terra)]/20"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {m.isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#8fa66a] text-[#072119] px-2.5 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" /> Destaque
                      </span>
                    )}
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                      {m.status === "OPEN" && "Aberta"}
                      {m.status === "WAITLIST_ONLY" && "Somente Lista de Espera"}
                      {m.status === "CLOSED" && "Fechada"}
                      {m.status === "COMPLETED" && "Concluída"}
                    </span>
                    {!m.isActive && (
                      <span className="text-[11px] font-semibold text-red-600">
                        (Oculta)
                      </span>
                    )}
                  </div>
                  <span className="font-heading font-bold text-sm">
                    {m.priceFormatted}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-heading text-[var(--ink)]">
                  {m.title}
                </h3>
                <div className="text-xs text-[var(--mut)] flex flex-wrap gap-3 mt-1 mb-2">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {m.startDate} – {m.endDate}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {m.location}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {m.paidCount} / {m.maxSlots ?? m.minSlots} pagas
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    {m.waitlistCount} lista de espera
                  </span>
                  <span className="text-[var(--mut)]">
                    {m.pendingCount} pendentes
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {!m.isFeatured && (
                  <button
                    onClick={() => handleFeature(m.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#8fa66a]/20 text-[var(--ink)] hover:bg-[#8fa66a]/40 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" /> Destacar na Home
                  </button>
                )}
                <button
                  onClick={() => handleEdit(m)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#072119] text-[#e9e1d0] hover:bg-[var(--terra)] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
