import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { PaymentGatewayResolver } from "@/modules/billing/application/PaymentGatewayResolver";
import { CheckoutResult } from "@/modules/billing/domain/ports/IPaymentGateway";
import {
  PaymentProvider,
  PaymentStatus,
  Registration,
} from "../../domain/entities/Registration";
import { ModalityType } from "../../domain/value-objects/EnrollmentModality";
import { ShirtSizeType } from "../../domain/value-objects/ShirtSize";
import { authenticateMissionaryCredentials } from "./AuthenticateMissionaryUseCase";

export interface ParticipantRegistrationDto {
  id: string;
  protocol: string;
  fullName: string;
  email: string;
  phoneFormatted: string;
  cpfMasked: string;
  birthDate: string | null;
  birthDateFormatted: string | null;
  age: number | null;
  modality: ModalityType;
  modalityTitle: string;
  missionId?: string;
  missionTitle?: string;
  shirtSize: ShirtSizeType;
  amountCents: number;
  amountFormatted: string;
  paymentProvider: PaymentProvider;
  paymentMethod: "PIX" | "CARD";
  paymentStatus: PaymentStatus;
  isApproved: boolean;
  checkout?: CheckoutResult;
  createdAt: string;
  updatedAt: string;
}

export async function buildParticipantRegistrationDto(
  registration: Registration,
  offeringRepo: IEventOfferingRepository,
  missionRepo?: IMissionRepository
): Promise<ParticipantRegistrationDto> {
  let missionTitle: string | undefined;
  if (registration.missionId && missionRepo) {
    const mission = await missionRepo.findById(registration.missionId);
    missionTitle = mission?.title;
  }

  let checkout: CheckoutResult | undefined;
  const paymentMethod: "PIX" | "CARD" =
    registration.paymentProvider === "PIX" ? "PIX" : "CARD";

  if (registration.paymentStatus === "PENDING") {
    const offering = await offeringRepo.findByModality(
      registration.modality.type
    );
    if (offering) {
      const gateway = PaymentGatewayResolver.resolve(
        paymentMethod,
        registration.paymentProvider
      );
      checkout = await gateway.createCheckoutSession(registration, offering);
    }
  }

  return {
    id: registration.id,
    protocol: registration.id.slice(0, 8),
    fullName: registration.fullName,
    email: registration.email.value,
    phoneFormatted: registration.phone.formatted,
    cpfMasked: `***.***.***-${registration.cpf.value.slice(-2)}`,
    birthDate: registration.birthDate ? registration.birthDate.value : null,
    birthDateFormatted: registration.birthDate
      ? registration.birthDate.formattedPtBr
      : null,
    age: registration.birthDate ? registration.birthDate.getAge() : null,
    modality: registration.modality.type,
    modalityTitle: registration.modality.title,
    missionId: registration.missionId,
    missionTitle,
    shirtSize: registration.shirtSize.value,
    amountCents: registration.amount.amountCents,
    amountFormatted: registration.amount.formatted,
    paymentProvider: registration.paymentProvider,
    paymentMethod,
    paymentStatus: registration.paymentStatus,
    isApproved: registration.isPaid,
    checkout,
    createdAt: registration.createdAt.toISOString(),
    updatedAt: registration.updatedAt.toISOString(),
  };
}

export class GetParticipantRegistrationByCpfUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private offeringRepo: IEventOfferingRepository,
    private missionRepo?: IMissionRepository
  ) {}

  async execute(input: {
    email: string;
    cpfLast4: string;
  }): Promise<Result<ParticipantRegistrationDto, Error>> {
    const authResult = await authenticateMissionaryCredentials(
      this.registrationRepo,
      { email: input.email, cpfLast4: input.cpfLast4 }
    );
    if (!authResult.success) {
      return Result.fail(authResult.error);
    }

    const dto = await buildParticipantRegistrationDto(
      authResult.value,
      this.offeringRepo,
      this.missionRepo
    );
    return Result.ok(dto);
  }
}
