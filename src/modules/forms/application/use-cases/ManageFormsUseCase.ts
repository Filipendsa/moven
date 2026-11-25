import { Result } from "@/shared/domain/Result";
import { IFormRepository } from "../../domain/repositories/IFormRepository";
import { Form } from "../../domain/entities/Form";
import { FormQuestion, FormSettings } from "../../domain/entities/FormTypes";

export type FormLifecycleAction =
  | "PUBLISH"
  | "PAUSE"
  | "RESUME"
  | "CLOSE"
  | "REOPEN"
  | "DUPLICATE";

export class ManageFormsUseCase {
  constructor(private formRepo: IFormRepository) {}

  async create(input: {
    title: string;
    description?: string;
    questions?: FormQuestion[];
    settings?: Partial<FormSettings>;
  }): Promise<Result<Form, Error>> {
    let slug = Form.generateShortSlug();
    for (let i = 0; i < 5; i++) {
      const existing = await this.formRepo.findBySlug(slug);
      if (!existing) break;
      slug = Form.generateShortSlug();
    }

    const result = Form.create({
      title: input.title,
      description: input.description,
      questions: input.questions,
      settings: input.settings,
      slug,
    });

    if (!result.success) return Result.fail(result.error);

    await this.formRepo.save(result.value);
    return Result.ok(result.value);
  }

  async updateContent(
    id: string,
    input: {
      title?: string;
      description?: string;
      questions?: FormQuestion[];
      settings?: Partial<FormSettings>;
    }
  ): Promise<Result<Form, Error>> {
    const form = await this.formRepo.findById(id);
    if (!form) return Result.fail(new Error("Formulário não encontrado."));

    const updateResult = form.updateContent(input);
    if (!updateResult.success) return Result.fail(updateResult.error);

    await this.formRepo.save(form);
    return Result.ok(form);
  }

  async transition(
    id: string,
    action: FormLifecycleAction
  ): Promise<Result<Form, Error>> {
    const form = await this.formRepo.findById(id);
    if (!form) return Result.fail(new Error("Formulário não encontrado."));

    if (action === "DUPLICATE") {
      return this.create({
        title: `${form.title} (Cópia)`,
        description: form.description,
        questions: form.questions,
        settings: form.settings,
      });
    }

    let op: Result<void, Error>;
    switch (action) {
      case "PUBLISH":
        op = form.publish();
        break;
      case "PAUSE":
        op = form.pause();
        break;
      case "RESUME":
        op = form.resume();
        break;
      case "CLOSE":
        op = form.close();
        break;
      case "REOPEN":
        op = form.reopen();
        break;
    }

    if (!op.success) return Result.fail(op.error);

    await this.formRepo.save(form);
    return Result.ok(form);
  }

  async delete(id: string): Promise<Result<void, Error>> {
    const form = await this.formRepo.findById(id);
    if (!form) return Result.fail(new Error("Formulário não encontrado."));

    await this.formRepo.delete(id);
    return Result.ok(undefined);
  }
}
