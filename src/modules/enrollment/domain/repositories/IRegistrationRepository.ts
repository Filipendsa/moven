import { Registration, PaymentStatus } from "../entities/Registration";
import { ModalityType } from "../value-objects/EnrollmentModality";

export interface EnrollmentFilters {
  search?: string;
  modality?: ModalityType;
  status?: PaymentStatus;
  missionId?: string;
}

export interface EnrollmentMetrics {
  totalRegistrations: number;
  totalPaid: number;
  totalPending: number;
  totalWaitlist: number;
  totalCanceled: number;
  escolaTotal: number;
  missaoTotal: number;
  ambosTotal: number;
  missaoPaidSlots: number;
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
  countByMission(missionId: string): Promise<{ paid: number; waitlist: number; pending: number }>;
  updateStatus(
    id: string,
    status: PaymentStatus,
    externalTxId?: string
  ): Promise<void>;
}
