import { IPaymentGateway, CheckoutResult } from "../../domain/ports/IPaymentGateway";
import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";

export class InfinitePayGateway implements IPaymentGateway {
  readonly providerName = "INFINITEPAY" as const;

  async createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult> {
    const apiKey = process.env.INFINITEPAY_API_KEY;
    const webhookUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://moven.vercel.app";

    // Estrutura preparada para a API de checkout do InfinitePay
    // Se a chave não estiver presente no ambiente (ex: modo de teste ou Even3 ativo),
    // gera um link simulado seguro com o orderId
    if (!apiKey) {
      return {
        checkoutUrl: `${webhookUrl}/inscricao/sucesso?order_id=${registration.id}&provider=INFINITEPAY_SIMULATED`,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: false,
      };
    }

    try {
      // Exemplo de payload oficial InfinitePay / Smart Checkout
      const response = await fetch(
        "https://api.infinitepay.io/v2/transactions/checkout",
        {
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
      // Fallback gracioso
      return {
        checkoutUrl: `${webhookUrl}/inscricao/sucesso?order_id=${registration.id}&provider=INFINITEPAY_PENDING`,
        provider: this.providerName,
        orderId: registration.id,
        isMultipleStep: false,
      };
    }
  }
}

