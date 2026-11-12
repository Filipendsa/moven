import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { PaymentGatewayResolver } from "@/modules/billing/application/PaymentGatewayResolver";
import { Registration } from "../../domain/entities/Registration";
import { Cpf } from "../../domain/value-objects/Cpf";
import { Email } from "../../domain/value-objects/Email";
import { BrazilianPhone } from "../../domain/value-objects/BrazilianPhone";
import { EnrollmentModality } from "../../domain/value-objects/EnrollmentModality";
import { LgpdConsent } from "../../domain/value-objects/LgpdConsent";
import { CheckoutResult } from "@/modules/billing/domain/ports/IPaymentGateway";

export interface EnrollParticipantInput {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  modality: string;
  termsAccepted: boolean;
}

export interface EnrollParticipantOutput {
  registrationId: string;
  checkout: CheckoutResult;
  amountFormatted: string;
}

export class EnrollParticipantUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private offeringRepo: IEventOfferingRepository
  ) {}

  async execute(
    input: EnrollParticipantInput
  ): Promise<Result<EnrollParticipantOutput, Error>> {
    // 1. Validação dos Value Objects de Domínio Rico
    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 3) {
      return Result.fail(new Error("Nome completo deve ter pelo menos 3 caracteres."));
    }

    const emailResult = Email.create(input.email);
    if (!emailResult.success) return Result.fail(emailResult.error);

    const phoneResult = BrazilianPhone.create(input.phone);
    if (!phoneResult.success) return Result.fail(phoneResult.error);

    const cpfResult = Cpf.create(input.cpf);
    if (!cpfResult.success) return Result.fail(cpfResult.error);

    const modalityResult = EnrollmentModality.create(input.modality);
    if (!modalityResult.success) return Result.fail(modalityResult.error);

    const lgpdResult = LgpdConsent.create(input.termsAccepted);
    if (!lgpdResult.success) return Result.fail(lgpdResult.error);

    // 2. Busca o item de catálogo de eventos correspondente
    const offering = await this.offeringRepo.findByModality(
      modalityResult.value.type
    );
    if (!offering) {
      return Result.fail(new Error("Modalidade não encontrada no catálogo."));
    }

    // 3. Regra de Negócio: Limite de vagas na Missão Amazonas (28 vagas)
    if (modalityResult.value.includesAmazonasMission && offering.maxSlots !== null) {
      const metrics = await this.registrationRepo.getMetrics();
      if (!offering.hasAvailableSlots(metrics.missaoPaidSlots)) {
        return Result.fail(
          new Error(
            "Desculpe! As 28 vagas confirmadas da Missão Amazonas já foram preenchidas."
          )
        );
      }
    }

    // 4. Resolve o Gateway de Pagamento ativo (Strategy Pattern)
    const gateway = PaymentGatewayResolver.resolve();

    // 5. Criação do Agregado Registration
    const registrationResult = Registration.enroll({
      fullName,
      email: emailResult.value,
      phone: phoneResult.value,
      cpf: cpfResult.value,
      modality: modalityResult.value,
      amount: offering.price,
      paymentProvider: gateway.providerName,
      lgpdConsent: lgpdResult.value,
    });

    if (!registrationResult.success) {
      return Result.fail(registrationResult.error);
    }

    const registration = registrationResult.value;

    // 6. Salva no Repositório (Persistence)
    await this.registrationRepo.save(registration);

    // 7. Gera sessão de checkout no Gateway
    const checkout = await gateway.createCheckoutSession(registration, offering);

    return Result.ok({
      registrationId: registration.id,
      checkout,
      amountFormatted: registration.amount.formatted,
    });
  }
}

