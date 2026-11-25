import { Entity } from "@/shared/domain/Entity";
import { Result } from "@/shared/domain/Result";
import { Money } from "@/modules/mission-catalog/domain/value-objects/Money";
import { ModalityType } from "@/modules/enrollment/domain/value-objects/EnrollmentModality";

export type CouponKind = "SINGLE_USE" | "CAMPAIGN";
export type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";
export type CouponScope = "SCHOOL" | "SCHOOL_AND_COMBO" | "ALL";

export interface DiscountCouponProps {
  code: string;
  description?: string;
  kind: CouponKind;
  discountType: DiscountType;
  discountValue: number; // cents if FIXED_AMOUNT (min 100 = R$ 1.00), 1..100 if PERCENTAGE
  applicableScope: CouponScope;
  paymentMethod: "PIX";
  maxUses: number | null;
  currentUses: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountCalculation {
  originalAmount: Money;
  discountAmount: Money;
  finalAmount: Money;
}

export const SCHOOL_PRICE_CENTS = 17000;

export class DiscountCoupon extends Entity<DiscountCouponProps> {
  private constructor(props: DiscountCouponProps, id?: string) {
    super(props, id);
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get kind(): CouponKind {
    return this.props.kind;
  }

  get discountType(): DiscountType {
    return this.props.discountType;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get applicableScope(): CouponScope {
    return this.props.applicableScope;
  }

  get paymentMethod(): "PIX" {
    return this.props.paymentMethod;
  }

  get maxUses(): number | null {
    return this.props.maxUses;
  }

  get currentUses(): number {
    return this.props.currentUses;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public isExpired(now: Date = new Date()): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  public hasRemainingUses(): boolean {
    if (this.props.maxUses === null) return true;
    return this.props.currentUses < this.props.maxUses;
  }

  public supportsModality(modality: ModalityType): boolean {
    if (this.props.applicableScope === "ALL") return true;
    if (this.props.applicableScope === "SCHOOL_AND_COMBO") {
      return modality === "SCHOOL" || modality === "BOTH";
    }
    return modality === "SCHOOL";
  }

  public validateEligibility(params: {
    modality: ModalityType;
    paymentMethod?: string;
    now?: Date;
  }): Result<void, Error> {
    if (!this.props.isActive) {
      return Result.fail(new Error("Este cupom está desativado no momento."));
    }

    if (this.isExpired(params.now)) {
      return Result.fail(new Error("Este cupom já expirou."));
    }

    if (!this.hasRemainingUses()) {
      return Result.fail(
        new Error("Este cupom já atingiu o limite máximo de utilizações.")
      );
    }

    if (params.paymentMethod !== "PIX") {
      return Result.fail(
        new Error("Cupons de desconto são válidos apenas para pagamento via Pix.")
      );
    }

    if (!this.supportsModality(params.modality)) {
      return Result.fail(
        new Error(
          this.props.applicableScope === "SCHOOL"
            ? "Este cupom é válido apenas para a Escola de Missões."
            : "Este cupom não se aplica à modalidade selecionada."
        )
      );
    }

    return Result.ok(undefined);
  }

  /**
   * Computes discount based on scope:
   * - SCHOOL / SCHOOL_AND_COMBO: discount applies on the School of Missions portion (up to R$ 170,00)
   * - ALL: discount applies on the full base amount of the selected modality
   */
  public calculateDiscount(
    totalBasePrice: Money,
    modality: ModalityType
  ): DiscountCalculation {
    const discountableBaseCents =
      this.props.applicableScope === "ALL"
        ? totalBasePrice.amountCents
        : modality === "BOTH"
        ? Math.min(SCHOOL_PRICE_CENTS, totalBasePrice.amountCents)
        : totalBasePrice.amountCents;

    let rawDiscountCents = 0;
    if (this.props.discountType === "FIXED_AMOUNT") {
      rawDiscountCents = this.props.discountValue;
    } else {
      rawDiscountCents = Math.round(
        (discountableBaseCents * this.props.discountValue) / 100
      );
    }

    const appliedDiscountCents = Math.max(
      0,
      Math.min(rawDiscountCents, discountableBaseCents)
    );
    const finalCents = Math.max(
      0,
      totalBasePrice.amountCents - appliedDiscountCents
    );

    const discountMoney = Money.fromCents(appliedDiscountCents);
    const finalMoney = Money.fromCents(finalCents);

    if (!discountMoney.success || !finalMoney.success) {
      throw new Error("Erro ao calcular desconto do cupom.");
    }

    return {
      originalAmount: totalBasePrice,
      discountAmount: discountMoney.value,
      finalAmount: finalMoney.value,
    };
  }

  public toggleActive(active: boolean): void {
    this.props.isActive = active;
    this.props.updatedAt = new Date();
  }

  public static normalizeCode(raw: string): string {
    return raw.trim().toUpperCase().replace(/\s+/g, "");
  }

  public static create(input: {
    code: string;
    description?: string;
    kind: CouponKind;
    discountType: DiscountType;
    discountValue: number;
    applicableScope?: CouponScope;
    maxUses?: number | null;
    expiresAt?: Date;
  }): Result<DiscountCoupon, Error> {
    const code = this.normalizeCode(input.code || "");
    if (code.length < 3 || code.length > 32) {
      return Result.fail(
        new Error("O código do cupom deve ter entre 3 e 32 caracteres.")
      );
    }

    if (!/^[A-Z0-9_-]+$/.test(code)) {
      return Result.fail(
        new Error("Use apenas letras, números, hífen (-) ou underline (_) no código.")
      );
    }

    if (input.kind === "CAMPAIGN" && !input.expiresAt) {
      return Result.fail(
        new Error("Cupons de campanha exigem uma data de término.")
      );
    }

    if (input.discountType === "FIXED_AMOUNT") {
      if (!Number.isInteger(input.discountValue) || input.discountValue < 100) {
        return Result.fail(
          new Error("O desconto mínimo em reais é de R$ 1,00.")
        );
      }
      const scope = input.applicableScope || "SCHOOL_AND_COMBO";
      if (scope !== "ALL" && input.discountValue > SCHOOL_PRICE_CENTS) {
        return Result.fail(
          new Error("O desconto máximo para a Escola de Missões é de R$ 170,00 (100%).")
        );
      }
    } else {
      if (
        !Number.isFinite(input.discountValue) ||
        input.discountValue < 1 ||
        input.discountValue > 100
      ) {
        return Result.fail(
          new Error("A porcentagem de desconto deve estar entre 1% e 100%.")
        );
      }
    }

    const maxUses =
      input.kind === "SINGLE_USE"
        ? 1
        : input.maxUses && input.maxUses > 0
        ? Math.floor(input.maxUses)
        : null;

    const now = new Date();
    return Result.ok(
      new DiscountCoupon({
        code,
        description: input.description?.trim() || undefined,
        kind: input.kind,
        discountType: input.discountType,
        discountValue: Math.round(input.discountValue),
        applicableScope: input.applicableScope || "SCHOOL_AND_COMBO",
        paymentMethod: "PIX",
        maxUses,
        currentUses: 0,
        expiresAt: input.expiresAt,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
    );
  }

  public static reconstitute(
    props: DiscountCouponProps,
    id: string
  ): DiscountCoupon {
    return new DiscountCoupon(props, id);
  }
}
