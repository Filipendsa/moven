import { Result } from "@/shared/domain/Result";
import { PaymentStatus } from "../../domain/entities/Registration";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { EnrollmentModality } from "../../domain/value-objects/EnrollmentModality";
import { ShirtSize } from "../../domain/value-objects/ShirtSize";
import { EnrollmentPricingAndMissionResolver } from "../services/EnrollmentPricingAndMissionResolver";

const ALLOWED_STATUSES: readonly PaymentStatus[] = [
  "PENDING",
  "PAID",
  "WAITLIST",
  "CANCELED",
];

export interface AdminUpdateRegistrationInput {
  id: string;
  status?: PaymentStatus;
  shirtSize?: string;
  modality?: string;
  missionId?: string;
}

export class AdminUpdateRegistrationUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private offeringRepo: IEventOfferingRepository,
    private missionRepo?: IMissionRepository
  ) {}

  async execute(
    input: AdminUpdateRegistrationInput
  ): Promise<Result<void, Error>> {
    if (!input.id) {
      return Result.fail(new Error("ID da inscrição é obrigatório."));
    }

    const registration = await this.registrationRepo.findById(input.id);
    if (!registration) {
      return Result.fail(new Error("Inscrição não encontrada."));
    }

    if (input.status && !ALLOWED_STATUSES.includes(input.status)) {
      return Result.fail(new Error("Status de pagamento inválido."));
    }

    let shirtSizeVo: ShirtSize | undefined;
    if (input.shirtSize !== undefined) {
      const parsedShirt = ShirtSize.create(input.shirtSize);
      if (!parsedShirt.success) {
        return Result.fail(parsedShirt.error);
      }
      shirtSizeVo = parsedShirt.value;
    }

    let modalityVo: EnrollmentModality | undefined;
    let resolvedMissionId: string | undefined;
    let resolvedAmount = undefined;

    if (input.modality !== undefined) {
      const parsedModality = EnrollmentModality.create(input.modality);
      if (!parsedModality.success) {
        return Result.fail(parsedModality.error);
      }
      modalityVo = parsedModality.value;

      const resolved = await EnrollmentPricingAndMissionResolver.resolve({
        modality: modalityVo,
        missionId: input.missionId,
        offeringRepo: this.offeringRepo,
        registrationRepo: this.registrationRepo,
        missionRepo: this.missionRepo,
        ignoreCapacityBlock: true,
      });

      if (!resolved.success) {
        return Result.fail(resolved.error);
      }

      resolvedMissionId = resolved.value.targetMissionId;
      resolvedAmount = resolved.value.effectivePrice;
    } else if (
      input.missionId !== undefined &&
      registration.modality.includesAmazonasMission
    ) {
      const resolved = await EnrollmentPricingAndMissionResolver.resolve({
        modality: registration.modality,
        missionId: input.missionId,
        offeringRepo: this.offeringRepo,
        registrationRepo: this.registrationRepo,
        missionRepo: this.missionRepo,
        ignoreCapacityBlock: true,
      });

      if (!resolved.success) {
        return Result.fail(resolved.error);
      }

      resolvedMissionId = resolved.value.targetMissionId;
      resolvedAmount = resolved.value.effectivePrice;
    }

    const updateResult = registration.adminUpdateEnrollment({
      modality: modalityVo,
      missionId: resolvedMissionId,
      amount: resolvedAmount,
      shirtSize: shirtSizeVo,
      status: input.status,
    });

    if (!updateResult.success) {
      return Result.fail(updateResult.error);
    }

    await this.registrationRepo.save(registration);
    return Result.ok(undefined);
  }
}
