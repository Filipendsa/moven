import { IFormRepository } from "../../domain/repositories/IFormRepository";
import { Form } from "../../domain/entities/Form";
import {
  FormAnswersMap,
  FormQuestion,
  FormResponseRecord,
  FormSettings,
  FormStatus,
} from "../../domain/entities/FormTypes";
import { supabaseServer } from "@/shared/infrastructure/supabase/server";
import { publicEnv } from "@/shared/config/env";
import crypto from "crypto";

interface FormPersistenceRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  questions: FormQuestion[];
  settings: FormSettings;
  response_count: number;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FormResponsePersistenceRow {
  id: string;
  form_id: string;
  answers: FormAnswersMap;
  device_hash: string | null;
  locale: string;
  submitted_at: string;
}

export class SupabaseFormRepository implements IFormRepository {
  private static formStore = new Map<string, FormPersistenceRow>();
  private static responseStore = new Map<string, FormResponsePersistenceRow[]>();

  private toRow(form: Form): FormPersistenceRow {
    return {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description || null,
      status: form.status,
      questions: form.questions,
      settings: form.settings,
      response_count: form.responseCount,
      published_at: form.publishedAt ? form.publishedAt.toISOString() : null,
      closed_at: form.closedAt ? form.closedAt.toISOString() : null,
      created_at: form.createdAt.toISOString(),
      updated_at: form.updatedAt.toISOString(),
    };
  }

