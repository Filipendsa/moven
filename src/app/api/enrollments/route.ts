import { NextResponse } from "next/server";
import { EnrollParticipantUseCase } from "@/modules/enrollment/application/use-cases/EnrollParticipantUseCase";
import { DuplicateCpfEnrollmentError } from "@/modules/enrollment/domain/errors/DuplicateCpfEnrollmentError";
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
    const paymentMethod =
      body.paymentMethod === "PIX"
        ? "PIX"
        : body.paymentMethod === "CARD"
        ? "CARD"
        : undefined;

    const result = await enrollUseCase.execute({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      cpf: body.cpf,
      modality: body.modality,
      missionId: body.missionId,
      shirtSize: body.shirtSize,
      paymentMethod,
      termsAccepted: Boolean(body.termsAccepted),
    });

    if (!result.success) {
      if (
        result.error instanceof DuplicateCpfEnrollmentError ||
        (result.error as { code?: string }).code === "DUPLICATE_CPF"
      ) {
        return NextResponse.json(
          { error: result.error.message, code: "DUPLICATE_CPF" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: result.error.message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (err: unknown) {
    console.error("API /api/enrollments error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar inscrição." },
      { status: 500 }
    );
  }
}
