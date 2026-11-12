import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { PaymentGatewayResolver } from "@/modules/billing/application/PaymentGatewayResolver";
import { Registration } from "../../domain/entities/Registration";
import { Cpf } from "../../domain/value-objects/Cpf";
import { Email } from "../../domain/value-objects/Email";
import { BrazilianPhone } from "../../domain/value-objects/BrazilianPhone";
import { EnrollmentModality } from "../../domain/value-objects/EnrollmentModality";
import { LgpdConsent } from "../../domain/value-objects/LgpdConsent";
import { CheckoutResult } from "@/modules/billing/domain/ports/IPaymentGateway";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";

export interface EnrollParticipantInput {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  modality: string;
  missionId?: string;
  termsAccepted: boolean;
}

export interface EnrollParticipantOutput {
  registrationId: string;
  isWaitlist: boolean;
  missionTitle?: string;
  checkout?: CheckoutResult;
  amountFormatted: string;
}

export class EnrollParticipantUseCase {
  constructor(
    private registrationRepo: IRegistrationRepository,
    private offeringRepo: IEventOfferingRepository,
    private missionRepo?: IMissionRepository
  ) {}

  async execute(
    input: EnrollParticipantInput
  ): Promise<Result<EnrollParticipantOutput, Error>> {
    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 3) {
      return Result.fail(
        new Error("Nome completo deve ter pelo menos 3 caracteres.")
      );
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

    const offering = await this.offeringRepo.findByModality(
      modalityResult.value.type
    );
    if (!offering) {
      return Result.fail(new Error("Modalidade não encontrada no catálogo."));
    }

    let targetMissionId: string | undefined = input.missionId;
    let targetMissionTitle: string | undefined;
    let isWaitlist = false;
    let effectivePrice = offering.price;

    // Check dynamic Mission catalog if enrolling in a mission or combo
    if (modalityResult.value.includesAmazonasMission && this.missionRepo) {
      const mission = input.missionId
        ? await this.missionRepo.findById(input.missionId)
        : await this.missionRepo.findFeatured();

      if (mission) {
        targetMissionId = mission.id;
        targetMissionTitle = mission.title;

        const counts = await this.registrationRepo.countByMission(mission.id);
        if (!mission.canEnroll(counts.paid)) {
          return Result.fail(
            new Error(
              `As inscrições para "${mission.title}" estão encerradas no momento.`
            )
          );
        }

        if (mission.isWaitlistMode(counts.paid)) {
          isWaitlist = true;
        }

        // Calculate dynamic price if custom mission price differs
        if (modalityResult.value.type === "MISSION") {
          effectivePrice = mission.price;
        } else if (modalityResult.value.type === "BOTH") {
          const schoolOffering = await this.offeringRepo.findByModality("SCHOOL");
          effectivePrice = schoolOffering
            ? schoolOffering.price.add(mission.price)
            : offering.price;
        }
      }
    } else if (
      modalityResult.value.includesAmazonasMission &&
      offering.maxSlots !== null
    ) {
      const metrics = await this.registrationRepo.getMetrics();
      if (!offering.hasAvailableSlots(metrics.missaoPaidSlots)) {
        isWaitlist = true;
      }
    }

    const gateway = PaymentGatewayResolver.resolve();

    const registrationResult = Registration.enroll({
      fullName,
      email: emailResult.value,
      phone: phoneResult.value,
      cpf: cpfResult.value,
      modality: modalityResult.value,
      missionId: targetMissionId,
      amount: effectivePrice instanceof Money ? effectivePrice : offering.price,
      paymentProvider: gateway.providerName,
      lgpdConsent: lgpdResult.value,
      initialStatus: isWaitlist ? "WAITLIST" : "PENDING",
    });

    if (!registrationResult.success) {
      return Result.fail(registrationResult.error);
    }

    const registration = registrationResult.value;
    await this.registrationRepo.save(registration);

    // Waitlist registrations do not go to payment checkout immediately
    if (isWaitlist) {
      return Result.ok({
        registrationId: registration.id,
        isWaitlist: true,
        missionTitle: targetMissionTitle,
        amountFormatted: registration.amount.formatted,
      });
    }

    const checkout = await gateway.createCheckoutSession(registration, offering);

    return Result.ok({
      registrationId: registration.id,
      isWaitlist: false,
      missionTitle: targetMissionTitle,
      checkout,
      amountFormatted: registration.amount.formatted,
    });
  }
}
