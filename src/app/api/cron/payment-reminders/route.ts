import { NextResponse } from "next/server";
import { SupabaseRegistrationRepository } from "@/modules/enrollment/infrastructure/persistence/SupabaseRegistrationRepository";
import { SupabaseMissionRepository } from "@/modules/mission-catalog/infrastructure/SupabaseMissionRepository";
import { SendPendingPaymentRemindersUseCase } from "@/modules/enrollment/application/use-cases/SendPendingPaymentRemindersUseCase";
import { serverEnv } from "@/shared/config/env";
import { reportObservatoryServerError } from "@/shared/infrastructure/observatory/observatoryServer";

const registrationRepo = new SupabaseRegistrationRepository();
const missionRepo = new SupabaseMissionRepository();

const sendRemindersUseCase = new SendPendingPaymentRemindersUseCase(
  registrationRepo,
  missionRepo
);

export async function GET(request: Request) {
  const cronSecret = serverEnv.cronSecret;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await sendRemindersUseCase.execute();
    return NextResponse.json(summary);
  } catch (err: unknown) {
    console.error("API /api/cron/payment-reminders error:", err);
    await reportObservatoryServerError({
      errorName: err instanceof Error ? err.name : "PaymentRemindersCronError",
      message: err instanceof Error ? err.message : "Erro no cron de lembretes",
      stack: err instanceof Error ? err.stack || null : null,
      route: "/api/cron/payment-reminders",
      severity: "critical",
    });
    return NextResponse.json(
      { error: "Erro ao processar lembretes de pagamento." },
      { status: 500 }
    );
  }
}
