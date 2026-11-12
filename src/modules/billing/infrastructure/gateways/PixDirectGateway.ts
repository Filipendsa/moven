import { IPaymentGateway, CheckoutResult } from "../../domain/ports/IPaymentGateway";
import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";

export class PixDirectGateway implements IPaymentGateway {
  readonly providerName = "PIX" as const;

  async createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult> {
    const params = new URLSearchParams({
      pix: "true",
      order_id: registration.id,
      amount: registration.amount.formatted,
      modality: offering.title,
      name: registration.fullName,
    });

    return {
      checkoutUrl: `/enrollment/success?${params.toString()}`,
      provider: this.providerName,
      orderId: registration.id,
      isMultipleStep: false,
    };
  }
}
