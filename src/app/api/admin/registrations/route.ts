import { NextResponse } from "next/server";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";
import { SupabaseEventOfferingRepository } from "@/modules/mission-catalog/infrastructure/SupabaseEventOfferingRepository";
import { SupabaseMissionRepository } from "@/modules/mission-catalog/infrastructure/SupabaseMissionRepository";
import { ExportRegistrationsCsvUseCase } from "@/modules/enrollment/application/use-cases/ExportRegistrationsCsvUseCase";
import { AdminUpdateRegistrationUseCase } from "@/modules/enrollment/application/use-cases/AdminUpdateRegistrationUseCase";
import { PaymentStatus } from "@/modules/enrollment/domain/entities/Registration";
import { ModalityType } from "@/modules/enrollment/domain/value-objects/EnrollmentModality";

const registrationRepo = new SupabaseRegistrationRepository();
const offeringRepo = new SupabaseEventOfferingRepository();
const missionRepo = new SupabaseMissionRepository();

const exportCsvUseCase = new ExportRegistrationsCsvUseCase(registrationRepo);
const adminUpdateUseCase = new AdminUpdateRegistrationUseCase(
  registrationRepo,
  offeringRepo,
  missionRepo
);

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
    const modality = (searchParams.get("modality") as ModalityType) || undefined;
    const status = (searchParams.get("status") as PaymentStatus) || undefined;
    const missionId = searchParams.get("missionId") || undefined;

    const [list, metrics, allMissions] = await Promise.all([
      registrationRepo.list({
        search,
        modality,
        status,
        missionId,
      }),
      registrationRepo.getMetrics(),
      missionRepo.listAll(),
    ]);

    const missionTitleMap = new Map(allMissions.map((m) => [m.id, m.title]));

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
      shirtSize: r.shirtSize.value,
      modality: r.modality.type,
      modalityTitle: r.modality.title,
      missionId: r.missionId || null,
      missionTitle: r.missionId ? missionTitleMap.get(r.missionId) || null : null,
      amountCents: r.amount.amountCents,
      amountFormatted: r.amount.formatted,
      originalAmountCents: r.originalAmount?.amountCents || null,
      discountCents: r.discountCents,
      couponCode: r.couponCode || null,
      paymentProvider: r.paymentProvider,
      paymentStatus: r.paymentStatus,
      externalTxId: r.externalTxId || null,
      createdAt: r.createdAt.toISOString(),
      termsAcceptedAt: r.lgpdConsent.acceptedAt.toISOString(),
    }));

    return NextResponse.json({ registrations, metrics });
  } catch (err: unknown) {
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
    const { id, status, shirtSize, modality, missionId } = body;

    if (!id || (!status && !shirtSize && !modality && missionId === undefined)) {
      return NextResponse.json(
        { error: "ID e ao menos um campo para atualização são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await adminUpdateUseCase.execute({
      id,
      status,
      shirtSize,
      modality,
      missionId,
    });

    if (!result.success) {
      const isNotFound = result.error.message.includes("não encontrada");
      return NextResponse.json(
        { error: result.error.message },
        { status: isNotFound ? 404 : 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("API /api/admin/registrations PATCH error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar inscrição." },
      { status: 500 }
    );
  }
}
