import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { BirthDate } from "../../domain/value-objects/BirthDate";
import { authenticateMissionaryCredentials } from "./AuthenticateMissionaryUseCase";
import {
  buildParticipantRegistrationDto,
  ParticipantRegistrationDto,
} from "./GetParticipantRegistrationByCpfUseCase";

export class UpdateParticipantBirthDateUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private offeringRepo: IEventOfferingRepository,
    private missionRepo?: IMissionRepository
  ) {}

  async execute(input: {
    email: string;
    cpfLast4: string;
    birthDate: string;
  }): Promise<Result<ParticipantRegistrationDto, Error>> {
    const authResult = await authenticateMissionaryCredentials(
      this.registrationRepo,
      { email: input.email, cpfLast4: input.cpfLast4 }
    );
    if (!authResult.success) {
      return Result.fail(authResult.error);
    }

    const birthDateResult = BirthDate.create(input.birthDate);
    if (!birthDateResult.success) {
      return Result.fail(birthDateResult.error);
    }

    const registration = authResult.value;
    const changeResult = registration.changeBirthDate(birthDateResult.value);
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
