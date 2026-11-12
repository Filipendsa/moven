import { Registration } from "@/modules/enrollment/domain/entities/Registration";
import { EventOffering } from "@/modules/mission-catalog/domain/entities/EventOffering";

export interface CheckoutResult {
  checkoutUrl: string;
  provider: "EVEN3" | "INFINITEPAY" | "PIX";
  orderId: string;
  isMultipleStep?: boolean;
  extraCheckoutUrl?: string; // Usado caso EVEN3 precise de 2 links no combo
}

export interface IPaymentGateway {
  readonly providerName: "EVEN3" | "INFINITEPAY" | "PIX";
  createCheckoutSession(
    registration: Registration,
    offering: EventOffering
  ): Promise<CheckoutResult>;
}

