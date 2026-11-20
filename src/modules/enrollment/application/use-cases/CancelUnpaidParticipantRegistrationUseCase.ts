import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { authenticateMissionaryCredentials } from "./AuthenticateMissionaryUseCase";
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

    const registration = authResult.value;
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
