import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { Registration } from "../../domain/entities/Registration";
import { Email } from "../../domain/value-objects/Email";

export interface MissionaryCredentialsInput {
  email: string;
  cpfLast4: string;
}

export async function authenticateMissionaryCredentials(
  registrationRepo: IRegistrationRepository,
  input: MissionaryCredentialsInput
): Promise<Result<Registration, Error>> {
  const emailResult = Email.create(input.email);
  if (!emailResult.success) {
    return Result.fail(emailResult.error);
  }

  const cleanLast4 = (input.cpfLast4 || "").replace(/\D/g, "");
  if (cleanLast4.length !== 4) {
    return Result.fail(
      new Error("Informe exatamente os 4 últimos dígitos do seu CPF.")
    );
  }

  const registration = await registrationRepo.findByEmailAndCpfLast4(
    emailResult.value.value,
    cleanLast4
  );

  if (!registration) {
    return Result.fail(
      new Error(
        "Inscrição não encontrada. Verifique o e-mail e os 4 últimos dígitos do CPF."
      )
    );
  }

  return Result.ok(registration);
}
