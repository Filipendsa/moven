import { serverEnv } from "@/shared/config/env";
import { INotificationGateway } from "../domain/ports/INotificationGateway";
import { GmailSmtpNotificationGateway } from "../infrastructure/gateways/GmailSmtpNotificationGateway";
import { ConsoleNotificationGateway } from "../infrastructure/gateways/ConsoleNotificationGateway";

export class NotificationGatewayResolver {
  private static gmailInstance = new GmailSmtpNotificationGateway();
  private static consoleInstance = new ConsoleNotificationGateway();

  public static resolve(): INotificationGateway {
    if (serverEnv.gmailAppPassword) {
      return this.gmailInstance;
    }
    return this.consoleInstance;
  }

  public static isSmtpConfigured(): boolean {
    return Boolean(serverEnv.gmailAppPassword);
  }
}
