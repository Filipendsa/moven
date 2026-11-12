import { IPaymentGateway, CheckoutResult } from "../../domain/ports/IPaymentGateway";
import { PixPayload } from "../../domain/value-objects/PixPayload";
import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";

export class PixDirectGateway implements IPaymentGateway {
  readonly providerName = "PIX" as const;

  private buildOfferMessage(registration: Registration): string {
    switch (registration.modality.type) {
      case "SCHOOL":
        return "Oferta de 100% para Escola de Missões";
      case "MISSION":
        return "Oferta de 100% para Missão Amazonas";
      case "BOTH":
        return "Oferta de 100% para Escola e Missão Amazonas";
    }
  }

  async createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult> {
    const pixKey = process.env.NEXT_PUBLIC_PIX_KEY || "+5511972246881";
    const offerMessage = this.buildOfferMessage(registration);

    const payload = PixPayload.create({
      pixKey,
      amountCents: registration.amount.amountCents,
      description: offerMessage,
      txId: `MOVEN${registration.id.slice(0, 12)}`,
    });

    const params = new URLSearchParams({
      pix: "true",
      order_id: registration.id,
      amount: registration.amount.formatted,
      amount_cents: String(registration.amount.amountCents),
      modality: offering.title,
      name: registration.fullName,
      pix_message: offerMessage,
      pix_code: payload.copyPasteCode,
    });

    return {
      checkoutUrl: `/enrollment/success?${params.toString()}`,
      provider: this.providerName,
      orderId: registration.id,
      isMultipleStep: false,
    };
  }
}
