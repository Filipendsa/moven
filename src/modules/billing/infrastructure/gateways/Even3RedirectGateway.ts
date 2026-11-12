import { IPaymentGateway, CheckoutResult } from "../../domain/ports/IPaymentGateway";
import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";

export class Even3RedirectGateway implements IPaymentGateway {
  readonly providerName = "EVEN3" as const;

  private readonly schoolUrl =
    "https://ingressos.eventodaigreja.com.br/moven-nucleo-de-missoes-igreja-unasp-ht-404c03a0";
  private readonly missionUrl =
    "https://ingressos.eventodaigreja.com.br/missao-salva-vidas-amazonia-julho-2027-034970c3";

  async createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult> {
    const modality = registration.modality.type;

    if (modality === "BOTH") {
      return {
        checkoutUrl: this.schoolUrl,
        extraCheckoutUrl: this.missionUrl,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: true,
      };
    }

    const primaryUrl =
      modality === "MISSION" ? this.missionUrl : this.schoolUrl;

    return {
      checkoutUrl: offering.even3CheckoutUrl || primaryUrl,
      provider: this.providerName,
      orderId: registration.id,
      isMultipleStep: false,
    };
  }
}
