import { NextResponse } from "next/server";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";
import { ExportRegistrationsCsvUseCase } from "@/modules/enrollment/application/use-cases/ExportRegistrationsCsvUseCase";

const registrationRepo = new SupabaseRegistrationRepository();
const exportCsvUseCase = new ExportRegistrationsCsvUseCase(registrationRepo);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "csv") {
      const csvData = await exportCsvUseCase.execute();
      return new Response(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="inscricoes_moven_${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    const search = searchParams.get("search") || undefined;
    const modality = (searchParams.get("modality") as any) || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    const list = await registrationRepo.list({ search, modality, status });
    const metrics = await registrationRepo.getMetrics();

    const registrations = list.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email.value,
      phone: r.phone.digits,
      phoneFormatted: r.phone.formatted,
      whatsAppUrl: r.phone.toWhatsAppUrl(
        `Olá ${r.fullName.split(" ")[0]}! Falamos da liderança do MOVEN a respeito da sua inscrição na ${r.modality.title}.`
      ),
      cpf: r.cpf.formatted,
      modality: r.modality.type,
      modalityTitle: r.modality.title,
      amountCents: r.amount.amountCents,
      amountFormatted: r.amount.formatted,
      paymentProvider: r.paymentProvider,
      paymentStatus: r.paymentStatus,
      externalTxId: r.externalTxId || null,
      createdAt: r.createdAt.toISOString(),
      termsAcceptedAt: r.lgpdConsent.acceptedAt.toISOString(),
    }));

    return NextResponse.json({ registrations, metrics });
  } catch (err: any) {
    console.error("API /api/admin/registrations error:", err);
    return NextResponse.json(
      { error: "Erro ao buscar dados administrativos." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID e novo status são obrigatórios." },
        { status: 400 }
      );
    }

    await registrationRepo.updateStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API /api/admin/registrations PATCH error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar status." },
      { status: 500 }
    );
  }
}

