"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Pause,
  Play,
  Lock,
  RotateCcw,
  QrCode,
  Download,
  RefreshCw,
  Edit3,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ListChecks,
  Activity,
} from "lucide-react";
import {
  FormQuestion,
  FormSettings,
  FormStatus,
  FormAnswersMap,
  QuestionSummary,
} from "@/modules/forms/domain/entities/FormTypes";

export interface AdminFormDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: FormStatus;
  questions: FormQuestion[];
  settings: FormSettings;
  responseCount: number;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ResponseRowDto {
  id: string;
  answers: FormAnswersMap;
  locale: string;
  submittedAt: string;
}

const STATUS_BADGE: Record<FormStatus, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-gray-500/20 text-gray-600 dark:text-gray-300" },
  ACTIVE: { label: "Ativo", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  PAUSED: { label: "Pausado", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  CLOSED: { label: "Encerrado", cls: "bg-red-500/15 text-red-700 dark:text-red-400" },
};

export default function FormResultsView({
  formId,
  onBack,
  onEdit,
  onOpenQr,
}: {
  formId: string;
  onBack: () => void;
  onEdit: (form: AdminFormDto) => void;
  onOpenQr: (form: AdminFormDto) => void;
}) {
  const [form, setForm] = useState<AdminFormDto | null>(null);
  const [responses, setResponses] = useState<ResponseRowDto[]>([]);
  const [summaries, setSummaries] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"live" | "summary" | "individual">("summary");
  const [individualIdx, setIndividualIdx] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const loadResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/forms/${formId}/responses`);
      if (res.ok) {
        const data = await res.json();
        setForm(data.form);
        setResponses(data.responses || []);
        setSummaries(data.summaries || []);
      }
    } catch (err) {
      console.error("Erro ao carregar resultados:", err);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Auto-refresh every 15s while form is ACTIVE
  useEffect(() => {
    if (form?.status !== "ACTIVE") return;
    const timer = setInterval(loadResults, 15000);
    return () => clearInterval(timer);
  }, [form?.status, loadResults]);

  const handleTransition = async (
    action: "PAUSE" | "RESUME" | "CLOSE" | "REOPEN"
  ) => {
    if (
      action === "CLOSE" &&
      !window.confirm(
        "Encerrar este formulário? Ele não aceitará mais respostas até ser reaberto."
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadResults();
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="py-12 text-center text-sm text-[var(--mut)]">
        Carregando dados do formulário...
      </div>
    );
  }

  const badge = STATUS_BADGE[form.status];
  const currentResponse = responses[individualIdx];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--terra)] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar aos Formulários
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {form.status === "ACTIVE" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleTransition("PAUSE")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25"
              >
                <Pause className="w-3.5 h-3.5" /> Pausar
              </button>
            )}
            {form.status === "PAUSED" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleTransition("RESUME")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Play className="w-3.5 h-3.5" /> Retomar
              </button>
            )}
            {(form.status === "ACTIVE" || form.status === "PAUSED") && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleTransition("CLOSE")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25"
              >
                <Lock className="w-3.5 h-3.5" /> Encerrar
              </button>
            )}
            {form.status === "CLOSED" && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleTransition("REOPEN")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reabrir
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenQr(form)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#8fa66a] text-[#072119] hover:bg-[#e9e1d0]"
            >
              <QrCode className="w-3.5 h-3.5" /> QR Code & Link
            </button>

            <button
              type="button"
              onClick={() => onEdit(form)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>

            <a
              href={`/api/admin/forms/${form.id}/responses?action=csv`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#072119] text-[#e9e1d0] hover:bg-[var(--terra)]"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </a>

            <button
              type="button"
              onClick={loadResults}
              className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10"
              title="Atualizar agora"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold font-heading">{form.title}</h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            {form.description && (
              <p className="text-xs text-[var(--mut)] mt-1">{form.description}</p>
            )}
          </div>

          <div className="text-right">
            <div className="text-2xl font-heading font-bold text-[#8fa66a]">
              {responses.length}
            </div>
            <div className="text-xs text-[var(--mut)]">
              {responses.length === 1 ? "resposta recebida" : "respostas recebidas"}
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => setSubTab("summary")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold ${
              subTab === "summary"
                ? "bg-[#072119] text-[#e9e1d0]"
                : "bg-black/5 dark:bg-white/5 hover:bg-black/10"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Resumo / Resultados
          </button>
          <button
            type="button"
            onClick={() => setSubTab("live")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold ${
              subTab === "live"
                ? "bg-[#072119] text-[#e9e1d0]"
                : "bg-black/5 dark:bg-white/5 hover:bg-black/10"
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Acompanhar ao Vivo
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab("individual");
              setIndividualIdx(0);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-semibold ${
              subTab === "individual"
                ? "bg-[#072119] text-[#e9e1d0]"
                : "bg-black/5 dark:bg-white/5 hover:bg-black/10"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" /> Respostas Individuais ({responses.length})
          </button>
        </div>
      </div>

      {/* Sub-tab: Live */}
      {subTab === "live" && (
        <div className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm">
              Últimas respostas recebidas{" "}
              {form.status === "ACTIVE" && (
                <span className="text-[11px] font-normal text-[var(--mut)]">
                  (atualiza a cada 15s)
                </span>
              )}
            </h3>
          </div>

          {responses.length === 0 ? (
            <p className="text-xs text-[var(--mut)] py-6 text-center">
              Nenhuma resposta recebida ainda. Compartilhe o QR Code ou o link!
            </p>
          ) : (
            <div className="space-y-2.5">
              {responses.slice(0, 10).map((r, i) => {
                const firstQ = form.questions[0];
                const previewVal = firstQ ? r.answers[firstQ.id] : "";
                const previewText = Array.isArray(previewVal)
                  ? previewVal.join(", ")
                  : String(previewVal || "—");

                return (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[#8fa66a] mr-2">
                        #{responses.length - i}
                      </span>
                      <span className="font-medium truncate">
                        {firstQ ? `${firstQ.title}: ` : ""}
                        {previewText}
                      </span>
                    </div>
                    <span className="text-[var(--mut)] whitespace-nowrap">
                      {new Date(r.submittedAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab: Summary */}
      {subTab === "summary" && (
        <div className="space-y-4">
          {summaries.map((s) => (
            <div
              key={s.questionId}
              className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-heading font-bold text-sm sm:text-base">
                    {s.title}
                  </h4>
                  {s.correctOption && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      ✓ Quiz · {s.correctPercentage ?? 0}% acertaram
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--mut)] whitespace-nowrap">
                  {s.totalAnswers}{" "}
                  {s.totalAnswers === 1 ? "resposta" : "respostas"}
                </span>
              </div>

              {s.optionCounts && (
                <div className="space-y-2">
                  {s.optionCounts.map((opt) => {
                    const isCorrect = s.correctOption === opt.label;
                    return (
                      <div key={opt.label} className="space-y-1 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className={isCorrect ? "font-bold text-emerald-700 dark:text-emerald-400" : ""}>
                            {isCorrect ? "✓ " : ""}
                            {opt.label}
                          </span>
                          <span className="font-semibold">
                            {opt.count} ({opt.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCorrect ? "bg-emerald-500" : "bg-[#8fa66a]"
                            }`}
                            style={{ width: `${opt.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {s.scaleDistribution && (
                <div className="space-y-3">
                  <div className="text-xs">
                    Média geral:{" "}
                    <strong className="text-base text-[#8fa66a]">
                      {s.scaleAverage}
                    </strong>
                  </div>
                  <div className="space-y-1.5">
                    {s.scaleDistribution.map((item) => (
                      <div
                        key={item.value}
                        className="flex items-center gap-3 text-xs"
                      >
                        <span className="w-6 font-mono font-bold">
                          {item.value}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-[#8fa66a] rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-[var(--mut)]">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {s.textResponses && (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {s.textResponses.length === 0 ? (
                    <p className="text-xs text-[var(--mut)]">Sem respostas.</p>
                  ) : (
                    s.textResponses.map((txt, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs"
                      >
                        {txt}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab: Individual */}
      {subTab === "individual" && (
        <div className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-5 space-y-4">
          {responses.length === 0 ? (
            <p className="text-xs text-[var(--mut)] py-6 text-center">
              Nenhuma resposta recebida ainda.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <span className="text-xs font-semibold">
                  Resposta {individualIdx + 1} de {responses.length} ·{" "}
                  <span className="text-[var(--mut)] font-normal">
                    {new Date(currentResponse.submittedAt).toLocaleString("pt-BR")}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={individualIdx === 0}
                    onClick={() => setIndividualIdx((i) => Math.max(0, i - 1))}
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={individualIdx >= responses.length - 1}
                    onClick={() =>
                      setIndividualIdx((i) =>
                        Math.min(responses.length - 1, i + 1)
                      )
                    }
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {form.questions
                  .filter((q) => q.type !== "SECTION_BREAK")
                  .map((q) => {
                  const val = currentResponse.answers[q.id];
                  const display = Array.isArray(val)
                    ? val.join(", ")
                    : val !== null && val !== undefined && val !== ""
                    ? String(val)
                    : "—";
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1"
                    >
                      <div className="text-xs font-semibold text-[var(--mut)]">
                        {q.title}
                      </div>
                      <div className="text-sm font-medium">{display}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
