"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Plus,
  QrCode,
  Pause,
  Play,
  Lock,
  Copy,
  Trash2,
  BarChart3,
  Edit3,
  Sparkles,
} from "lucide-react";
import FormBuilder from "./FormBuilder";
import FormResultsView, { AdminFormDto } from "./FormResultsView";
import FormQrModal from "./FormQrModal";
import { buildMovenChallengeTemplate } from "@/modules/forms/application/templates/movenChallengeTemplate";

const STATUS_BADGE: Record<
  AdminFormDto["status"],
  { label: string; cls: string }
> = {
  DRAFT: {
    label: "Rascunho",
    cls: "bg-gray-500/20 text-gray-600 dark:text-gray-300",
  },
  ACTIVE: {
    label: "Ativo",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  PAUSED: {
    label: "Pausado",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  CLOSED: {
    label: "Encerrado",
    cls: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
};

export default function AdminFormsPanel() {
  const [forms, setForms] = useState<AdminFormDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "builder" | "results">("list");
  const [activeForm, setActiveForm] = useState<AdminFormDto | null>(null);
  const [qrModalForm, setQrModalForm] = useState<AdminFormDto | null>(null);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forms");
      if (res.ok) {
        const data = await res.json();
        setForms(data.forms || []);
      }
    } catch (err) {
      console.error("Erro ao listar formulários:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleTransition = async (
    form: AdminFormDto,
    action: "PAUSE" | "RESUME" | "CLOSE" | "DUPLICATE"
  ) => {
    if (
      action === "CLOSE" &&
      !window.confirm(`Encerrar o formulário "${form.title}"?`)
    ) {
      return;
    }
    const res = await fetch(`/api/admin/forms/${form.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await loadForms();
    }
  };

  const handleDelete = async (form: AdminFormDto) => {
    if (
      !window.confirm(
        `Excluir permanentemente "${form.title}" e todas as suas respostas?`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/forms/${form.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await loadForms();
    }
  };

  if (view === "builder") {
    return (
      <>
        <FormBuilder
          initialForm={activeForm}
          onBack={() => {
            setView("list");
            setActiveForm(null);
            loadForms();
          }}
          onSaved={(saved) => {
            setActiveForm(saved);
            setView("list");
            loadForms();
          }}
          onPublished={(published) => {
            setActiveForm(published);
            setQrModalForm(published);
            setView("results");
            loadForms();
          }}
        />
        {qrModalForm && (
          <FormQrModal
            title={qrModalForm.title}
            slug={qrModalForm.slug}
            onClose={() => setQrModalForm(null)}
          />
        )}
      </>
    );
  }

  if (view === "results" && activeForm) {
    return (
      <>
        <FormResultsView
          formId={activeForm.id}
          onBack={() => {
            setView("list");
            setActiveForm(null);
            loadForms();
          }}
          onEdit={(f) => {
            setActiveForm(f);
            setView("builder");
          }}
          onOpenQr={(f) => setQrModalForm(f)}
        />
        {qrModalForm && (
          <FormQrModal
            title={qrModalForm.title}
            slug={qrModalForm.slug}
            onClose={() => setQrModalForm(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-[var(--ink)] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#8fa66a]" />
            Formulários MOVEN
          </h2>
          <p className="text-xs sm:text-sm text-[var(--mut)] mt-1">
            Crie formulários estilo Google Forms, gere QR Code ao publicar e acompanhe as respostas ao vivo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const tpl = buildMovenChallengeTemplate();
              const res = await fetch("/api/admin/forms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tpl),
              });
              if (res.ok) {
                const data = await res.json();
                setActiveForm(data.form);
                setView("builder");
              }
            }}
            className="inline-flex items-center gap-2 bg-[#072119] text-[#e9e1d0] font-heading font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full hover:bg-[var(--terra)] transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#8fa66a]" />
            Usar Modelo: Desafio Escola
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveForm(null);
              setView("builder");
            }}
            className="inline-flex items-center gap-2 bg-[#8fa66a] text-[#072119] font-heading font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full hover:bg-[#e9e1d0] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Formulário
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--mut)]">
          Carregando formulários...
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-10 text-center text-sm text-[var(--mut)]">
          Nenhum formulário criado ainda. Clique em <strong>Novo Formulário</strong> para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((f) => {
            const badge = STATUS_BADGE[f.status];
            return (
              <div
                key={f.id}
                className="bg-[var(--card)] border border-[var(--terra)]/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div
                  className="space-y-2 cursor-pointer"
                  onClick={() => {
                    setActiveForm(f);
                    setView(f.status === "DRAFT" ? "builder" : "results");
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-bold text-base text-[var(--ink)] hover:text-[#8fa66a] transition-colors">
                      {f.title}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {f.description && (
                    <p className="text-xs text-[var(--mut)] line-clamp-2">
                      {f.description}
                    </p>
                  )}

                  <div className="text-xs text-[var(--mut)] flex flex-wrap items-center gap-3 pt-1">
                    <span>
                      <strong className="text-[var(--ink)]">
                        {f.responseCount}
                      </strong>{" "}
                      {f.responseCount === 1 ? "resposta" : "respostas"}
                    </span>
                    <span>·</span>
                    <span>{f.questions.length} perguntas</span>
                    <span>·</span>
                    <span>
                      {new Date(f.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                  {f.status !== "DRAFT" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveForm(f);
                        setView("results");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#072119] text-[#e9e1d0] hover:bg-[var(--terra)]"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Resultados
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveForm(f);
                        setView("builder");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#072119] text-[#e9e1d0] hover:bg-[var(--terra)]"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}

                  {f.status !== "DRAFT" && (
                    <button
                      type="button"
                      onClick={() => setQrModalForm(f)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#8fa66a] text-[#072119] hover:bg-[#e9e1d0]"
                    >
                      <QrCode className="w-3.5 h-3.5" /> QR Code
                    </button>
                  )}

                  {f.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() => handleTransition(f, "PAUSE")}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      title="Pausar"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {f.status === "PAUSED" && (
                    <button
                      type="button"
                      onClick={() => handleTransition(f, "RESUME")}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white"
                      title="Retomar"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(f.status === "ACTIVE" || f.status === "PAUSED") && (
                    <button
                      type="button"
                      onClick={() => handleTransition(f, "CLOSE")}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-red-500/15 text-red-700 dark:text-red-400"
                      title="Encerrar"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleTransition(f, "DUPLICATE")}
                    className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/15"
                    title="Duplicar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(f)}
                    className="p-1.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 ml-auto"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {qrModalForm && (
        <FormQrModal
          title={qrModalForm.title}
          slug={qrModalForm.slug}
          onClose={() => setQrModalForm(null)}
        />
      )}
    </div>
  );
}
