import { NextResponse } from "next/server";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";
import { SupabaseEventOfferingRepository } from "@/modules/mission-catalog/infrastructure/SupabaseEventOfferingRepository";
import { SupabaseMissionRepository } from "@/modules/mission-catalog/infrastructure/SupabaseMissionRepository";
import { GetParticipantRegistrationByCpfUseCase } from "@/modules/enrollment/application/use-cases/GetParticipantRegistrationByCpfUseCase";
import { UpdateParticipantShirtSizeUseCase } from "@/modules/enrollment/application/use-cases/UpdateParticipantShirtSizeUseCase";
import { UpdateParticipantEnrollmentUseCase } from "@/modules/enrollment/application/use-cases/UpdateParticipantEnrollmentUseCase";
import { CancelUnpaidParticipantRegistrationUseCase } from "@/modules/enrollment/application/use-cases/CancelUnpaidParticipantRegistrationUseCase";

const registrationRepo = new SupabaseRegistrationRepository();
const offeringRepo = new SupabaseEventOfferingRepository();
const missionRepo = new SupabaseMissionRepository();

const getParticipantUseCase = new GetParticipantRegistrationByCpfUseCase(
  registrationRepo,
  offeringRepo,
  missionRepo
);

const updateShirtSizeUseCase = new UpdateParticipantShirtSizeUseCase(
  registrationRepo
);

const updateEnrollmentUseCase = new UpdateParticipantEnrollmentUseCase(
  registrationRepo,
  offeringRepo,
  missionRepo
);

const cancelUnpaidUseCase = new CancelUnpaidParticipantRegistrationUseCase(
  registrationRepo,
  offeringRepo,
  missionRepo
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cpf = searchParams.get("cpf") || "";

    const result = await getParticipantUseCase.execute({ cpf });
    if (!result.success) {
      const isNotFound = result.error.message.includes("Nenhuma inscrição");
      return NextResponse.json(
        { error: result.error.message, code: isNotFound ? "NOT_FOUND" : "INVALID_CPF" },
        { status: isNotFound ? 404 : 400 }
      );
    }

    return NextResponse.json({ registration: result.value });
  } catch (err: unknown) {
    console.error("API GET /api/enrollments/participant error:", err);
    return NextResponse.json(
      { error: "Erro interno ao consultar inscrição." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "CANCEL") {
      const result = await cancelUnpaidUseCase.execute({
        cpf: body.cpf || "",
      });

      if (!result.success) {
        const isNotFound = result.error.message.includes("Nenhuma inscrição");
        const isPaidLock = result.error.message.includes("já paga");
        return NextResponse.json(
          { error: result.error.message },
          { status: isNotFound ? 404 : isPaidLock ? 403 : 400 }
        );
      }

      return NextResponse.json({ registration: result.value });
    }

    if (body.action === "UPDATE_ENROLLMENT" || body.modality !== undefined) {
      const result = await updateEnrollmentUseCase.execute({
        cpf: body.cpf || "",
        modality: body.modality || "",
        missionId: body.missionId,
      });

      if (!result.success) {
        const isNotFound = result.error.message.includes("Nenhuma inscrição");
        const isPaidLock = result.error.message.includes("já paga");
        return NextResponse.json(
          { error: result.error.message },
          { status: isNotFound ? 404 : isPaidLock ? 403 : 400 }
        );
      }

      return NextResponse.json({ registration: result.value });
    }

    const result = await updateShirtSizeUseCase.execute({
      cpf: body.cpf || "",
      shirtSize: body.shirtSize || "",
    });

    if (!result.success) {
      const isNotFound = result.error.message.includes("Nenhuma inscrição");
      return NextResponse.json(
        { error: result.error.message },
        { status: isNotFound ? 404 : 400 }
      );
    }

    return NextResponse.json(result.value);
  } catch (err: unknown) {
    console.error("API PATCH /api/enrollments/participant error:", err);
    return NextResponse.json(
      { error: "Erro interno ao atualizar inscrição." },
      { status: 500 }
    );
  }
}
