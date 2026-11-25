"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  Download,
  Search,
  MessageCircle,
  LogOut,
  RefreshCw,
  Anchor,
  KeyRound,
  BookOpen,
  Compass,
  Eye,
  Heart,
  TrendingUp,
  Edit3,
  X,
  Mail,
  RotateCcw,
  UserCheck,
  Ticket,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { supabaseBrowser } from "@/shared/infrastructure/supabase/client";
import { publicEnv } from "@/shared/config/env";
import { APP_VERSION, APP_VERSION_LABEL } from "@/shared/config/version";
import AdminMissionsPanel from "@/components/admin/AdminMissionsPanel";
import AdminTutorialPanel from "@/components/admin/AdminTutorialPanel";
import AdminCouponsPanel from "@/components/admin/AdminCouponsPanel";
import AdminFormsPanel from "@/components/admin/forms/AdminFormsPanel";
import ActionIconTooltip from "@/components/admin/ActionIconTooltip";
import ModalityBadges from "@/components/admin/ModalityBadges";
import {
  ALLOWED_SHIRT_SIZES,
  ShirtSizeType,
} from "@/modules/enrollment/domain/value-objects/ShirtSize";

interface RegistrationItem {
  id: string;
  fullName: string;
  email: string;
  phoneFormatted: string;
  whatsAppUrl: string;
  cpf: string;
  birthDate: string | null;
  birthDateFormatted: string | null;
  age: number | null;
  isMinor: boolean;
  shirtSize: ShirtSizeType;
  modality: "SCHOOL" | "MISSION" | "BOTH";
  modalityTitle: string;
  missionId: string | null;
  missionTitle: string | null;
  amountFormatted: string;
  discountCents?: number;
  couponCode?: string | null;
  paymentProvider: string;
  paymentStatus: "PENDING" | "PAID" | "WAITLIST" | "CANCELED";
  createdAt: string;
}

interface AdminMissionOption {
  id: string;
  title: string;
}

interface Metrics {
  totalRegistrations: number;
  totalPaid: number;
  totalPending: number;
  totalWaitlist: number;
  totalCanceled: number;
  escolaTotal: number;
  missaoTotal: number;
  ambosTotal: number;
  missaoPaidSlots: number;
  missaoMaxSlots: number;
  totalRevenueCents: number;
  pendingRevenueCents: number;
}

