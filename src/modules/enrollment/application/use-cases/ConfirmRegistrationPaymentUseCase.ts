import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { Result } from "@/shared/domain/Result";

export class ConfirmRegistrationPaymentUseCase {
  constructor(private registrationRepo: IRegistrationRepository) {}

  async execute(params: {
    registrationId: string;
    externalTxId?: string;
  }): Promise<Result<void, Error>> {
    const registration = await this.registrationRepo.findById(
      params.registrationId
    );
    if (!registration) {
      return Result.fail(new Error("Inscrição não encontrada."));
    }

    const confirmResult = registration.confirmPayment(params.externalTxId);
    if (!confirmResult.success) {
      return confirmResult;
    }

    await this.registrationRepo.updateStatus(
      registration.id,
      "PAID",
      params.externalTxId
    );

    return Result.ok(undefined);
  }
}

