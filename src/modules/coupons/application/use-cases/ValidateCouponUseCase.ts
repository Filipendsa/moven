import { Result } from "@/shared/domain/Result";
import { ICouponRepository } from "../../domain/repositories/ICouponRepository";
import {
  DiscountCoupon,
  DiscountCalculation,
} from "../../domain/entities/DiscountCoupon";
import { Cpf } from "@/modules/enrollment/domain/value-objects/Cpf";
import { EnrollmentModality } from "@/modules/enrollment/domain/value-objects/EnrollmentModality";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";

export interface ValidateCouponInput {
  code: string;
  cpf?: string;
  modality: string;
  paymentMethod?: string;
  baseAmountCents: number;
}

export interface ValidateCouponOutput {
  coupon: DiscountCoupon;
  calculation: DiscountCalculation;
}

export class ValidateCouponUseCase {
  constructor(private couponRepo: ICouponRepository) {}

  async execute(
    input: ValidateCouponInput
  ): Promise<Result<ValidateCouponOutput, Error>> {
    const normalizedCode = DiscountCoupon.normalizeCode(input.code || "");
    if (!normalizedCode) {
      return Result.fail(new Error("Informe o código do cupom."));
    }

    const modalityResult = EnrollmentModality.create(input.modality);
    if (!modalityResult.success) {
      return Result.fail(modalityResult.error);
    }

    const baseMoneyResult = Money.fromCents(input.baseAmountCents);
    if (!baseMoneyResult.success) {
      return Result.fail(baseMoneyResult.error);
    }

    const coupon = await this.couponRepo.findByCode(normalizedCode);
    if (!coupon) {
      return Result.fail(new Error("Cupom não encontrado."));
    }

    const eligibilityResult = coupon.validateEligibility({
      modality: modalityResult.value.type,
      paymentMethod: input.paymentMethod,
    });
    if (!eligibilityResult.success) {
      return Result.fail(eligibilityResult.error);
    }

    if (input.cpf && input.cpf.replace(/\D/g, "").length === 11) {
      const cpfResult = Cpf.create(input.cpf);
      if (!cpfResult.success) {
        return Result.fail(cpfResult.error);
      }

      const alreadyRedeemed = await this.couponRepo.hasCpfRedeemed(
        cpfResult.value.value
      );
      if (alreadyRedeemed) {
        return Result.fail(
          new Error("Este CPF já utilizou um cupom de desconto anteriormente.")
        );
      }
    }

    const calculation = coupon.calculateDiscount(
      baseMoneyResult.value,
      modalityResult.value.type
    );

    return Result.ok({ coupon, calculation });
  }
}
