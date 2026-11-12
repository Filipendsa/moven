import { NextResponse } from "next/server";
import { EnrollParticipantUseCase } from "@/modules/enrollment/application/use-cases/EnrollParticipantUseCase";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";
import { SupabaseEventOfferingRepository } from "@/modules/mission-catalog/infrastructure/SupabaseEventOfferingRepository";
import { SupabaseMissionRepository } from "@/modules/mission-catalog/infrastructure/SupabaseMissionRepository";

const registrationRepo = new SupabaseRegistrationRepository();
const offeringRepo = new SupabaseEventOfferingRepository();
const missionRepo = new SupabaseMissionRepository();

const enrollUseCase = new EnrollParticipantUseCase(
  registrationRepo,
  offeringRepo,
  missionRepo
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await enrollUseCase.execute({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      cpf: body.cpf,
      modality: body.modality,
      missionId: body.missionId,
      termsAccepted: Boolean(body.termsAccepted),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (err: any) {
    console.error("API /api/enrollments error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar inscrição." },
      { status: 500 }
    );
  }
}
