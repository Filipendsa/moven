import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { Cpf } from "../../domain/value-objects/Cpf";
import {
  buildParticipantRegistrationDto,
  ParticipantRegistrationDto,
} from "./GetParticipantRegistrationByCpfUseCase";

export class CancelUnpaidParticipantRegistrationUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private offeringRepo: IEventOfferingRepository,
    private missionRepo?: IMissionRepository
  ) {}

  async execute(input: {
    cpf: string;
  }): Promise<Result<ParticipantRegistrationDto, Error>> {
    const cpfResult = Cpf.create(input.cpf);
    if (!cpfResult.success) {
      return Result.fail(cpfResult.error);
    }

    const matches = await this.registrationRepo.findByCpf(cpfResult.value.value);
    if (matches.length === 0) {
      return Result.fail(
        new Error("Nenhuma inscrição encontrada para o CPF informado.")
      );
    }

    const registration = matches[0];
    const cancelResult = registration.cancelByParticipant();
    if (!cancelResult.success) {
      return Result.fail(cancelResult.error);
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
