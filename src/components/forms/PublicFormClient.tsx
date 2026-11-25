"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  PauseCircle,
  Lock,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import { useDictionary } from "@/i18n/DictionaryContext";
import {
  FormQuestion,
  FormStatus,
  FormAnswersMap,
} from "@/modules/forms/domain/entities/FormTypes";

interface PublicFormDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: FormStatus;
  questions: FormQuestion[];
  limitOnePerDevice: boolean;
  thankYouMessage: string;
}

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  const key = "moven_visitor_id";
  let id = localStorage.getItem(key);
  if (!id || id.length < 8) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `mv_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export default function PublicFormClient({ slug }: { slug: string }) {
  const { locale, dict } = useDictionary();
  const t = dict.forms;

  const [form, setForm] = useState<PublicFormDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [answers, setAnswers] = useState<FormAnswersMap>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/forms/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setForm(data.form);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const setAnswer = (qId: string, val: string | string[] | number | null) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const toggleCheckbox = (qId: string, option: string) => {
    const current = Array.isArray(answers[qId]) ? (answers[qId] as string[]) : [];
    if (current.includes(option)) {
      setAnswer(
        qId,
        current.filter((v) => v !== option)
      );
    } else {
      setAnswer(qId, [...current, option]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setErrorMsg(null);
    setSubmitting(true);

    // Resolve "Outro" free-text inputs cleanly
    const finalAnswers: FormAnswersMap = { ...answers };
    for (const q of form.questions) {
      if (q.type === "MULTIPLE_CHOICE" && finalAnswers[q.id] === "__OTHER__") {
        const custom = (otherText[q.id] || "").trim();
        finalAnswers[q.id] = custom ? `Outro: ${custom}` : "";
      }
      if (q.type === "CHECKBOXES" && Array.isArray(finalAnswers[q.id])) {
        const arr = finalAnswers[q.id] as string[];
        if (arr.includes("__OTHER__")) {
          const custom = (otherText[q.id] || "").trim();
          finalAnswers[q.id] = [
            ...arr.filter((v) => v !== "__OTHER__"),
            ...(custom ? [`Outro: ${custom}`] : []),
          ];
        }
      }
    }

    try {
      const res = await fetch(`/api/forms/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: finalAnswers,
          deviceId: getOrCreateDeviceId(),
          locale,
          humanProof: {
            webdriver:
              typeof navigator !== "undefined" ? Boolean(navigator.webdriver) : false,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.submitError);
      }

      setSubmittedMessage(data.thankYouMessage || form.thankYouMessage);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8fa66a]" />
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-16 px-5 flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--card)] p-8 rounded-3xl border border-[var(--terra)]/20 shadow-xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold font-heading">{t.notFoundTitle}</h1>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-[#8fa66a] font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> {t.backHome}
          </Link>
        </div>
      </div>
    );
  }

  if (form.status === "PAUSED" || form.status === "CLOSED") {
    const isPaused = form.status === "PAUSED";
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-16 px-5 flex items-center justify-center">
        <div className="max-w-md w-full bg-[var(--card)] p-8 rounded-3xl border border-[var(--terra)]/20 shadow-xl text-center space-y-4">
          {isPaused ? (
            <PauseCircle className="w-12 h-12 text-amber-500 mx-auto" />
          ) : (
            <Lock className="w-12 h-12 text-red-500 mx-auto" />
          )}
          <h1 className="text-xl font-bold font-heading">{form.title}</h1>
          <p className="text-sm text-[var(--mut)]">
            {isPaused ? t.pausedDesc : t.closedDesc}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-[#8fa66a] font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> {t.backHome}
          </Link>
        </div>
      </div>
    );
  }

  if (submittedMessage) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-16 px-5 flex items-center justify-center">
        <div className="max-w-lg w-full bg-[var(--card)] border-t-4 border-[#8fa66a] p-8 sm:p-10 rounded-3xl border-x border-b border-[var(--terra)]/20 shadow-2xl text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-[#8fa66a] mx-auto" />
          <h1 className="text-2xl font-bold font-heading">{form.title}</h1>
          <p className="text-sm sm:text-base text-[var(--ink)]">
            {submittedMessage}
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-[#8fa66a] font-semibold hover:underline pt-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-10 px-4 sm:px-5">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Card */}
        <div className="bg-[var(--card)] border-t-8 border-[#8fa66a] rounded-3xl border-x border-b border-[var(--terra)]/20 p-6 sm:p-8 shadow-lg space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#8fa66a]">
              MOVEN · Formulário
            </span>
            <span className="text-[11px] text-red-500 font-semibold">
              * {t.requiredNotice}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-sm text-[var(--mut)] leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.questions.map((q) => (
            <div
              key={q.id}
              className="bg-[var(--card)] rounded-2xl border border-[var(--terra)]/20 p-5 sm:p-6 shadow-sm space-y-3"
            >
              <div>
                <label className="block font-heading font-semibold text-sm sm:text-base">
                  {q.title}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {q.description && (
                  <p className="text-xs text-[var(--mut)] mt-0.5">
                    {q.description}
                  </p>
                )}
              </div>

              {(q.type === "SHORT_TEXT" ||
                q.type === "EMAIL" ||
                q.type === "PHONE" ||
                q.type === "DATE") && (
                <input
                  type={
                    q.type === "EMAIL"
                      ? "email"
                      : q.type === "PHONE"
                      ? "tel"
                      : q.type === "DATE"
                      ? "date"
                      : "text"
                  }
                  required={q.required}
                  placeholder={t.shortAnswerPlaceholder}
                  value={String(answers[q.id] || "")}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
                />
              )}

              {q.type === "PARAGRAPH" && (
                <textarea
                  rows={4}
                  required={q.required}
                  placeholder={t.paragraphPlaceholder}
                  value={String(answers[q.id] || "")}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
                />
              )}

              {q.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  {(q.options || []).map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-sm"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        required={q.required}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswer(q.id, opt)}
                        className="accent-[#8fa66a] w-4 h-4"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                  {q.allowOther && (
                    <div className="flex items-center gap-2 p-2.5">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === "__OTHER__"}
                        onChange={() => setAnswer(q.id, "__OTHER__")}
                        className="accent-[#8fa66a] w-4 h-4"
                      />
                      <span className="text-sm">{t.otherLabel}:</span>
                      <input
                        type="text"
                        value={otherText[q.id] || ""}
                        onFocus={() => setAnswer(q.id, "__OTHER__")}
                        onChange={(e) => {
                          setAnswer(q.id, "__OTHER__");
                          setOtherText((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }));
                        }}
                        className="flex-1 bg-transparent border-b border-black/20 dark:border-white/20 px-2 py-1 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
                      />
                    </div>
                  )}
                </div>
              )}

              {q.type === "CHECKBOXES" && (
                <div className="space-y-2">
                  {(q.options || []).map((opt) => {
                    const checked =
                      Array.isArray(answers[q.id]) &&
                      (answers[q.id] as string[]).includes(opt);
                    return (
                      <label
                        key={opt}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheckbox(q.id, opt)}
                          className="accent-[#8fa66a] w-4 h-4 rounded"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                  {q.allowOther && (
                    <div className="flex items-center gap-2 p-2.5">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(answers[q.id]) &&
                          (answers[q.id] as string[]).includes("__OTHER__")
                        }
                        onChange={() => toggleCheckbox(q.id, "__OTHER__")}
                        className="accent-[#8fa66a] w-4 h-4 rounded"
                      />
                      <span className="text-sm">{t.otherLabel}:</span>
                      <input
                        type="text"
                        value={otherText[q.id] || ""}
                        onChange={(e) =>
                          setOtherText((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        className="flex-1 bg-transparent border-b border-black/20 dark:border-white/20 px-2 py-1 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
                      />
                    </div>
                  )}
                </div>
              )}

              {q.type === "DROPDOWN" && (
                <select
                  required={q.required}
                  value={String(answers[q.id] || "")}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#8fa66a]"
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {(q.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {q.type === "LINEAR_SCALE" && (
                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {Array.from(
                      { length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 },
                      (_, i) => (q.scaleMin ?? 1) + i
                    ).map((val) => {
                      const active = answers[q.id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAnswer(q.id, val)}
                          className={`min-w-[44px] min-h-[44px] rounded-full border-2 font-heading font-bold text-sm transition-all ${
                            active
                              ? "bg-[#8fa66a] border-[#8fa66a] text-[#072119]"
                              : "border-black/15 dark:border-white/15 hover:border-[#8fa66a]"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  {(q.scaleMinLabel || q.scaleMaxLabel) && (
                    <div className="flex justify-between text-xs text-[var(--mut)]">
                      <span>{q.scaleMinLabel || ""}</span>
                      <span>{q.scaleMaxLabel || ""}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#8fa66a] hover:bg-[#8fa66a]/90 text-[#072119] font-heading font-bold px-8 py-3.5 rounded-full transition-colors inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t.submit}
                </>
              )}
            </button>

            <Link
              href={`/${locale}`}
              className="text-xs text-[var(--mut)] hover:text-[var(--ink)]"
            >
              {t.backHome}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
