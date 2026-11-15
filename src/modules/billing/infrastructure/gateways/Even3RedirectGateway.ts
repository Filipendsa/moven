import { IPaymentGateway, CheckoutResult } from "../../domain/ports/IPaymentGateway";
import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";
import { serverEnv } from "@/shared/config/env";

export class Even3RedirectGateway implements IPaymentGateway {
  readonly providerName = "EVEN3" as const;

  async createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult> {
    const modality = registration.modality.type;
    const schoolUrl = serverEnv.even3SchoolCheckoutUrl;
    const missionUrl = serverEnv.even3MissionCheckoutUrl;

    if (modality === "BOTH") {
      return {
        checkoutUrl: schoolUrl,
        extraCheckoutUrl: missionUrl,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: true,
      };
    }

    const primaryUrl = modality === "MISSION" ? missionUrl : schoolUrl;

    return {
      checkoutUrl: offering.even3CheckoutUrl || primaryUrl,
      provider: this.providerName,
      orderId: registration.id,
      isMultipleStep: false,
    };
  }
}
