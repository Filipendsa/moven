import { DiscountCoupon } from "../entities/DiscountCoupon";

export interface CouponRedemptionRecord {
  id: string;
  couponId: string;
  registrationId: string;
  cpf: string;
  originalAmountCents: number;
  discountCents: number;
  finalAmountCents: number;
  redeemedAt: Date;
}

export interface ICouponRepository {
  findByCode(code: string): Promise<DiscountCoupon | null>;
  findById(id: string): Promise<DiscountCoupon | null>;
  listAll(): Promise<DiscountCoupon[]>;
  save(coupon: DiscountCoupon): Promise<void>;
  delete(id: string): Promise<void>;
  hasCpfRedeemed(cpfDigits: string): Promise<boolean>;
  redeemAtomically(params: {
    couponId: string;
    registrationId: string;
    cpfDigits: string;
    originalAmountCents: number;
    discountCents: number;
    finalAmountCents: number;
  }): Promise<boolean>;
  listRedemptionsByCoupon(couponId: string): Promise<CouponRedemptionRecord[]>;
}
