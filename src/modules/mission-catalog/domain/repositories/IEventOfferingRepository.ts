import { EventOffering } from "../entities/EventOffering";
import { ModalityType } from "@/modules/enrollment/domain/value-objects/EnrollmentModality";

export interface IEventOfferingRepository {
  findByModality(modality: ModalityType): Promise<EventOffering | null>;
  listActive(): Promise<EventOffering[]>;
}

