import { NextResponse } from "next/server";
import { SupabaseCouponRepository } from "@/modules/coupons/infrastructure/persistence/SupabaseCouponRepository";
import { ValidateCouponUseCase } from "@/modules/coupons/application/use-cases/ValidateCouponUseCase";

const couponRepo = new SupabaseCouponRepository();
const validateUseCase = new ValidateCouponUseCase(couponRepo);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await validateUseCase.execute({
      code: String(body.code || ""),
      cpf: body.cpf ? String(body.cpf) : undefined,
      modality: String(body.modality || "SCHOOL"),
      paymentMethod: body.paymentMethod ? String(body.paymentMethod) : undefined,
      baseAmountCents: Number(body.baseAmountCents || 17000),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    const { coupon, calculation } = result.value;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      kind: coupon.kind,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      applicableScope: coupon.applicableScope,
      originalAmountCents: calculation.originalAmount.amountCents,
      discountCents: calculation.discountAmount.amountCents,
      finalAmountCents: calculation.finalAmount.amountCents,
    });
  } catch (err) {
    console.error("POST /api/coupons/validate error:", err);
    return NextResponse.json(
      { error: "Erro ao validar cupom de desconto." },
      { status: 500 }
    );
  }
}
