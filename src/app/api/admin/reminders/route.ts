import { NextResponse } from "next/server";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";
import { SupabaseMissionRepository } from "@/modules/mission-catalog/infrastructure/SupabaseMissionRepository";
import { SendPendingPaymentRemindersUseCase } from "@/modules/enrollment/application/use-cases/SendPendingPaymentRemindersUseCase";

const registrationRepo = new SupabaseRegistrationRepository();
const missionRepo = new SupabaseMissionRepository();

const sendRemindersUseCase = new SendPendingPaymentRemindersUseCase(
  registrationRepo,
  missionRepo
);

export async function POST() {
  try {
    const summary = await sendRemindersUseCase.execute();
    return NextResponse.json(summary);
  } catch (err: unknown) {
    console.error("API POST /api/admin/reminders error:", err);
    return NextResponse.json(
      { error: "Erro ao disparar lembretes." },
      { status: 500 }
    );
  }
}