  private toDomain(row: FormPersistenceRow): Form {
    return Form.reconstitute(
      {
        slug: row.slug,
        title: row.title,
        description: row.description || undefined,
        status: row.status as FormStatus,
        questions: Array.isArray(row.questions) ? row.questions : [],
        settings: {
          limitOnePerDevice: Boolean(row.settings?.limitOnePerDevice),
          maxResponses:
            row.settings?.maxResponses !== undefined
              ? row.settings.maxResponses
              : null,
          closesAt: row.settings?.closesAt || null,
          thankYouMessage:
            row.settings?.thankYouMessage ||
            "Obrigado por responder! Sua resposta foi registrada com sucesso.",
        },
        responseCount: row.response_count ?? 0,
        publishedAt: row.published_at ? new Date(row.published_at) : undefined,
        closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );
  }

  async findById(id: string): Promise<Form | null> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("forms")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return this.toDomain(data as FormPersistenceRow);
        }
      } catch (err) {
        console.warn("SupabaseFormRepository.findById fallback:", err);
      }
    }

    const row = SupabaseFormRepository.formStore.get(id);
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Form | null> {
    const cleanSlug = slug.trim().toLowerCase();

    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("forms")
          .select("*")
          .eq("slug", cleanSlug)
          .maybeSingle();

        if (!error && data) {
          return this.toDomain(data as FormPersistenceRow);
        }
      } catch (err) {
        console.warn("SupabaseFormRepository.findBySlug fallback:", err);
      }
    }

    for (const row of SupabaseFormRepository.formStore.values()) {
      if (row.slug === cleanSlug) return this.toDomain(row);
    }
    return null;
  }

  async listAll(): Promise<Form[]> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("forms")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return (data as FormPersistenceRow[]).map((r) => this.toDomain(r));
        }
      } catch (err) {
        console.warn("SupabaseFormRepository.listAll fallback:", err);
      }
    }

    return Array.from(SupabaseFormRepository.formStore.values())
      .map((r) => this.toDomain(r))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async save(form: Form): Promise<void> {
    const row = this.toRow(form);
    SupabaseFormRepository.formStore.set(row.id, row);

    if (publicEnv.isSupabaseConfigured) {
      try {
        const { error } = await supabaseServer.from("forms").upsert(row);
        if (error) {
          console.warn("SupabaseFormRepository.save fallback:", error.message);
        }
      } catch (err) {
        console.warn("SupabaseFormRepository.save error:", err);
      }
    }
  }

  async delete(id: string): Promise<void> {
    SupabaseFormRepository.formStore.delete(id);
    SupabaseFormRepository.responseStore.delete(id);

    if (publicEnv.isSupabaseConfigured) {
      try {
        await supabaseServer.from("forms").delete().eq("id", id);
      } catch (err) {
        console.warn("SupabaseFormRepository.delete error:", err);
      }
    }
  }

  async submitResponseAtomically(params: {
    formId: string;
    answers: FormAnswersMap;
    deviceHash: string | null;
    locale: string;
  }): Promise<{ responseId: string; newStatus: string; newCount: number }> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer.rpc(
          "submit_form_response",
          {
            p_form_id: params.formId,
            p_answers: params.answers,
            p_device_hash: params.deviceHash,
            p_locale: params.locale,
          }
        );

        if (error) {
          if (error.message.includes("form_responses_form_device_uidx") || error.code === "23505") {
            throw new Error("DUPLICATE_DEVICE");
          }
          if (error.message.includes("FORM_NOT_ACTIVE")) {
            throw new Error("FORM_NOT_ACTIVE");
          }
          if (error.message.includes("FORM_CLOSED") || error.message.includes("FORM_LIMIT_REACHED")) {
            throw new Error("FORM_CLOSED");
          }
          throw new Error(error.message);
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          return {
            responseId: row.response_id,
            newStatus: row.new_status,
            newCount: row.new_count,
          };
        }
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message === "DUPLICATE_DEVICE" ||
            err.message === "FORM_NOT_ACTIVE" ||
            err.message === "FORM_CLOSED")
        ) {
          throw err;
        }
        console.warn("submitResponseAtomically fallback:", err);
      }
    }

    // In-memory fallback
    const formRow = SupabaseFormRepository.formStore.get(params.formId);
    if (!formRow) throw new Error("FORM_NOT_FOUND");
    if (formRow.status !== "ACTIVE") throw new Error("FORM_NOT_ACTIVE");

    const existing = SupabaseFormRepository.responseStore.get(params.formId) || [];
    if (
      params.deviceHash &&
      existing.some((r) => r.device_hash === params.deviceHash)
    ) {
      throw new Error("DUPLICATE_DEVICE");
    }

    const respId = crypto.randomUUID();
    existing.unshift({
      id: respId,
      form_id: params.formId,
      answers: params.answers,
      device_hash: params.deviceHash,
      locale: params.locale,
      submitted_at: new Date().toISOString(),
    });
    SupabaseFormRepository.responseStore.set(params.formId, existing);

    formRow.response_count += 1;
    const maxResp = formRow.settings?.maxResponses;
    if (maxResp && formRow.response_count >= maxResp) {
      formRow.status = "CLOSED";
      formRow.closed_at = new Date().toISOString();
    }
    formRow.updated_at = new Date().toISOString();
    SupabaseFormRepository.formStore.set(formRow.id, formRow);

    return {
      responseId: respId,
      newStatus: formRow.status,
      newCount: formRow.response_count,
    };
  }

  async listResponses(formId: string): Promise<FormResponseRecord[]> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("form_responses")
          .select("*")
          .eq("form_id", formId)
          .order("submitted_at", { ascending: false });

        if (!error && data) {
          return (data as FormResponsePersistenceRow[]).map((r) => ({
            id: r.id,
            formId: r.form_id,
            answers: r.answers || {},
            deviceHash: r.device_hash,
            locale: r.locale || "pt",
            submittedAt: new Date(r.submitted_at),
          }));
        }
      } catch (err) {
        console.warn("SupabaseFormRepository.listResponses fallback:", err);
      }
    }

    const mem = SupabaseFormRepository.responseStore.get(formId) || [];
    return mem.map((r) => ({
      id: r.id,
      formId: r.form_id,
      answers: r.answers || {},
      deviceHash: r.device_hash,
      locale: r.locale || "pt",
      submittedAt: new Date(r.submitted_at),
    }));
  }
}
