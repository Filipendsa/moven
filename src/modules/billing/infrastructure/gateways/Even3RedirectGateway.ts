import { IPaymentGateway, CheckoutResult } from "../../domain/ports/IPaymentGateway";
import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";

export class Even3RedirectGateway implements IPaymentGateway {
  readonly providerName = "EVEN3" as const;

  // URLs oficiais de referência do Even3/Evento da Igreja para o MOVEN
  private readonly escolaUrl =
    "https://ingressos.eventodaigreja.com.br/moven-nucleo-de-missoes-igreja-unasp-ht-404c03a0";
  private readonly missaoUrl =
    "https://ingressos.eventodaigreja.com.br/missao-salva-vidas-amazonia-julho-2027-034970c3";

  async createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult> {
    const modality = registration.modality.type;

    if (modality === "AMBOS") {
      // Como ainda não há um link combo único no Even3, fornecemos ambos os links
      return {
        checkoutUrl: this.escolaUrl,
        extraCheckoutUrl: this.missaoUrl,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: true,
      };
    }

    const primaryUrl =
      modality === "MISSAO" ? this.missaoUrl : this.escolaUrl;

    return {
      checkoutUrl: offering.even3CheckoutUrl || primaryUrl,
      provider: this.providerName,
      orderId: registration.id,
      isMultipleStep: false,
    };
  }
}