type AdminTab = "registrations" | "missions" | "coupons" | "forms" | "tutorial";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("registrations");
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [analytics, setAnalytics] = useState<{
    uniqueVisits: number;
    interestedCount: number;
  }>({ uniqueVisits: 0, interestedCount: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [missions, setMissions] = useState<AdminMissionOption[]>([]);

  const [editingItem, setEditingItem] = useState<RegistrationItem | null>(null);
  const [editStatus, setEditStatus] = useState<RegistrationItem["paymentStatus"]>("PENDING");
  const [editModality, setEditModality] = useState<RegistrationItem["modality"]>("SCHOOL");
  const [editMissionId, setEditMissionId] = useState<string>("");
  const [editShirtSize, setEditShirtSize] = useState<ShirtSizeType>("M");
  const [editBirthDate, setEditBirthDate] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (modalityFilter) params.append("modality", modalityFilter);
      if (statusFilter) params.append("status", statusFilter);

      const [regRes, analyticsRes, missionsRes] = await Promise.all([
        fetch(`/api/admin/registrations?${params.toString()}`),
        fetch("/api/analytics"),
        fetch("/api/admin/missions"),
      ]);

      if (regRes.ok) {
        const data = await regRes.json();
        setRegistrations(data.registrations || []);
        setMetrics(data.metrics || null);
      }

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics({
          uniqueVisits: aData.uniqueVisits ?? 0,
          interestedCount: aData.interestedCount ?? 0,
        });
      }

      if (missionsRes.ok) {
        const mData = await missionsRes.json();
        setMissions(
          (mData.missions || []).map((m: { id: string; title: string }) => ({
            id: m.id,
            title: m.title,
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao carregar dados admin:", err);
    } finally {
      setLoading(false);
    }
  }, [search, modalityFilter, statusFilter]);

  useEffect(() => {
    const checkAuth = async () => {
      const logged = sessionStorage.getItem("moven_admin_logged");
      if (!logged) {
        router.push("/admin/login");
        return;
      }

      const passwordChanged = sessionStorage.getItem("moven_password_changed");
      if (passwordChanged === "false") {
        router.push("/admin/change-password?first_access=true");
        return;
      }

      if (publicEnv.isSupabaseConfigured) {
        const { data } = await supabaseBrowser.auth.getUser();
        if (data.user && !data.user.user_metadata?.password_changed) {
          sessionStorage.setItem("moven_password_changed", "false");
          router.push("/admin/change-password?first_access=true");
          return;
        }
      }

      loadData();
    };

    checkAuth();
  }, [loadData, router]);

  const handleUpdateStatus = async (
    id: string,
    nextStatus: "PENDING" | "PAID"
  ) => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const openEditModal = (item: RegistrationItem) => {
    setEditingItem(item);
    setEditStatus(item.paymentStatus);
    setEditModality(item.modality);
    setEditMissionId(item.missionId || missions[0]?.id || "");
    setEditShirtSize(item.shirtSize || "M");
    setEditBirthDate(item.birthDate || "");
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          status: editStatus,
          modality: editModality,
          missionId: editModality === "SCHOOL" ? undefined : editMissionId || undefined,
          shirtSize: editShirtSize,
          birthDate: editBirthDate || undefined,
        }),
      });
      if (res.ok) {
        setEditingItem(null);
        loadData();
      }
    } catch (err) {
      console.error("Erro ao salvar edição admin:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTriggerReminders = async () => {
    setSendingReminders(true);
    setReminderNotice(null);
    try {
      const res = await fetch("/api/admin/reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (!data.smtpConfigured) {
          setReminderNotice(
            `Elegíveis (+7 dias): ${data.totalEligible}. SMTP do Gmail ainda aguardando GMAIL_APP_PASSWORD (simulado no log do servidor).`
          );
        } else {
          setReminderNotice(
            `Lembretes enviados: ${data.sentCount} de ${data.totalEligible} pendentes há +7 dias.`
          );
        }
      }
    } catch (err) {
      console.error("Erro ao disparar lembretes:", err);
    } finally {
      setSendingReminders(false);
    }
  };

  const handleLogout = async () => {
    if (publicEnv.isSupabaseConfigured) {
      await supabaseBrowser.auth.signOut();
    }
    sessionStorage.removeItem("moven_admin_logged");
    sessionStorage.removeItem("moven_admin_email");
    sessionStorage.removeItem("moven_password_changed");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      {/* Header */}
      <header className="bg-[#072119] text-[#e9e1d0] border-b border-[#8fa66a]/20 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[#8fa66a] font-heading font-bold text-xl tracking-wider hover:opacity-80"
            >
              MOVEN
            </Link>
            <span className="text-xs bg-[#8fa66a]/20 text-[#8fa66a] px-2.5 py-0.5 rounded-full font-semibold">
              Painel de Gestão
            </span>
            <span
              className="text-[11px] font-mono text-[#cfc9b8]/80 bg-white/5 px-2 py-0.5 rounded-md border border-white/10"
              title={APP_VERSION_LABEL}
            >
              v{APP_VERSION}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/change-password"
              className="inline-flex items-center gap-1.5 text-xs text-[#cfc9b8] hover:text-[#e9e1d0] px-3 py-2 min-h-[40px] rounded-full border border-white/10 hover:border-white/30 transition-colors"
              title="Alterar senha de acesso"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#8fa66a]" />
              Alterar Senha
            </Link>
            <a
              href="/api/admin/registrations?action=csv"
              className="inline-flex items-center gap-2 bg-[#8fa66a] text-[#072119] text-xs font-semibold px-4 py-2 min-h-[40px] rounded-full hover:bg-[#e9e1d0] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-[#cfc9b8] hover:text-[#e9e1d0] px-3 py-2 min-h-[40px] rounded-full border border-white/10 hover:border-white/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-5 flex flex-wrap gap-2 border-t border-white/10 pt-2.5 pb-3">
          <button
            onClick={() => setActiveTab("registrations")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs font-heading font-semibold transition-colors ${
              activeTab === "registrations"
                ? "bg-[#8fa66a] text-[#072119]"
                : "text-[#cfc9b8] bg-white/5 hover:bg-white/10"
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Inscritos & Lista de Espera</span>
          </button>

          <button
            onClick={() => setActiveTab("missions")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs font-heading font-semibold transition-colors ${
              activeTab === "missions"
                ? "bg-[#8fa66a] text-[#072119]"
                : "text-[#cfc9b8] bg-white/5 hover:bg-white/10"
            }`}
          >
            <Compass className="w-4 h-4 flex-shrink-0" />
            <span>Missões & Expedições</span>
          </button>

          <button
            onClick={() => setActiveTab("coupons")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs font-heading font-semibold transition-colors ${
              activeTab === "coupons"
                ? "bg-[#8fa66a] text-[#072119]"
                : "text-[#cfc9b8] bg-white/5 hover:bg-white/10"
            }`}
          >
            <Ticket className="w-4 h-4 flex-shrink-0" />
            <span>Cupons Pix</span>
          </button>

          <button
            onClick={() => setActiveTab("forms")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs font-heading font-semibold transition-colors ${
              activeTab === "forms"
                ? "bg-[#8fa66a] text-[#072119]"
                : "text-[#cfc9b8] bg-white/5 hover:bg-white/10"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
            <span>Formulários</span>
          </button>

          <button
            onClick={() => setActiveTab("tutorial")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-full text-xs font-heading font-semibold transition-colors ${
              activeTab === "tutorial"
                ? "bg-[#8fa66a] text-[#072119]"
                : "text-[#cfc9b8] bg-white/5 hover:bg-white/10"
            }`}
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>Guia de Uso</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-5 py-8 flex-1 flex flex-col gap-8">
        {activeTab === "missions" && <AdminMissionsPanel />}

        {activeTab === "coupons" && <AdminCouponsPanel />}

        {activeTab === "forms" && <AdminFormsPanel />}

        {activeTab === "tutorial" && <AdminTutorialPanel />}

        {activeTab === "registrations" && (
          <>
            {/* KPIs */}
            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--terra)]/20 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--mut)] font-semibold uppercase tracking-wider block mb-1">
                      Total de Inscritos
                    </span>
                    <span className="text-3xl font-heading font-bold text-[var(--ink)]">
                      {metrics.totalRegistrations}
                    </span>
                    <span className="text-xs text-[var(--mut)] block mt-1">
                      Escola: {metrics.escolaTotal} · Missão: {metrics.missaoTotal} · Ambos: {metrics.ambosTotal}
                    </span>
                  </div>
                  <div className="p-3 bg-[#8fa66a]/20 text-[#8fa66a] rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--terra)]/20 shadow-sm flex items-center justify-between">
                  <div className="w-full pr-2">
                    <span className="text-xs text-[var(--mut)] font-semibold uppercase tracking-wider block mb-1">
                      Vagas Missão Amazonas
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-heading font-bold text-[var(--ink)]">
                        {metrics.missaoPaidSlots}
                      </span>
                      <span className="text-sm text-[var(--mut)]">
                        / {metrics.missaoMaxSlots} mínimas
                      </span>
                    </div>
                    <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-[#8fa66a] h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (metrics.missaoPaidSlots / metrics.missaoMaxSlots) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-[var(--terra)]/20 text-[var(--terra)] rounded-2xl flex-shrink-0">
                    <Anchor className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--terra)]/20 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--mut)] font-semibold uppercase tracking-wider block mb-1">
                      Pagos / Confirmados
                    </span>
                    <span className="text-3xl font-heading font-bold text-emerald-700 dark:text-emerald-400">
                      {metrics.totalPaid}
                    </span>
                    <span className="text-xs text-[var(--mut)] block mt-1">
                      R$ {(metrics.totalRevenueCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-2xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--terra)]/20 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--mut)] font-semibold uppercase tracking-wider block mb-1">
                      Pendentes & Lista de Espera
                    </span>
                    <span className="text-3xl font-heading font-bold text-amber-600 dark:text-amber-400">
                      {metrics.totalPending + metrics.totalWaitlist}
                    </span>
                    <span className="text-xs text-[var(--mut)] block mt-1">
                      {metrics.totalPending} pendentes · {metrics.totalWaitlist} lista de espera
                    </span>
                  </div>
                  <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}

            {/* Anti-Bot Traffic & Interest KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[var(--card)] p-5 rounded-2xl border border-[#8fa66a]/30 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--mut)] font-semibold uppercase tracking-wider block mb-1">
                    Visitas Reais (Sem Bots)
                  </span>
                  <span className="text-3xl font-heading font-bold text-[var(--ink)]">
                    {analytics.uniqueVisits.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-[var(--mut)] block mt-1">
                    Visitantes humanos únicos
                  </span>
                </div>
                <div className="p-3 bg-[#8fa66a]/20 text-[#8fa66a] rounded-2xl">
                  <Eye className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-[var(--card)] p-5 rounded-2xl border border-[#8fa66a]/30 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--mut)] font-semibold uppercase tracking-wider block mb-1">
                    Pessoas Interessadas
                  </span>
                  <span className="text-3xl font-heading font-bold text-[var(--ink)]">
                    {analytics.interestedCount.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-[var(--mut)] block mt-1">
                    Cliques em inscrição, grupo ou interesse
                  </span>
                </div>
                <div className="p-3 bg-rose-500/15 text-rose-500 rounded-2xl">
                  <Heart className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-[var(--card)] p-5 rounded-2xl border border-[#8fa66a]/30 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--mut)] font-semibold uppercase tracking-wider block mb-1">
                    Taxa de Interesse
                  </span>
                  <span className="text-3xl font-heading font-bold text-emerald-700 dark:text-emerald-400">
                    {analytics.uniqueVisits > 0
                      ? `${Math.min(
                          Math.round(
                            (analytics.interestedCount / analytics.uniqueVisits) *
                              100
                          ),
                          100
                        )}%`
                      : "0%"}
                  </span>
                  <span className="text-xs text-[var(--mut)] block mt-1">
                    Interessados / visitas únicas
                  </span>
                </div>
                <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--terra)]/20 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="w-4 h-4 text-[var(--mut)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#8fa66a]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={modalityFilter}
                  onChange={(e) => setModalityFilter(e.target.value)}
                  className="bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Todas Modalidades</option>
                  <option value="SCHOOL">Escola de Missões</option>
                  <option value="MISSION">Missão Amazonas</option>
                  <option value="BOTH">Ambos (Combo)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Todos os Status</option>
                  <option value="PAID">Confirmado (Pago)</option>
                  <option value="PENDING">Pendente</option>
                  <option value="WAITLIST">Lista de Espera</option>
                  <option value="CANCELED">Cancelado</option>
                </select>

                <button
                  onClick={handleTriggerReminders}
                  disabled={sendingReminders}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#8fa66a]/20 hover:bg-[#8fa66a]/30 text-[var(--ink)] rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  title="Enviar lembrete por e-mail para pendentes há 7+ dias"
                >
                  <Mail className="w-3.5 h-3.5 text-[#8fa66a]" />
                  {sendingReminders ? "Enviando..." : "Lembretes (+7d)"}
                </button>

                <button
                  onClick={loadData}
                  className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 transition-colors"
                  title="Recarregar dados"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {reminderNotice && (
              <div className="p-3.5 rounded-xl bg-[#8fa66a]/15 border border-[#8fa66a]/40 text-xs font-medium text-[var(--ink)] flex items-center justify-between gap-2">
                <span>{reminderNotice}</span>
                <button
                  type="button"
                  onClick={() => setReminderNotice(null)}
                  className="text-[var(--mut)] hover:text-[var(--ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Cards View */}
            <div className="md:hidden flex flex-col gap-3">
              {registrations.length === 0 ? (
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--terra)]/20 p-8 text-center text-sm text-[var(--mut)]">
                  {loading
                    ? "Carregando inscrições..."
                    : "Nenhuma inscrição encontrada com os filtros aplicados."}
                </div>
              ) : (
                registrations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--card)] rounded-2xl border border-[var(--terra)]/20 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ink)] truncate">
                          {item.fullName}
                        </div>
                        <div className="text-xs text-[var(--mut)] break-all">
                          {item.email}
                        </div>
                        <div className="text-xs text-[var(--mut)] mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span>{item.phoneFormatted} · CPF: <span className="font-mono">{item.cpf}</span></span>
                          {item.age !== null ? (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold ${
                                item.isMinor
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  : "bg-black/5 dark:bg-white/10 text-[var(--ink)]"
                              }`}
                              title={`Nasc.: ${item.birthDateFormatted}`}
                            >
                              {item.age} anos
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold"
                              title="Data de nascimento não informada"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Sem data
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {item.paymentStatus === "PAID" && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Pago
                          </span>
                        )}
                        {item.paymentStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                        {item.paymentStatus === "WAITLIST" && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Lista de Espera
                          </span>
                        )}
                        {item.paymentStatus === "CANCELED" && (
                          <span className="inline-block text-xs font-bold text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2.5 py-0.5 rounded-full">
                            Cancelado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ModalityBadges
                          modality={item.modality}
                          missionTitle={item.missionTitle}
                        />
                        <span className="inline-block font-mono font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[var(--ink)]">
                          Camisa: {item.shirtSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono font-semibold ${
                            item.paymentProvider === "PIX"
                              ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                              : "text-[var(--mut)]"
                          }`}
                        >
                          {item.paymentProvider}
                        </span>
                        <span className="font-bold text-[var(--ink)]">
                          {item.amountFormatted}
                        </span>
                        {item.couponCode && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            {item.couponCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {item.paymentStatus === "WAITLIST" ? (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "PENDING")}
                          className="flex-1 min-h-[44px] text-xs px-3 py-2 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                        >
                          Liberar Vaga
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              item.id,
                              item.paymentStatus === "PAID" ? "PENDING" : "PAID"
                            )
                          }
                          className={`flex-1 min-h-[44px] text-xs px-3 py-2 rounded-xl font-semibold transition-colors ${
                            item.paymentStatus === "PAID"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {item.paymentStatus === "PAID"
                            ? "Marcar Pendente"
                            : "Confirmar Pagamento"}
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(item)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ink)] bg-black/5 dark:bg-white/10 hover:bg-black/10 rounded-xl transition-colors"
                        title="Editar inscrição / camisa / missão / cancelar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <a
                        href={item.whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-[var(--card)] rounded-2xl border border-[var(--terra)]/20 shadow-sm flex-1">
              <div className="overflow-x-auto lg:overflow-visible">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#072119] text-[#e9e1d0] text-xs uppercase tracking-wider font-heading">
                    <tr>
                      <th className="py-3.5 px-4 rounded-tl-2xl">Inscrito</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">CPF</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Idade</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Camisa</th>
                      <th className="py-3.5 px-4">Modalidade</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Valor</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Provedor</th>
                      <th className="py-3.5 px-4 text-center rounded-tr-2xl whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-white/10">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-[var(--mut)]">
                          {loading
                            ? "Carregando inscrições..."
                            : "Nenhuma inscrição encontrada com os filtros aplicados."}
                        </td>
                      </tr>
                    ) : (
                      registrations.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--ink)]">
                              {item.fullName}
                            </div>
                            <div className="text-xs text-[var(--mut)]">
                              {item.email} · {item.phoneFormatted}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                            {item.cpf}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {item.age !== null ? (
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    item.isMinor
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                      : "bg-black/5 dark:bg-white/10 text-[var(--ink)]"
                                  }`}
                                >
                                  {item.age} anos
                                </span>
                                <span className="text-[10px] text-[var(--mut)] mt-0.5">
                                  {item.birthDateFormatted}
                                </span>
                              </div>
                            ) : (
                              <span
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                title="Data de nascimento não informada"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-7 font-mono text-xs font-bold rounded-lg bg-black/10 dark:bg-white/10">
                              {item.shirtSize}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <ModalityBadges
                              modality={item.modality}
                              missionTitle={item.missionTitle}
                            />
                          </td>
                          <td className="py-3 px-4 font-semibold text-xs whitespace-nowrap">
                            <div>{item.amountFormatted}</div>
                            {item.couponCode && (
                              <span className="inline-block mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                {item.couponCode} (-R${" "}
                                {((item.discountCents || 0) / 100)
                                  .toFixed(2)
                                  .replace(".", ",")}
                                )
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {item.paymentStatus === "PAID" && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Pago
                              </span>
                            )}
                            {item.paymentStatus === "PENDING" && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Pendente
                              </span>
                            )}
                            {item.paymentStatus === "WAITLIST" && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Lista de Espera
                              </span>
                            )}
                            {item.paymentStatus === "CANCELED" && (
                              <span className="inline-block text-xs font-bold text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2.5 py-0.5 rounded-full">
                                Cancelado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold ${
                                item.paymentProvider === "PIX"
                                  ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                                  : "text-[var(--mut)]"
                              }`}
                            >
                              {item.paymentProvider}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {item.paymentStatus === "WAITLIST" ? (
                                <ActionIconTooltip
                                  label="Liberar vaga (mover para Pendente)"
                                  variant="purple"
                                  icon={<UserCheck className="w-4 h-4" />}
                                  onClick={() => handleUpdateStatus(item.id, "PENDING")}
                                />
                              ) : item.paymentStatus === "PAID" ? (
                                <ActionIconTooltip
                                  label="Marcar como pendente"
                                  variant="amber"
                                  icon={<RotateCcw className="w-4 h-4" />}
                                  onClick={() => handleUpdateStatus(item.id, "PENDING")}
                                />
                              ) : (
                                <ActionIconTooltip
                                  label="Validar pagamento"
                                  variant="emerald"
                                  icon={<CheckCircle2 className="w-4 h-4" />}
                                  onClick={() => handleUpdateStatus(item.id, "PAID")}
                                />
                              )}

                              <ActionIconTooltip
                                label="Editar inscrição, missão, camisa ou cancelar"
                                variant="neutral"
                                icon={<Edit3 className="w-4 h-4" />}
                                onClick={() => openEditModal(item)}
                              />

                              <ActionIconTooltip
                                label="Chamar no WhatsApp"
                                variant="emerald"
                                icon={<MessageCircle className="w-4 h-4" />}
                                href={item.whatsAppUrl}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Admin Edit Registration Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--terra)]/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div>
                <h2 className="font-heading font-bold text-lg">
                  Editar Inscrição
                </h2>
                <p className="text-xs text-[var(--mut)]">
                  {editingItem.fullName} · {editingItem.cpf}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Status da Inscrição
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(
                      e.target.value as RegistrationItem["paymentStatus"]
                    )
                  }
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago / Confirmado</option>
                  <option value="WAITLIST">Lista de Espera</option>
                  <option value="CANCELED">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Modalidade
                </label>
                <select
                  value={editModality}
                  onChange={(e) =>
                    setEditModality(
                      e.target.value as RegistrationItem["modality"]
                    )
                  }
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="SCHOOL">Escola de Missões</option>
                  <option value="MISSION">Missão (Somente Missão)</option>
                  <option value="BOTH">Escola + Missão (Combo)</option>
                </select>
              </div>

              {editModality !== "SCHOOL" && missions.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                    Missão Vinculada
                  </label>
                  <select
                    value={editMissionId}
                    onChange={(e) => setEditMissionId(e.target.value)}
                    className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
                  >
                    {missions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Tamanho da Camisa
                </label>
                <select
                  value={editShirtSize}
                  onChange={(e) =>
                    setEditShirtSize(e.target.value as ShirtSizeType)
                  }
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
                >
                  {ALLOWED_SHIRT_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-black/15 dark:border-white/15 text-sm font-semibold hover:bg-black/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#8fa66a] text-[#072119] font-heading font-bold text-sm hover:bg-[#8fa66a]/90 disabled:opacity-50"
                >
                  {savingEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
