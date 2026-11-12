import { IPaymentGateway } from "../domain/ports/IPaymentGateway";
import { Even3RedirectGateway } from "../infrastructure/gateways/Even3RedirectGateway";
import { InfinitePayGateway } from "../infrastructure/gateways/InfinitePayGateway";

export class PaymentGatewayResolver {
  private static even3Instance = new Even3RedirectGateway();
  private static infinitePayInstance = new InfinitePayGateway();

  public static resolve(overrideProvider?: string): IPaymentGateway {
    const activeProvider = (
      overrideProvider ||
      process.env.NEXT_PUBLIC_PAYMENT_MODE ||
      "EVEN3"
    ).toUpperCase();

    if (activeProvider === "INFINITEPAY") {
      return this.infinitePayInstance;
    }

    return this.even3Instance;
  }
}

