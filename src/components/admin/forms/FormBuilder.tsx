"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Save,
  Send,
  Settings,
  Eye,
  Edit3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  FormQuestion,
  FormSettings,
  QuestionType,
} from "@/modules/forms/domain/entities/FormTypes";
import { AdminFormDto } from "./FormResultsView";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SHORT_TEXT: "Resposta curta",
  PARAGRAPH: "Parágrafo",
  MULTIPLE_CHOICE: "Múltipla escolha (1 opção)",
  CHECKBOXES: "Caixas de seleção (várias)",
  DROPDOWN: "Lista suspensa",
  LINEAR_SCALE: "Escala linear",
  DATE: "Data",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  SECTION_BREAK: "Divisor de Seção (nova etapa)",
};

function createEmptySection(): FormQuestion {
  return {
    id: `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    type: "SECTION_BREAK",
    title: "Nova Seção",
    description: "",
    required: false,
  };
}

function createEmptyQuestion(): FormQuestion {
  return {
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    type: "SHORT_TEXT",
    title: "Nova pergunta",
    description: "",
    required: false,
    options: ["Opção 1"],
    allowOther: false,
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "",
    scaleMaxLabel: "",
  };
}

export default function FormBuilder({
  initialForm,
  onBack,
  onSaved,
  onPublished,
}: {
  initialForm: AdminFormDto | null;
  onBack: () => void;
  onSaved: (form: AdminFormDto) => void;
  onPublished: (form: AdminFormDto) => void;
}) {
  const [title, setTitle] = useState(initialForm?.title || "Novo Formulário MOVEN");
  const [description, setDescription] = useState(initialForm?.description || "");
  const [questions, setQuestions] = useState<FormQuestion[]>(
    initialForm?.questions?.length
      ? initialForm.questions
      : [createEmptyQuestion()]
  );
  const [settings, setSettings] = useState<FormSettings>(
    initialForm?.settings || {
      limitOnePerDevice: false,
      maxResponses: null,
      closesAt: null,
      thankYouMessage:
        "Obrigado por responder! Sua resposta foi registrada com sucesso.",
    }
  );

  const [showSettings, setShowSettings] = useState(false);
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingIds = new Set((initialForm?.questions || []).map((q) => q.id));
  const hasResponses = (initialForm?.responseCount ?? 0) > 0;

  const updateQuestion = (idx: number, patch: Partial<FormQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const duplicateQuestion = (idx: number) => {
    const src = questions[idx];
    const copy: FormQuestion = {
      ...src,
      id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      options: src.options ? [...src.options] : undefined,
    };
    setQuestions((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const deleteQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const persistForm = async (): Promise<AdminFormDto | null> => {
    setErrorMsg(null);
    setSaving(true);
    try {
      const url = initialForm
        ? `/api/admin/forms/${initialForm.id}`
        : "/api/admin/forms";
      const method = initialForm ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          questions,
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar formulário.");
      }
      return data.form as AdminFormDto;
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erro ao salvar formulário."
      );
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const saved = await persistForm();
    if (saved) onSaved(saved);
  };

  const handlePublish = async () => {
    const saved = await persistForm();
    if (!saved) return;

    if (saved.status === "ACTIVE") {
      onPublished(saved);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${saved.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PUBLISH" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao publicar formulário.");
      }
      onPublished(data.form as AdminFormDto);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erro ao publicar formulário."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--terra)] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
              showSettings
                ? "bg-[#072119] text-[#e9e1d0]"
                : "bg-black/5 dark:bg-white/10 hover:bg-black/10"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Configurações
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold px-4 py-2 rounded-xl bg-[#8fa66a] text-[#072119] hover:bg-[#e9e1d0] disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {initialForm?.status === "ACTIVE"
              ? "Salvar e Ver QR Code"
              : "Publicar e Gerar QR"}
          </button>
        </div>
      </div>

      {hasResponses && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Este formulário já recebeu <strong>{initialForm?.responseCount}</strong> resposta(s). Você pode corrigir textos e adicionar novas perguntas, mas perguntas existentes não podem ser excluídas nem ter o tipo alterado.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-[var(--card)] border border-[#8fa66a]/40 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              checked={settings.limitOnePerDevice}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  limitOnePerDevice: e.target.checked,
                }))
              }
              className="accent-[#8fa66a] w-4 h-4"
            />
            <span>Limitar a 1 resposta por aparelho (anti-duplicidade)</span>
          </label>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Limite Máximo de Respostas (Opcional)
            </label>
            <input
              type="number"
              min={1}
              placeholder="Ilimitado"
              value={settings.maxResponses ?? ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  maxResponses: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Encerrar Automaticamente em (Opcional)
            </label>
            <input
              type="datetime-local"
              value={settings.closesAt ? settings.closesAt.slice(0, 16) : ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  closesAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                }))
              }
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Mensagem de Agradecimento após Envio
            </label>
            <textarea
              rows={4}
              value={settings.thankYouMessage}
              onChange={(e) =>
                setSettings((s) => ({ ...s, thankYouMessage: e.target.value }))
              }
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* Mobile Edit / Preview Switch */}
      <div className="flex lg:hidden gap-2">
        <button
          type="button"
          onClick={() => setMobileMode("edit")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
            mobileMode === "edit"
              ? "bg-[#072119] text-[#e9e1d0]"
              : "bg-black/5 dark:bg-white/10"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" /> Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileMode("preview")}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
            mobileMode === "preview"
              ? "bg-[#072119] text-[#e9e1d0]"
              : "bg-black/5 dark:bg-white/10"
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Prévia
        </button>
      </div>

      {/* Main Grid: Builder + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Builder Column */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileMode === "preview" ? "hidden lg:block" : ""
          }`}
        >
          {/* Form Header Card */}
          <div className="bg-[var(--card)] border-t-4 border-[#8fa66a] border-x border-b border-[var(--terra)]/20 rounded-2xl p-5 space-y-3">
            <input
              type="text"
              placeholder="Título do formulário"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-heading font-bold bg-transparent border-b border-black/15 dark:border-white/15 pb-2 focus:outline-none focus:border-[#8fa66a]"
            />
            <textarea
              rows={2}
              placeholder="Descrição do formulário (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm bg-transparent border-b border-black/10 dark:border-white/10 pb-1 focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          {/* Question Cards */}
          {questions.map((q, idx) => {
            const isLockedExisting = hasResponses && existingIds.has(q.id);
            const hasOptions =
              q.type === "MULTIPLE_CHOICE" ||
              q.type === "CHECKBOXES" ||
              q.type === "DROPDOWN";

            const isSection = q.type === "SECTION_BREAK";

            return (
              <div
                key={q.id}
                className={`rounded-2xl p-5 space-y-3 shadow-sm ${
                  isSection
                    ? "bg-[#072119]/90 text-[#e9e1d0] border-2 border-[#8fa66a]"
                    : "bg-[var(--card)] border border-[var(--terra)]/20"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input
                    type="text"
                    placeholder="Pergunta"
                    value={q.title}
                    onChange={(e) => updateQuestion(idx, { title: e.target.value })}
                    className="sm:col-span-7 bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:border-[#8fa66a]"
                  />

                  <select
                    value={q.type}
                    disabled={isLockedExisting}
                    onChange={(e) => {
                      const nextType = e.target.value as QuestionType;
                      updateQuestion(idx, {
                        type: nextType,
                        options:
                          nextType === "MULTIPLE_CHOICE" ||
                          nextType === "CHECKBOXES" ||
                          nextType === "DROPDOWN"
                            ? q.options?.length
                              ? q.options
                              : ["Opção 1"]
                            : undefined,
                      });
                    }}
                    className="sm:col-span-5 bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm disabled:opacity-60"
                  >
                    {Object.entries(QUESTION_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Descrição / ajuda (opcional)"
                  value={q.description || ""}
                  onChange={(e) =>
                    updateQuestion(idx, { description: e.target.value })
                  }
                  className="w-full bg-transparent border-b border-black/10 dark:border-white/10 pb-1 text-xs text-[var(--mut)] focus:outline-none focus:border-[#8fa66a]"
                />

                {/* Options Editor */}
                {hasOptions && (
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--mut)] w-4">
                          {q.type === "CHECKBOXES" ? "☐" : `${optIdx + 1}.`}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const nextOpts = [...(q.options || [])];
                            nextOpts[optIdx] = e.target.value;
                            updateQuestion(idx, { options: nextOpts });
                          }}
                          className="flex-1 bg-white/60 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs"
                        />
                        {(q.options || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextOpts = (q.options || []).filter(
                                (_, i) => i !== optIdx
                              );
                              updateQuestion(idx, { options: nextOpts });
                            }}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(idx, {
                            options: [
                              ...(q.options || []),
                              `Opção ${(q.options || []).length + 1}`,
                            ],
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8fa66a] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar opção
                      </button>

                      {q.type !== "DROPDOWN" && (
                        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--mut)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(q.allowOther)}
                            onChange={(e) =>
                              updateQuestion(idx, { allowOther: e.target.checked })
                            }
                            className="accent-[#8fa66a]"
                          />
                          Permitir &quot;Outro&quot;
                        </label>
                      )}

                      {q.type === "MULTIPLE_CHOICE" && (
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8fa66a] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(q.isQuiz)}
                            onChange={(e) =>
                              updateQuestion(idx, {
                                isQuiz: e.target.checked,
                                correctOption:
                                  e.target.checked && !q.correctOption
                                    ? q.options?.[0] || ""
                                    : q.correctOption,
                                lockOnSelect: e.target.checked ? true : undefined,
                              })
                            }
                            className="accent-[#8fa66a]"
                          />
                          Modo Quiz (mostrar resposta + explicação ao clicar)
                        </label>
                      )}
                    </div>

                    {q.type === "MULTIPLE_CHOICE" && q.isQuiz && (
                      <div className="mt-2 p-3.5 rounded-xl bg-[#8fa66a]/10 border border-[#8fa66a]/30 space-y-2.5 text-xs">
                        <div>
                          <label className="block font-semibold uppercase tracking-wider mb-1 text-[10px]">
                            Resposta Correta *
                          </label>
                          <select
                            value={q.correctOption || ""}
                            onChange={(e) =>
                              updateQuestion(idx, { correctOption: e.target.value })
                            }
                            className="w-full bg-white/80 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-lg px-2.5 py-1.5"
                          >
                            <option value="">Selecione a opção correta...</option>
                            {(q.options || []).map((opt, optIdx) => (
                              <option key={optIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold uppercase tracking-wider mb-1 text-[10px]">
                            Explicação exibida ao clicar
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Explique o porquê da resposta correta..."
                            value={q.explanation || ""}
                            onChange={(e) =>
                              updateQuestion(idx, { explanation: e.target.value })
                            }
                            className="w-full bg-white/80 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                        <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.lockOnSelect !== false}
                            onChange={(e) =>
                              updateQuestion(idx, { lockOnSelect: e.target.checked })
                            }
                            className="accent-[#8fa66a]"
                          />
                          Travar alternativa após clicar (evita trocar resposta depois de ver o gabarito)
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Linear Scale Editor */}
                {q.type === "LINEAR_SCALE" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div>
                      <label className="block text-[10px] text-[var(--mut)]">
                        Mínimo
                      </label>
                      <select
                        value={q.scaleMin ?? 1}
                        onChange={(e) =>
                          updateQuestion(idx, { scaleMin: Number(e.target.value) })
                        }
                        className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5"
                      >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--mut)]">
                        Máximo
                      </label>
                      <select
                        value={q.scaleMax ?? 5}
                        onChange={(e) =>
                          updateQuestion(idx, { scaleMax: Number(e.target.value) })
                        }
                        className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5"
                      >
                        {[3, 4, 5, 7, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Rótulo mín."
                      value={q.scaleMinLabel || ""}
                      onChange={(e) =>
                        updateQuestion(idx, { scaleMinLabel: e.target.value })
                      }
                      className="bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Rótulo máx."
                      value={q.scaleMaxLabel || ""}
                      onChange={(e) =>
                        updateQuestion(idx, { scaleMaxLabel: e.target.value })
                      }
                      className="bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5"
                    />
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                  {isSection ? (
                    <span className="text-[11px] font-semibold text-[#8fa66a]">
                      Quebra de Página / Nova Seção
                    </span>
                  ) : (
                    <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          updateQuestion(idx, { required: e.target.checked })
                        }
                        className="accent-[#8fa66a] w-4 h-4"
                      />
                      Obrigatória
                    </label>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, -1)}
                      className="p-1.5 rounded-lg hover:bg-black/10 disabled:opacity-30"
                      title="Subir"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => moveQuestion(idx, 1)}
                      className="p-1.5 rounded-lg hover:bg-black/10 disabled:opacity-30"
                      title="Descer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateQuestion(idx)}
                      className="p-1.5 rounded-lg hover:bg-black/10"
                      title="Duplicar pergunta"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={questions.length <= 1 || isLockedExisting}
                      onClick={() => deleteQuestion(idx)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                      title="Excluir pergunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}
              className="py-3 rounded-2xl border-2 border-dashed border-[#8fa66a]/50 text-[#8fa66a] font-heading font-bold text-sm hover:bg-[#8fa66a]/10 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar Pergunta
            </button>
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, createEmptySection()])}
              className="py-3 rounded-2xl border-2 border-dashed border-[var(--terra)]/50 text-[var(--terra)] font-heading font-bold text-sm hover:bg-[var(--terra)]/10 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar Seção
            </button>
          </div>
        </div>

        {/* Live Preview Column */}
        <div
          className={`lg:col-span-5 lg:sticky lg:top-28 bg-[var(--bg)] border border-[var(--terra)]/20 rounded-2xl p-5 space-y-4 ${
            mobileMode === "edit" ? "hidden lg:block" : ""
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-[#8fa66a] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Pré-visualização
          </div>

          <div className="bg-[var(--card)] border-t-4 border-[#8fa66a] rounded-2xl p-4 space-y-1">
            <h4 className="font-heading font-bold text-base">{title}</h4>
            {description && (
              <p className="text-xs text-[var(--mut)]">{description}</p>
            )}
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((q) =>
              q.type === "SECTION_BREAK" ? (
                <div
                  key={q.id}
                  className="bg-[#072119] text-[#e9e1d0] rounded-xl p-4 border-l-4 border-[#8fa66a] space-y-1 text-xs"
                >
                  <div className="font-heading font-bold">{q.title}</div>
                  {q.description && (
                    <p className="text-[11px] text-[#cfc9b8]">{q.description}</p>
                  )}
                </div>
              ) : (
              <div
                key={q.id}
                className="bg-[var(--card)] rounded-xl p-4 border border-black/10 dark:border-white/10 space-y-2 text-xs"
              >
                <div className="font-semibold">
                  {q.title}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </div>
                {q.description && (
                  <p className="text-[11px] text-[var(--mut)]">{q.description}</p>
                )}

                {(q.type === "SHORT_TEXT" ||
                  q.type === "EMAIL" ||
                  q.type === "PHONE" ||
                  q.type === "DATE") && (
                  <div className="border-b border-black/20 dark:border-white/20 py-1 text-[var(--mut)]">
                    {QUESTION_TYPE_LABELS[q.type]}
                  </div>
                )}

                {q.type === "PARAGRAPH" && (
                  <div className="border border-black/15 dark:border-white/15 rounded-lg p-2 text-[var(--mut)]">
                    Texto longo...
                  </div>
                )}

                {(q.type === "MULTIPLE_CHOICE" || q.type === "CHECKBOXES") && (
                  <div className="space-y-1">
                    {(q.options || []).map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span>{q.type === "CHECKBOXES" ? "☐" : "○"}</span>
                        <span>{o}</span>
                      </div>
                    ))}
                    {q.allowOther && (
                      <div className="text-[var(--mut)]">
                        {q.type === "CHECKBOXES" ? "☐" : "○"} Outro...
                      </div>
                    )}
                  </div>
                )}

                {q.type === "DROPDOWN" && (
                  <div className="border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-[var(--mut)]">
                    Selecionar...
                  </div>
                )}

                {q.type === "LINEAR_SCALE" && (
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {Array.from(
                      { length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 },
                      (_, i) => (q.scaleMin ?? 1) + i
                    ).map((n) => (
                      <span
                        key={n}
                        className="w-7 h-7 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center text-[11px]"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
