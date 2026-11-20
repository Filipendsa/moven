import { Result } from "@/shared/domain/Result";
import { Locale } from "@/i18n/config";

export interface WelcomeNotificationPayload {
  toEmail: string;
  fullName: string;
  protocol: string;
  modalityTitle: string;
  missionTitle?: string;
  shirtSize: string;
  amountFormatted: string;
  paymentMethod: "PIX" | "CARD";
  isWaitlist: boolean;
  missionaryAreaUrl: string;
  locale?: Locale;
}

export interface PaymentReminderPayload {
  toEmail: string;
  fullName: string;
  protocol: string;
  modalityTitle: string;
  missionTitle?: string;
  amountFormatted: string;
  paymentMethod: "PIX" | "CARD";
  missionaryAreaUrl: string;
  receiptWhatsappUrl: string;
  locale?: Locale;
}

export interface INotificationGateway {
  sendWelcomeMessage(
    payload: WelcomeNotificationPayload
  ): Promise<Result<void, Error>>;
  sendPaymentReminderMessage(
    payload: PaymentReminderPayload
  ): Promise<Result<void, Error>>;
}
