import { Entity } from "@/shared/domain/Entity";
import { Result } from "@/shared/domain/Result";
import {
  FormStatus,
  FormQuestion,
  FormSettings,
  FormAnswersMap,
  FormResponseRecord,
  QuestionSummary,
} from "./FormTypes";

export interface FormProps {
  slug: string;
  title: string;
  description?: string;
  status: FormStatus;
  questions: FormQuestion[];
  settings: FormSettings;
  responseCount: number;
  publishedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_THANK_YOU =
  "Obrigado por responder! Sua resposta foi registrada com sucesso.";

export class Form extends Entity<FormProps> {
  private constructor(props: FormProps, id?: string) {
    super(props, id);
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): FormStatus {
    return this.props.status;
  }

  get questions(): FormQuestion[] {
    return this.props.questions;
  }

  get settings(): FormSettings {
    return this.props.settings;
  }

  get responseCount(): number {
    return this.props.responseCount;
  }

  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public isEffectivelyClosed(now: Date = new Date()): boolean {
    if (this.props.status === "CLOSED") return true;
    if (this.props.settings.closesAt) {
      const closes = new Date(this.props.settings.closesAt);
      if (!Number.isNaN(closes.getTime()) && closes.getTime() <= now.getTime()) {
        return true;
      }
    }
    if (
      this.props.settings.maxResponses !== null &&
      this.props.responseCount >= this.props.settings.maxResponses
    ) {
      return true;
    }
    return false;
  }

