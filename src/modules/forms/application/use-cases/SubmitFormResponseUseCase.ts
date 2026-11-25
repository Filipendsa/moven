import { Result } from "@/shared/domain/Result";
import { IFormRepository } from "../../domain/repositories/IFormRepository";
import { FormAnswersMap } from "../../domain/entities/FormTypes";

export class SubmitFormResponseUseCase {
  constructor(private formRepo: IFormRepository) {}

  async execute(input: {
    slug: string;
    answers: FormAnswersMap;
    deviceHash: string | null;
    locale: string;
  }): Promise<Result<{ responseId: string; thankYouMessage: string }, Error>> {
    const form = await this.formRepo.findBySlug(input.slug);
    if (!form) {
      return Result.fail(new Error("Formulário não encontrado."));
    }

    if (form.status === "DRAFT") {
      return Result.fail(new Error("Este formulário ainda não foi publicado."));
    }

    if (form.status === "PAUSED") {
      return Result.fail(new Error("Formulário temporariamente pausado."));
    }

    if (form.isEffectivelyClosed()) {
      return Result.fail(new Error("Este formulário não aceita mais respostas."));
    }

    const validated = form.validateSubmission(input.answers || {});
    if (!validated.success) {
      return Result.fail(validated.error);
    }

    const deviceHashToStore = form.settings.limitOnePerDevice
      ? input.deviceHash
      : null;

    try {
      const res = await this.formRepo.submitResponseAtomically({
        formId: form.id,
        answers: validated.value,
        deviceHash: deviceHashToStore,
        locale: input.locale || "pt",
      });

      return Result.ok({
        responseId: res.responseId,
        thankYouMessage: form.settings.thankYouMessage,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "DUPLICATE_DEVICE") {
        return Result.fail(
          new Error("Você já respondeu este formulário neste aparelho.")
        );
      }
      if (msg === "FORM_NOT_ACTIVE") {
        return Result.fail(new Error("Formulário temporariamente pausado."));
      }
      if (msg === "FORM_CLOSED") {
        return Result.fail(
          new Error("Este formulário não aceita mais respostas.")
        );
      }
      return Result.fail(new Error("Erro ao registrar resposta."));
    }
  }
}
