import { NextResponse } from "next/server";
import { SupabaseFormRepository } from "@/modules/forms/infrastructure/persistence/SupabaseFormRepository";
import { ExportFormResponsesCsvUseCase } from "@/modules/forms/application/use-cases/ExportFormResponsesCsvUseCase";
import { serializeForm } from "../../route";

const formRepo = new SupabaseFormRepository();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const form = await formRepo.findById(id);
    if (!form) {
      return NextResponse.json(
        { error: "Formulário não encontrado." },
        { status: 404 }
      );
    }

    const responses = await formRepo.listResponses(id);

    if (action === "csv") {
      const csv = ExportFormResponsesCsvUseCase.execute(form, responses);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="respostas_${form.slug}_${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    const summaries = form.computeSummaries(responses);

    return NextResponse.json({
      form: serializeForm(form),
      responses: responses.map((r) => ({
        id: r.id,
        answers: r.answers,
        locale: r.locale,
        submittedAt: r.submittedAt.toISOString(),
      })),
      summaries,
    });
  } catch (err) {
    console.error("GET /api/admin/forms/[id]/responses error:", err);
    return NextResponse.json(
      { error: "Erro ao carregar respostas do formulário." },
      { status: 500 }
    );
  }
}
