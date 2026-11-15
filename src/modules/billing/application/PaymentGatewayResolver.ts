import { IPaymentGateway } from "../domain/ports/IPaymentGateway";
import { Even3RedirectGateway } from "../infrastructure/gateways/Even3RedirectGateway";
import { InfinitePayGateway } from "../infrastructure/gateways/InfinitePayGateway";
import { PixDirectGateway } from "../infrastructure/gateways/PixDirectGateway";
import { publicEnv } from "@/shared/config/env";

export type PaymentMethodPreference = "CARD" | "PIX";

export class PaymentGatewayResolver {
  private static even3Instance = new Even3RedirectGateway();
  private static infinitePayInstance = new InfinitePayGateway();
  private static pixInstance = new PixDirectGateway();

  public static resolve(
    preferredMethod?: PaymentMethodPreference,
    overrideProvider?: string
  ): IPaymentGateway {
    if (preferredMethod === "PIX") {
      return this.pixInstance;
    }

    const activeProvider = (
      overrideProvider || publicEnv.paymentMode
    ).toUpperCase();

    if (activeProvider === "INFINITEPAY") {
      return this.infinitePayInstance;
    }

    return this.even3Instance;
  }
}
