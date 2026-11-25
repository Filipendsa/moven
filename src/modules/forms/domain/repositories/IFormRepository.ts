import { Form } from "../entities/Form";
import { FormAnswersMap, FormResponseRecord } from "../entities/FormTypes";

export interface IFormRepository {
  findById(id: string): Promise<Form | null>;
  findBySlug(slug: string): Promise<Form | null>;
  listAll(): Promise<Form[]>;
  save(form: Form): Promise<void>;
  delete(id: string): Promise<void>;
  submitResponseAtomically(params: {
    formId: string;
    answers: FormAnswersMap;
    deviceHash: string | null;
    locale: string;
  }): Promise<{ responseId: string; newStatus: string; newCount: number }>;
  listResponses(formId: string): Promise<FormResponseRecord[]>;
}
