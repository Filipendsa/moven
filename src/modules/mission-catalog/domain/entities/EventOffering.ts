import { Entity } from "@/shared/domain/Entity";
import { ModalityType } from "@/modules/enrollment/domain/value-objects/EnrollmentModality";
import { Money } from "../value-objects/Money";

export interface EventOfferingProps {
  modality: ModalityType;
  title: string;
  price: Money;
  maxSlots: number | null; // null = sem limite fixo
  even3CheckoutUrl: string;
  isActive: boolean;
}

export class EventOffering extends Entity<EventOfferingProps> {
  private constructor(props: EventOfferingProps, id?: string) {
    super(props, id);
  }

  get modality(): ModalityType {
    return this.props.modality;
  }

  get title(): string {
    return this.props.title;
  }

  get price(): Money {
    return this.props.price;
  }

  get maxSlots(): number | null {
    return this.props.maxSlots;
  }

  get even3CheckoutUrl(): string {
    return this.props.even3CheckoutUrl;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  // Regra de Negócio: Vagas da Missão Amazonas
  // Conforme alinhado com o usuário: vagas confirmadas = ocupadas; antes disso é lista de interesse
  public hasAvailableSlots(paidCount: number): boolean {
    if (this.props.maxSlots === null) {
      return true;
    }
    return paidCount < this.props.maxSlots;
  }

  public remainingSlots(paidCount: number): number | null {
    if (this.props.maxSlots === null) return null;
    const remaining = this.props.maxSlots - paidCount;
    return remaining > 0 ? remaining : 0;
  }

  public static create(
    props: EventOfferingProps,
    id?: string
  ): EventOffering {
    return new EventOffering(props, id);
  }
}

