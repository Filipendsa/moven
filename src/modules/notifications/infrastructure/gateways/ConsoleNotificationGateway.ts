import { Result } from "@/shared/domain/Result";
import {
  INotificationGateway,
  PaymentReminderPayload,
  WelcomeNotificationPayload,
} from "../../domain/ports/INotificationGateway";

/**
 * Fallback gateway used when Gmail SMTP credentials (App Password) are not yet configured.
 * Logs the outbound message without failing enrollment or reminder jobs.
 */
export class ConsoleNotificationGateway implements INotificationGateway {
  async sendWelcomeMessage(
    payload: WelcomeNotificationPayload
  ): Promise<Result<void, Error>> {
    console.info(
      `[ConsoleNotificationGateway] Boas-vindas (pendente SMTP): to=${payload.toEmail}, protocol=${payload.protocol}`
    );
    return Result.ok(undefined);
  }

  async sendPaymentReminderMessage(
    payload: PaymentReminderPayload
  ): Promise<Result<void, Error>> {
    console.info(
      `[ConsoleNotificationGateway] Lembrete 7 dias (pendente SMTP): to=${payload.toEmail}, protocol=${payload.protocol}`
    );
    return Result.ok(undefined);
  }
}
