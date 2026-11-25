import { Result } from "@/shared/domain/Result";
import { ICouponRepository } from "../../domain/repositories/ICouponRepository";
import {
  DiscountCoupon,
  CouponKind,
  DiscountType,
  CouponScope,
} from "../../domain/entities/DiscountCoupon";

export interface CreateCouponInput {
  code: string;
  description?: string;
  kind: CouponKind;
  discountType: DiscountType;
  discountValue: number; // cents if FIXED_AMOUNT, 1..100 if PERCENTAGE
  applicableScope?: CouponScope;
  maxUses?: number | null;
  expiresAt?: string | null;
}

export class ManageCouponsUseCase {
  constructor(private couponRepo: ICouponRepository) {}

  async create(
    input: CreateCouponInput
  ): Promise<Result<DiscountCoupon, Error>> {
    const normalizedCode = DiscountCoupon.normalizeCode(input.code || "");
    const existing = await this.couponRepo.findByCode(normalizedCode);
    if (existing) {
      return Result.fail(
        new Error(`Já existe um cupom cadastrado com o código "${normalizedCode}".`)
      );
    }

    let expiresAt: Date | undefined;
    if (input.expiresAt) {
      const parsed = new Date(input.expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        return Result.fail(new Error("Data de validade inválida."));
      }
      expiresAt = parsed;
    }

    const couponResult = DiscountCoupon.create({
      code: normalizedCode,
      description: input.description,
      kind: input.kind,
      discountType: input.discountType,
      discountValue: input.discountValue,
      applicableScope: input.applicableScope || "SCHOOL_AND_COMBO",
      maxUses: input.maxUses,
      expiresAt,
    });

    if (!couponResult.success) {
      return Result.fail(couponResult.error);
    }

    await this.couponRepo.save(couponResult.value);
    return Result.ok(couponResult.value);
  }

  async toggleActive(
    id: string,
    isActive: boolean
  ): Promise<Result<DiscountCoupon, Error>> {
    const coupon = await this.couponRepo.findById(id);
    if (!coupon) {
      return Result.fail(new Error("Cupom não encontrado."));
    }

    coupon.toggleActive(isActive);
    await this.couponRepo.save(coupon);
    return Result.ok(coupon);
  }

  async delete(id: string): Promise<Result<void, Error>> {
    const coupon = await this.couponRepo.findById(id);
    if (!coupon) {
      return Result.fail(new Error("Cupom não encontrado."));
    }

    if (coupon.currentUses > 0) {
      return Result.fail(
        new Error(
          "Este cupom já foi utilizado em inscrições e não pode ser excluído. Você pode desativá-lo."
        )
      );
    }

    await this.couponRepo.delete(id);
    return Result.ok(undefined);
  }
}
