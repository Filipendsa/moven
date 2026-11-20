import nodemailer from "nodemailer";
import { Result } from "@/shared/domain/Result";
import { serverEnv } from "@/shared/config/env";
import {
  INotificationGateway,
  PaymentReminderPayload,
  WelcomeNotificationPayload,
} from "../../domain/ports/INotificationGateway";
import {
  buildPaymentReminderEmail,
  buildWelcomeEmail,
} from "../../application/templates/EmailTemplates";

export class GmailSmtpNotificationGateway implements INotificationGateway {
  private createTransporter() {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: serverEnv.gmailUser,
        pass: serverEnv.gmailAppPassword,
      },
    });
  }

  private async sendMail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<Result<void, Error>> {
    try {
      const transporter = this.createTransporter();
      await transporter.sendMail({
        from: `MOVEN · Núcleo de Missões <${serverEnv.gmailUser}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      return Result.ok(undefined);
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err
          : new Error("Falha ao enviar e-mail via Gmail SMTP.");
      console.error("[GmailSmtpNotificationGateway] sendMail error:", error);
      return Result.fail(error);
    }
  }

  async sendWelcomeMessage(
    payload: WelcomeNotificationPayload
  ): Promise<Result<void, Error>> {
    const email = buildWelcomeEmail(payload);
    return this.sendMail({
      to: payload.toEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }

  async sendPaymentReminderMessage(
    payload: PaymentReminderPayload
  ): Promise<Result<void, Error>> {
    const email = buildPaymentReminderEmail(payload);
    return this.sendMail({
      to: payload.toEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }
}
