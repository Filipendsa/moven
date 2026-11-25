import { Result } from "@/shared/domain/Result";
import { IRegistrationRepository } from "../../domain/repositories/IRegistrationRepository";
import { IEventOfferingRepository } from "@/modules/mission-catalog/domain/repositories/IEventOfferingRepository";
import { IMissionRepository } from "@/modules/mission-catalog/domain/repositories/IMissionRepository";
import { ICouponRepository } from "@/modules/coupons/domain/repositories/ICouponRepository";
import { DiscountCoupon } from "@/modules/coupons/domain/entities/DiscountCoupon";
import {
  PaymentGatewayResolver,
  PaymentMethodPreference,
} from "@/modules/billing/application/PaymentGatewayResolver";
import { Registration } from "../../domain/entities/Registration";
import { Cpf } from "../../domain/value-objects/Cpf";
import { Email } from "../../domain/value-objects/Email";
import { BrazilianPhone } from "../../domain/value-objects/BrazilianPhone";
import { EnrollmentModality } from "../../domain/value-objects/EnrollmentModality";
import { LgpdConsent } from "../../domain/value-objects/LgpdConsent";
import { ShirtSize } from "../../domain/value-objects/ShirtSize";
import { BirthDate } from "../../domain/value-objects/BirthDate";
import { DuplicateCpfEnrollmentError } from "../../domain/errors/DuplicateCpfEnrollmentError";
import { EnrollmentPricingAndMissionResolver } from "../services/EnrollmentPricingAndMissionResolver";
import { CheckoutResult } from "@/modules/billing/domain/ports/IPaymentGateway";
import { INotificationGateway } from "@/modules/notifications/domain/ports/INotificationGateway";
import { NotificationGatewayResolver } from "@/modules/notifications/application/NotificationGatewayResolver";
import { Locale } from "@/i18n/config";
import { publicEnv } from "@/shared/config/env";

export interface EnrollParticipantInput {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  modality: string;
  missionId?: string;
  shirtSize: string;
  paymentMethod?: PaymentMethodPreference;
  couponCode?: string;
  termsAccepted: boolean;
  locale?: Locale;
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
    private missionRepo?: IMissionRepository,
    private notificationGateway?: INotificationGateway,
    private couponRepo?: ICouponRepository
  ) {}

  private resolveMissionaryAreaUrl(email: string, locale: Locale): string {
    const baseUrl = publicEnv.appUrl.replace(/\/$/, "");
    return `${baseUrl}/${locale}/missionary?email=${encodeURIComponent(email)}`;
  }

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

    const birthDateResult = BirthDate.create(input.birthDate);
    if (!birthDateResult.success) return Result.fail(birthDateResult.error);

    const modalityResult = EnrollmentModality.create(input.modality);
    if (!modalityResult.success) return Result.fail(modalityResult.error);

    const shirtSizeResult = ShirtSize.create(input.shirtSize);
    if (!shirtSizeResult.success) return Result.fail(shirtSizeResult.error);

    const lgpdResult = LgpdConsent.create(input.termsAccepted);
    if (!lgpdResult.success) return Result.fail(lgpdResult.error);

    const existingRegistrations = await this.registrationRepo.findByCpf(
      cpfResult.value.value
    );
    if (existingRegistrations.length > 0) {
      return Result.fail(
        new DuplicateCpfEnrollmentError(cpfResult.value.formatted)
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

    const {
      offering,
      targetMissionId,
      targetMissionTitle,
      isWaitlist,
      effectivePrice,
    } = resolvedResult.value;

    if (!isWaitlist && !input.paymentMethod) {
      return Result.fail(
        new Error("Selecione um método de pagamento (Pix ou Cartão) após preencher o formulário.")
      );
    }

    const gateway = PaymentGatewayResolver.resolve(input.paymentMethod);

    let finalAmount = effectivePrice;
    let originalAmount = undefined;
    let discountCents = 0;
    let appliedCoupon: DiscountCoupon | undefined;

    const normalizedCouponCode = input.couponCode
      ? DiscountCoupon.normalizeCode(input.couponCode)
      : "";

    if (!isWaitlist && normalizedCouponCode) {
      if (!this.couponRepo) {
        return Result.fail(
          new Error("Sistema de cupons indisponível no momento.")
        );
      }

      const coupon = await this.couponRepo.findByCode(normalizedCouponCode);
      if (!coupon) {
        return Result.fail(new Error("Cupom de desconto não encontrado."));
      }

      const eligibility = coupon.validateEligibility({
        modality: modalityResult.value.type,
        paymentMethod: input.paymentMethod,
      });
      if (!eligibility.success) {
        return Result.fail(eligibility.error);
      }

      const alreadyRedeemed = await this.couponRepo.hasCpfRedeemed(
        cpfResult.value.value
      );
      if (alreadyRedeemed) {
        return Result.fail(
          new Error("Este CPF já utilizou um cupom de desconto anteriormente.")
        );
      }

      const calc = coupon.calculateDiscount(
        effectivePrice,
        modalityResult.value.type
      );
      originalAmount = calc.originalAmount;
      discountCents = calc.discountAmount.amountCents;
      finalAmount = calc.finalAmount;
      appliedCoupon = coupon;
    }

    const registrationResult = Registration.enroll({
      fullName,
      email: emailResult.value,
      phone: phoneResult.value,
      cpf: cpfResult.value,
      birthDate: birthDateResult.value,
      modality: modalityResult.value,
      missionId: targetMissionId,
      shirtSize: shirtSizeResult.value,
      amount: finalAmount,
      originalAmount,
      discountCents,
      couponId: appliedCoupon?.id,
      couponCode: appliedCoupon?.code,
      paymentProvider: gateway.providerName,
      lgpdConsent: lgpdResult.value,
      initialStatus: isWaitlist ? "WAITLIST" : "PENDING",
    });

    if (!registrationResult.success) {
      return Result.fail(registrationResult.error);
    }

    const registration = registrationResult.value;
    await this.registrationRepo.save(registration);

    if (appliedCoupon && this.couponRepo) {
      const redeemed = await this.couponRepo.redeemAtomically({
        couponId: appliedCoupon.id,
        registrationId: registration.id,
        cpfDigits: cpfResult.value.value,
        originalAmountCents: (originalAmount || finalAmount).amountCents,
        discountCents,
        finalAmountCents: finalAmount.amountCents,
      });

      if (!redeemed) {
        return Result.fail(
          new Error(
            "Não foi possível aplicar o cupom (ele pode ter esgotado ou já ter sido usado por este CPF)."
          )
        );
      }
    }

    // Send welcome notification non-blockingly
    try {
      const gateway =
        this.notificationGateway || NotificationGatewayResolver.resolve();
      const locale: Locale = input.locale || "pt";
      const notifyResult = await gateway.sendWelcomeMessage({
        toEmail: registration.email.value,
        fullName: registration.fullName,
        protocol: registration.id.slice(0, 8),
        modalityTitle: registration.modality.title,
        missionTitle: targetMissionTitle,
        shirtSize: registration.shirtSize.value,
        amountFormatted: registration.amount.formatted,
        paymentMethod: registration.paymentProvider === "PIX" ? "PIX" : "CARD",
        isWaitlist,
        missionaryAreaUrl: this.resolveMissionaryAreaUrl(
          registration.email.value,
          locale
        ),
        locale,
      });

      if (
        notifyResult.success &&
        NotificationGatewayResolver.isSmtpConfigured()
      ) {
        registration.markWelcomeSent();
        await this.registrationRepo.save(registration);
      }
    } catch (notifyErr) {
      console.error("Failed to send welcome notification:", notifyErr);
    }

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
