import { Registration, PaymentStatus } from "../entities/Registration";
import { ModalityType } from "../value-objects/EnrollmentModality";

export interface EnrollmentFilters {
  search?: string;
  modality?: ModalityType;
  status?: PaymentStatus;
}

export interface EnrollmentMetrics {
  totalRegistrations: number;
  totalPaid: number;
  totalPending: number;
  totalCanceled: number;
  escolaTotal: number;
  missaoTotal: number;
  ambosTotal: number;
  missaoPaidSlots: number; // Vagas confirmadas na Missão (MISSAO + AMBOS com PAID)
  missaoMaxSlots: number;
  totalRevenueCents: number;
  pendingRevenueCents: number;
}

export interface IRegistrationRepository {
  save(registration: Registration): Promise<void>;
  findById(id: string): Promise<Registration | null>;
  findByCpf(cpf: string): Promise<Registration[]>;
  list(filters?: EnrollmentFilters): Promise<Registration[]>;
  getMetrics(): Promise<EnrollmentMetrics>;
  updateStatus(
    id: string,
    status: PaymentStatus,
    externalTxId?: string
  ): Promise<void>;
}

