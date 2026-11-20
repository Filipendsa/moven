import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { Cpf } from "../../domain/value-objects/Cpf";
import { ShirtSize, ShirtSizeType } from "../../domain/value-objects/ShirtSize";

export interface UpdateParticipantShirtSizeOutput {
  registrationId: string;
  shirtSize: ShirtSizeType;
  updatedAt: string;
}

export class UpdateParticipantShirtSizeUseCase {
  constructor(private registrationRepo: IRegistrationRepository) {}

  async execute(input: {
    cpf: string;
    shirtSize: string;
  }): Promise<Result<UpdateParticipantShirtSizeOutput, Error>> {
    const cpfResult = Cpf.create(input.cpf);
    if (!cpfResult.success) {
      return Result.fail(cpfResult.error);
    }

    const shirtSizeResult = ShirtSize.create(input.shirtSize);
    if (!shirtSizeResult.success) {
      return Result.fail(shirtSizeResult.error);
    }

    const matches = await this.registrationRepo.findByCpf(cpfResult.value.value);
    if (matches.length === 0) {
      return Result.fail(
        new Error("Nenhuma inscrição encontrada para o CPF informado.")
      );
    }

    const registration = matches[0];
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
