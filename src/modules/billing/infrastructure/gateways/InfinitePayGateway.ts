import { IPaymentGateway, CheckoutResult } from "../../domain/ports/IPaymentGateway";
import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";
import { publicEnv, serverEnv } from "@/shared/config/env";

export class InfinitePayGateway implements IPaymentGateway {
  readonly providerName = "INFINITEPAY" as const;

  async createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult> {
    const apiKey = serverEnv.infinitePayApiKey;
    const webhookUrl = publicEnv.appUrl;

    if (!apiKey) {
      return {
        checkoutUrl: `${webhookUrl}/enrollment/success?order_id=${registration.id}&provider=INFINITEPAY_SIMULATED`,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: false,
      };
    }

    try {
      const response = await fetch(serverEnv.infinitePayApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            order_id: registration.id,
            amount: registration.amount.amountCents,
            customer: {
              name: registration.fullName,
              email: registration.email.value,
              phone_number: registration.phone.internationalDigits,
              document: registration.cpf.value,
            },
            items: [
              {
                description: `${offering.title} - MOVEN`,
                quantity: 1,
                price: registration.amount.amountCents,
              },
            ],
            callback_url: `${webhookUrl}/api/webhooks/infinitepay`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`InfinitePay API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        checkoutUrl: data.url || data.checkout_url,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: false,
      };
    } catch {
      return {
        checkoutUrl: `${webhookUrl}/enrollment/success?order_id=${registration.id}&provider=INFINITEPAY_PENDING`,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: false,
      };
    }
  }
}
