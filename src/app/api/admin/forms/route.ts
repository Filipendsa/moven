import { NextResponse } from "next/server";
import { SupabaseFormRepository } from "@/modules/forms/infrastructure/persistence/SupabaseFormRepository";
import { ManageFormsUseCase } from "@/modules/forms/application/use-cases/ManageFormsUseCase";

const formRepo = new SupabaseFormRepository();
const manageForms = new ManageFormsUseCase(formRepo);

export function serializeForm(form: import("@/modules/forms/domain/entities/Form").Form) {
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description || "",
    status: form.status,
    questions: form.questions,
    settings: form.settings,
    responseCount: form.responseCount,
    publishedAt: form.publishedAt ? form.publishedAt.toISOString() : null,
    closedAt: form.closedAt ? form.closedAt.toISOString() : null,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const forms = await formRepo.listAll();
    return NextResponse.json({
      forms: forms.map(serializeForm),
    });
  } catch (err) {
    console.error("GET /api/admin/forms error:", err);
    return NextResponse.json(
      { error: "Erro ao listar formulários." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await manageForms.create({
      title: String(body.title || "Novo Formulário"),
      description: body.description ? String(body.description) : undefined,
      questions: Array.isArray(body.questions) ? body.questions : [],
      settings: body.settings || {},
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { form: serializeForm(result.value) },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/admin/forms error:", err);
    return NextResponse.json(
      { error: "Erro ao criar formulário." },
      { status: 500 }
    );
  }
}
