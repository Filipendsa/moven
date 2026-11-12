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
} from "lucide-react";
import { supabaseBrowser } from "@/shared/infrastructure/supabase/client";

interface RegistrationItem {
  id: string;
  fullName: string;
  email: string;
  phoneFormatted: string;
  whatsAppUrl: string;
  cpf: string;
  modality: "SCHOOL" | "MISSION" | "BOTH";
  modalityTitle: string;
  amountFormatted: string;
  paymentProvider: string;
  paymentStatus: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
}

interface Metrics {
  totalRegistrations: number;
  totalPaid: number;
  totalPending: number;
  totalCanceled: number;
  escolaTotal: number;
  missaoTotal: number;
  ambosTotal: number;
  missaoPaidSlots: number;
  missaoMaxSlots: number;
  totalRevenueCents: number;
  pendingRevenueCents: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [modalityFilter, setModalityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (modalityFilter) params.append("modality", modalityFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
        setMetrics(data.metrics || null);
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

      // Verifica se precisa trocar a senha no primeiro acesso
      const passwordChanged = sessionStorage.getItem("moven_password_changed");
      if (passwordChanged === "false") {
        router.push("/admin/change-password?first_access=true");
        return;
      }

      // Verificação com Supabase session
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
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

  const handleToggleStatus = async (
    id: string,
    currentStatus: "PENDING" | "PAID" | "CANCELED"
  ) => {
    const nextStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
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

  const handleLogout = async () => {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    ) {
      await supabaseBrowser.auth.signOut();
    }
    sessionStorage.removeItem("moven_admin_logged");
    sessionStorage.removeItem("moven_admin_email");
    sessionStorage.removeItem("moven_password_changed");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      {/* Topo do Painel */}
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
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/change-password"
              className="inline-flex items-center gap-1.5 text-xs text-[#cfc9b8] hover:text-[#e9e1d0] px-3 py-2 rounded-full border border-white/10 hover:border-white/30 transition-colors"
              title="Alterar senha de acesso"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#8fa66a]" />
              Alterar Senha
            </Link>
            <a
              href="/api/admin/registrations?action=csv"
              className="inline-flex items-center gap-2 bg-[#8fa66a] text-[#072119] text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#e9e1d0] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-[#cfc9b8] hover:text-[#e9e1d0] px-3 py-2 rounded-full border border-white/10 hover:border-white/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full px-5 py-8 flex-1 flex flex-col gap-8">
        {/* Cards de Métricas / KPIs */}
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
                    / {metrics.missaoMaxSlots} confirmadas
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
                  Lista de Interesse / Pendentes
                </span>
                <span className="text-3xl font-heading font-bold text-amber-600 dark:text-amber-400">
                  {metrics.totalPending}
                </span>
                <span className="text-xs text-[var(--mut)] block mt-1">
                  R$ {(metrics.pendingRevenueCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-amber-500/20 text-amber-500 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros e Busca */}
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
              <option value="CANCELED">Cancelado</option>
            </select>

            <button
              onClick={loadData}
              className="p-2 bg-black/5 dark:bg-white/10 rounded-xl hover:bg-black/10 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabela de Inscritos */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--terra)]/20 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#072119] text-[#e9e1d0] text-xs uppercase tracking-wider font-heading">
                <tr>
                  <th className="py-3.5 px-4">Inscrito</th>
                  <th className="py-3.5 px-4">CPF</th>
                  <th className="py-3.5 px-4">Modalidade</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Provedor</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[var(--mut)]">
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
                      <td className="py-3 px-4 font-mono text-xs">
                        {item.cpf}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[#8fa66a]/15 text-[var(--ink)]">
                          {item.modalityTitle}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs">
                        {item.amountFormatted}
                      </td>
                      <td className="py-3 px-4">
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
                        {item.paymentStatus === "CANCELED" && (
                          <span className="inline-block text-xs font-bold text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2.5 py-0.5 rounded-full">
                            Cancelado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-[var(--mut)]">
                        {item.paymentProvider}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleStatus(item.id, item.paymentStatus)
                            }
                            className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                              item.paymentStatus === "PAID"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                            title="Alternar entre Pago e Pendente (útil para conciliação Even3)"
                          >
                            {item.paymentStatus === "PAID"
                              ? "Marcar Pendente"
                              : "Confirmar Pagamento"}
                          </button>
                          <a
                            href={item.whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-full transition-colors"
                            title="Chamar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
