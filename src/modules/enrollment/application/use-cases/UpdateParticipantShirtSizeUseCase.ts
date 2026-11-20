import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { ShirtSize, ShirtSizeType } from "../../domain/value-objects/ShirtSize";
import { authenticateMissionaryCredentials } from "./AuthenticateMissionaryUseCase";

export interface UpdateParticipantShirtSizeOutput {
  registrationId: string;
  shirtSize: ShirtSizeType;
  updatedAt: string;
}

export class UpdateParticipantShirtSizeUseCase {
  constructor(private registrationRepo: IRegistrationRepository) {}

  async execute(input: {
    email: string;
    cpfLast4: string;
    shirtSize: string;
  }): Promise<Result<UpdateParticipantShirtSizeOutput, Error>> {
    const authResult = await authenticateMissionaryCredentials(
      this.registrationRepo,
      { email: input.email, cpfLast4: input.cpfLast4 }
    );
    if (!authResult.success) {
      return Result.fail(authResult.error);
    }

    const shirtSizeResult = ShirtSize.create(input.shirtSize);
    if (!shirtSizeResult.success) {
      return Result.fail(shirtSizeResult.error);
    }

    const registration = authResult.value;
    const changeResult = registration.changeShirtSize(shirtSizeResult.value);
    if (!changeResult.success) {
      return Result.fail(changeResult.error);
    }

    await this.registrationRepo.updateShirtSize(
      registration.id,
      shirtSizeResult.value.value
    );

    return Result.ok({
      registrationId: registration.id,
      shirtSize: registration.shirtSize.value,
      updatedAt: registration.updatedAt.toISOString(),
    });
  }
}
