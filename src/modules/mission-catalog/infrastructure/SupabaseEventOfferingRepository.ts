import { IEventOfferingRepository } from "../domain/repositories/IEventOfferingRepository";
import { EventOffering } from "../domain/entities/EventOffering";
import { ModalityType } from "@/modules/enrollment/domain/value-objects/EnrollmentModality";
import { Money } from "../domain/value-objects/Money";

export class SupabaseEventOfferingRepository
  implements IEventOfferingRepository
{
  private static catalog: EventOffering[] = [
    EventOffering.create({
      modality: "SCHOOL",
      title: "Escola de Missões",
      price: (Money.fromCents(17000) as any).value,
      maxSlots: null,
      even3CheckoutUrl:
        "https://ingressos.eventodaigreja.com.br/moven-nucleo-de-missoes-igreja-unasp-ht-404c03a0",
      isActive: true,
    }),
    EventOffering.create({
      modality: "MISSION",
      title: "Missão Amazonas 2027",
      price: (Money.fromCents(250000) as any).value,
      maxSlots: 28,
      even3CheckoutUrl:
        "https://ingressos.eventodaigreja.com.br/missao-salva-vidas-amazonia-julho-2027-034970c3",
      isActive: true,
    }),
    EventOffering.create({
      modality: "BOTH",
      title: "Escola de Missões + Missão Amazonas",
      price: (Money.fromCents(267000) as any).value,
      maxSlots: 28,
      even3CheckoutUrl:
        "https://ingressos.eventodaigreja.com.br/moven-nucleo-de-missoes-igreja-unasp-ht-404c03a0",
      isActive: true,
    }),
  ];

  async findByModality(modality: ModalityType): Promise<EventOffering | null> {
    const found = SupabaseEventOfferingRepository.catalog.find(
      (c) => c.modality === modality && c.isActive
    );
    return found || null;
  }

  async listActive(): Promise<EventOffering[]> {
    return SupabaseEventOfferingRepository.catalog.filter((c) => c.isActive);
  }
}
