import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { Cpf } from "../../domain/value-objects/Cpf";
import { EnrollmentModality } from "../../domain/value-objects/EnrollmentModality";
import { EnrollmentPricingAndMissionResolver } from "../services/EnrollmentPricingAndMissionResolver";
import {
  buildParticipantRegistrationDto,
  ParticipantRegistrationDto,
} from "./GetParticipantRegistrationByCpfUseCase";

export class UpdateParticipantEnrollmentUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private offeringRepo: IEventOfferingRepository,
    private missionRepo?: IMissionRepository
  ) {}

  async execute(input: {
    cpf: string;
    modality: string;
    missionId?: string;
  }): Promise<Result<ParticipantRegistrationDto, Error>> {
    const cpfResult = Cpf.create(input.cpf);
    if (!cpfResult.success) {
      return Result.fail(cpfResult.error);
    }

    const modalityResult = EnrollmentModality.create(input.modality);
    if (!modalityResult.success) {
      return Result.fail(modalityResult.error);
    }

    const matches = await this.registrationRepo.findByCpf(cpfResult.value.value);
    if (matches.length === 0) {
      return Result.fail(
        new Error("Nenhuma inscrição encontrada para o CPF informado.")
      );
    }

    const registration = matches[0];

    if (registration.isPaid) {
      return Result.fail(
        new Error(
          "Inscrição já paga só pode ser alterada ou cancelada através do sistema administrativo."
        )
      );
    }

    if (registration.paymentStatus === "CANCELED") {
      return Result.fail(
        new Error("Não é possível alterar uma inscrição cancelada.")
      );
    }

    const resolvedResult = await EnrollmentPricingAndMissionResolver.resolve({
      modality: modalityResult.value,
      missionId: input.missionId,
      offeringRepo: this.offeringRepo,
      registrationRepo: this.registrationRepo,
      missionRepo: this.missionRepo,
    });
    if (!resolvedResult.success) {
      return Result.fail(resolvedResult.error);
    }

    const changeResult = registration.changeEnrollmentSelection({
      modality: modalityResult.value,
      missionId: resolvedResult.value.targetMissionId,
      amount: resolvedResult.value.effectivePrice,
      nextStatus: resolvedResult.value.isWaitlist ? "WAITLIST" : "PENDING",
    });

    if (!changeResult.success) {
      return Result.fail(changeResult.error);
    }

    await this.registrationRepo.save(registration);

    const dto = await buildParticipantRegistrationDto(
      registration,
      this.offeringRepo,
      this.missionRepo
    );
    return Result.ok(dto);
  }
}
