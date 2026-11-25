import { NextResponse } from "next/server";
import { SupabaseFormRepository } from "@/modules/forms/infrastructure/persistence/SupabaseFormRepository";
import {
  ManageFormsUseCase,
  FormLifecycleAction,
} from "@/modules/forms/application/use-cases/ManageFormsUseCase";
import { serializeForm } from "../route";

const formRepo = new SupabaseFormRepository();
const manageForms = new ManageFormsUseCase(formRepo);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const form = await formRepo.findById(id);
    if (!form) {
      return NextResponse.json(
        { error: "Formulário não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json({ form: serializeForm(form) });
  } catch (err) {
    console.error("GET /api/admin/forms/[id] error:", err);
    return NextResponse.json(
      { error: "Erro ao carregar formulário." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.action) {
      const result = await manageForms.transition(
        id,
        body.action as FormLifecycleAction
      );
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }
      return NextResponse.json({ form: serializeForm(result.value) });
    }

    const result = await manageForms.updateContent(id, {
      title: body.title,
      description: body.description,
      questions: body.questions,
      settings: body.settings,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ form: serializeForm(result.value) });
  } catch (err) {
    console.error("PATCH /api/admin/forms/[id] error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar formulário." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await manageForms.delete(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/forms/[id] error:", err);
    return NextResponse.json(
      { error: "Erro ao excluir formulário." },
      { status: 500 }
    );
  }
}