  public publish(): Result<void, Error> {
    if (this.props.questions.length === 0) {
      return Result.fail(
        new Error("Adicione pelo menos uma pergunta antes de publicar o formulário.")
      );
    }
    this.props.status = "ACTIVE";
    if (!this.props.publishedAt) {
      this.props.publishedAt = new Date();
    }
    this.props.closedAt = undefined;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public pause(): Result<void, Error> {
    if (this.props.status !== "ACTIVE") {
      return Result.fail(
        new Error("Apenas formulários ativos podem ser pausados.")
      );
    }
    this.props.status = "PAUSED";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public resume(): Result<void, Error> {
    if (this.props.status !== "PAUSED") {
      return Result.fail(
        new Error("Apenas formulários pausados podem ser retomados.")
      );
    }
    this.props.status = "ACTIVE";
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public close(): Result<void, Error> {
    if (this.props.status === "DRAFT") {
      return Result.fail(
        new Error("Publique o formulário antes de encerrá-lo.")
      );
    }
    this.props.status = "CLOSED";
    this.props.closedAt = new Date();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public reopen(): Result<void, Error> {
    if (this.props.status !== "CLOSED") {
      return Result.fail(
        new Error("Apenas formulários encerrados podem ser reabertos.")
      );
    }
    this.props.status = "ACTIVE";
    this.props.closedAt = undefined;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateContent(params: {
    title?: string;
    description?: string;
    questions?: FormQuestion[];
    settings?: Partial<FormSettings>;
  }): Result<void, Error> {
    if (params.title !== undefined) {
      const cleanTitle = params.title.trim();
      if (cleanTitle.length < 2) {
        return Result.fail(
          new Error("O título do formulário deve ter pelo menos 2 caracteres.")
        );
      }
      this.props.title = cleanTitle;
    }

    if (params.description !== undefined) {
      this.props.description = params.description.trim() || undefined;
    }

    if (params.questions !== undefined) {
      // Protect existing responses: cannot delete or change type of answered questions once responseCount > 0
      if (this.props.responseCount > 0) {
        const nextMap = new Map(params.questions.map((q) => [q.id, q]));
        for (const existingQ of this.props.questions) {
          const updatedQ = nextMap.get(existingQ.id);
          if (!updatedQ) {
            return Result.fail(
              new Error(
                `Não é possível excluir a pergunta "${existingQ.title}" após receber respostas.`
              )
            );
          }
          if (updatedQ.type !== existingQ.type) {
            return Result.fail(
              new Error(
                `Não é possível alterar o tipo da pergunta "${existingQ.title}" após receber respostas.`
              )
            );
          }
        }
      }

      const validated = Form.validateQuestions(params.questions);
      if (!validated.success) return Result.fail(validated.error);
      this.props.questions = validated.value;
    }

    if (params.settings !== undefined) {
      this.props.settings = {
        ...this.props.settings,
        ...params.settings,
        thankYouMessage:
          params.settings.thankYouMessage?.trim() ||
          this.props.settings.thankYouMessage ||
          DEFAULT_THANK_YOU,
      };
    }

    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public validateSubmission(rawAnswers: FormAnswersMap): Result<FormAnswersMap, Error> {
    const sanitized: FormAnswersMap = {};

    for (const q of this.props.questions) {
      if (q.type === "SECTION_BREAK") continue;
      const raw = rawAnswers[q.id];

      if (q.type === "CHECKBOXES") {
        const arr = Array.isArray(raw)
          ? raw.map((v) => String(v).trim()).filter(Boolean)
          : [];
        if (q.required && arr.length === 0) {
          return Result.fail(
            new Error(`A pergunta "${q.title}" é obrigatória.`)
          );
        }
        sanitized[q.id] = arr;
        continue;
      }

      if (q.type === "LINEAR_SCALE") {
        const min = q.scaleMin ?? 1;
        const max = q.scaleMax ?? 5;
        if (raw === undefined || raw === null || raw === "") {
          if (q.required) {
            return Result.fail(
              new Error(`A pergunta "${q.title}" é obrigatória.`)
            );
          }
          sanitized[q.id] = null;
          continue;
        }
        const num = Number(raw);
        if (!Number.isFinite(num) || num < min || num > max) {
          return Result.fail(
            new Error(`Selecione um valor entre ${min} e ${max} em "${q.title}".`)
          );
        }
        sanitized[q.id] = num;
        continue;
      }

      const strVal = raw !== undefined && raw !== null ? String(raw).trim() : "";
      if (q.required && !strVal) {
        return Result.fail(new Error(`A pergunta "${q.title}" é obrigatória.`));
      }

      if (strVal && q.type === "EMAIL") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
          return Result.fail(
            new Error(`Informe um e-mail válido em "${q.title}".`)
          );
        }
      }

      if (strVal && q.type === "PHONE") {
        const digits = strVal.replace(/\D/g, "");
        if (digits.length < 8) {
          return Result.fail(
            new Error(`Informe um telefone válido em "${q.title}".`)
          );
        }
      }

      sanitized[q.id] = strVal;
    }

    return Result.ok(sanitized);
  }

  public computeSummaries(responses: FormResponseRecord[]): QuestionSummary[] {
    return this.props.questions
      .filter((q) => q.type !== "SECTION_BREAK")
      .map((q) => {
      if (
        q.type === "MULTIPLE_CHOICE" ||
        q.type === "DROPDOWN" ||
        q.type === "CHECKBOXES"
      ) {
        const counts = new Map<string, number>();
        for (const opt of q.options || []) {
          counts.set(opt, 0);
        }

        let totalAnswered = 0;
        for (const r of responses) {
          const val = r.answers[q.id];
          if (q.type === "CHECKBOXES") {
            const arr = Array.isArray(val) ? val : [];
            if (arr.length > 0) totalAnswered += 1;
            for (const item of arr) {
              counts.set(item, (counts.get(item) || 0) + 1);
            }
          } else {
            const str = typeof val === "string" ? val.trim() : "";
            if (str) {
              totalAnswered += 1;
              counts.set(str, (counts.get(str) || 0) + 1);
            }
          }
        }

        const optionCounts = Array.from(counts.entries()).map(
          ([label, count]) => ({
            label,
            count,
            percentage:
              totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0,
          })
        );

        const correctCount =
          q.isQuiz && q.correctOption ? counts.get(q.correctOption) || 0 : 0;
        const correctPercentage =
          q.isQuiz && q.correctOption && totalAnswered > 0
            ? Math.round((correctCount / totalAnswered) * 100)
            : undefined;

        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          totalAnswers: totalAnswered,
          correctOption: q.isQuiz ? q.correctOption : undefined,
          correctPercentage,
          optionCounts,
        };
      }

      if (q.type === "LINEAR_SCALE") {
        const min = q.scaleMin ?? 1;
        const max = q.scaleMax ?? 5;
        const dist = new Map<number, number>();
        for (let v = min; v <= max; v++) dist.set(v, 0);

        let sum = 0;
        let count = 0;
        for (const r of responses) {
          const raw = r.answers[q.id];
          if (typeof raw === "number" && Number.isFinite(raw)) {
            count += 1;
            sum += raw;
            dist.set(raw, (dist.get(raw) || 0) + 1);
          }
        }

        return {
          questionId: q.id,
          title: q.title,
          type: q.type,
          totalAnswers: count,
          scaleAverage: count > 0 ? Number((sum / count).toFixed(2)) : 0,
          scaleDistribution: Array.from(dist.entries()).map(([value, c]) => ({
            value,
            count: c,
            percentage: count > 0 ? Math.round((c / count) * 100) : 0,
          })),
        };
      }

      const textResponses: string[] = [];
      for (const r of responses) {
        const val = r.answers[q.id];
        if (typeof val === "string" && val.trim()) {
          textResponses.push(val.trim());
        }
      }

      return {
        questionId: q.id,
        title: q.title,
        type: q.type,
        totalAnswers: textResponses.length,
        textResponses,
      };
    });
  }

  public static generateShortSlug(): string {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let slug = "";
    for (let i = 0; i < 6; i++) {
      slug += chars[Math.floor(Math.random() * chars.length)];
    }
    return slug;
  }

  private static validateQuestions(
    questions: FormQuestion[]
  ): Result<FormQuestion[], Error> {
    const cleaned: FormQuestion[] = [];
    for (const q of questions) {
      const title = (q.title || "").trim();
      if (!title) {
        return Result.fail(
          new Error("Todas as perguntas precisam ter um título.")
        );
      }

      const needsOptions =
        q.type === "MULTIPLE_CHOICE" ||
        q.type === "CHECKBOXES" ||
        q.type === "DROPDOWN";

      const cleanOptions = needsOptions
        ? (q.options || []).map((o) => o.trim()).filter(Boolean)
        : undefined;

      if (needsOptions && (!cleanOptions || cleanOptions.length === 0)) {
        return Result.fail(
          new Error(`A pergunta "${title}" precisa de pelo menos uma opção.`)
        );
      }

      cleaned.push({
        id: q.id,
        type: q.type,
        title,
        description: q.description?.trim() || undefined,
        required: q.type === "SECTION_BREAK" ? false : Boolean(q.required),
        options: cleanOptions,
        allowOther: Boolean(q.allowOther),
        isQuiz: q.type === "MULTIPLE_CHOICE" ? Boolean(q.isQuiz) : false,
        correctOption:
          q.type === "MULTIPLE_CHOICE" && q.isQuiz
            ? q.correctOption?.trim() || undefined
            : undefined,
        explanation:
          q.type === "MULTIPLE_CHOICE" && q.isQuiz
            ? q.explanation?.trim() || undefined
            : undefined,
        lockOnSelect:
          q.type === "MULTIPLE_CHOICE" && q.isQuiz
            ? q.lockOnSelect !== false
            : undefined,
        scaleMin: q.type === "LINEAR_SCALE" ? q.scaleMin ?? 1 : undefined,
        scaleMax: q.type === "LINEAR_SCALE" ? q.scaleMax ?? 5 : undefined,
        scaleMinLabel:
          q.type === "LINEAR_SCALE" ? q.scaleMinLabel?.trim() || undefined : undefined,
        scaleMaxLabel:
          q.type === "LINEAR_SCALE" ? q.scaleMaxLabel?.trim() || undefined : undefined,
      });
    }
    return Result.ok(cleaned);
  }

  public static create(input: {
    title: string;
    description?: string;
    questions?: FormQuestion[];
    settings?: Partial<FormSettings>;
    slug?: string;
  }): Result<Form, Error> {
    const title = (input.title || "").trim();
    if (title.length < 2) {
      return Result.fail(
        new Error("O título do formulário deve ter pelo menos 2 caracteres.")
      );
    }

    const questionsResult = this.validateQuestions(input.questions || []);
    if (!questionsResult.success) {
      return Result.fail(questionsResult.error);
    }

    const now = new Date();
    return Result.ok(
      new Form({
        slug: input.slug || this.generateShortSlug(),
        title,
        description: input.description?.trim() || undefined,
        status: "DRAFT",
        questions: questionsResult.value,
        settings: {
          limitOnePerDevice: Boolean(input.settings?.limitOnePerDevice),
          maxResponses:
            input.settings?.maxResponses && input.settings.maxResponses > 0
              ? Math.floor(input.settings.maxResponses)
              : null,
          closesAt: input.settings?.closesAt || null,
          thankYouMessage:
            input.settings?.thankYouMessage?.trim() || DEFAULT_THANK_YOU,
        },
        responseCount: 0,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  public static reconstitute(props: FormProps, id: string): Form {
    return new Form(props, id);
  }
}
