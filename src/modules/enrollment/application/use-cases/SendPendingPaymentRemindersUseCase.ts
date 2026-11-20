import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { INotificationGateway } from "@/modules/notifications/domain/ports/INotificationGateway";
import { NotificationGatewayResolver } from "@/modules/notifications/application/NotificationGatewayResolver";
import { publicEnv } from "@/shared/config/env";

export interface SendPaymentRemindersOutput {
  totalEligible: number;
  sentCount: number;
  smtpConfigured: boolean;
  errors: string[];
}

export class SendPendingPaymentRemindersUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private missionRepo?: IMissionRepository,
    private notificationGateway?: INotificationGateway
  ) {}

  private resolveAppUrl(): string {
    return publicEnv.appUrl.replace(/\/$/, "");
  }

  private resolveReceiptWhatsapp(): string {
    return publicEnv.receiptWhatsapp;
  }

  async execute(now = new Date()): Promise<SendPaymentRemindersOutput> {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const candidates =
      await this.registrationRepo.findPendingEligibleForReminder(sevenDaysAgo);

    const gateway =
      this.notificationGateway || NotificationGatewayResolver.resolve();
    const smtpConfigured = NotificationGatewayResolver.isSmtpConfigured();

    const appUrl = this.resolveAppUrl();
    const receiptWhatsapp = this.resolveReceiptWhatsapp();

    let sentCount = 0;
    const errors: string[] = [];

    for (const reg of candidates) {
      if (!reg.isEligibleForPaymentReminder(now)) continue;

      let missionTitle: string | undefined;
      if (reg.missionId && this.missionRepo) {
        const mission = await this.missionRepo.findById(reg.missionId);
        missionTitle = mission?.title;
      }

      const missionaryAreaUrl = `${appUrl}/pt/missionary?email=${encodeURIComponent(
        reg.email.value
      )}`;
      const receiptWhatsappUrl = `https://wa.me/${receiptWhatsapp}?text=${encodeURIComponent(
        `Olá! Segue o comprovante da minha inscrição no MOVEN (Protocolo: ${reg.id.slice(
          0,
          8
        )}, Nome: ${reg.fullName}).`
      )}`;

      const sendResult = await gateway.sendPaymentReminderMessage({
        toEmail: reg.email.value,
        fullName: reg.fullName,
        protocol: reg.id.slice(0, 8),
        modalityTitle: reg.modality.title,
        missionTitle,
        amountFormatted: reg.amount.formatted,
        paymentMethod: reg.paymentProvider === "PIX" ? "PIX" : "CARD",
        missionaryAreaUrl,
        receiptWhatsappUrl,
        locale: "pt",
      });

      if (sendResult.success) {
        if (smtpConfigured) {
          reg.markPaymentReminderSent(now);
          await this.registrationRepo.save(reg);
        }
        sentCount++;
      } else {
        errors.push(`${reg.id}: ${sendResult.error.message}`);
      }
    }

    return {
      totalEligible: candidates.length,
      sentCount,
      smtpConfigured,
      errors,
    };
  }
}
