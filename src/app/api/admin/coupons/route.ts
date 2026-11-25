import { NextResponse } from "next/server";
import { SupabaseCouponRepository } from "@/modules/coupons/infrastructure/persistence/SupabaseCouponRepository";
import { ManageCouponsUseCase } from "@/modules/coupons/application/use-cases/ManageCouponsUseCase";
import {
  CouponKind,
  DiscountType,
  CouponScope,
} from "@/modules/coupons/domain/entities/DiscountCoupon";

const couponRepo = new SupabaseCouponRepository();
const manageCoupons = new ManageCouponsUseCase(couponRepo);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("couponId");

    if (couponId) {
      const redemptions = await couponRepo.listRedemptionsByCoupon(couponId);
      return NextResponse.json({
        redemptions: redemptions.map((r) => ({
          id: r.id,
          cpf: r.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
          originalAmountCents: r.originalAmountCents,
          discountCents: r.discountCents,
          finalAmountCents: r.finalAmountCents,
          redeemedAt: r.redeemedAt.toISOString(),
        })),
      });
    }

    const list = await couponRepo.listAll();
    const now = new Date();

    return NextResponse.json({
      coupons: list.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description || "",
        kind: c.kind,
        discountType: c.discountType,
        discountValue: c.discountValue,
        applicableScope: c.applicableScope,
        maxUses: c.maxUses,
        currentUses: c.currentUses,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        isActive: c.isActive,
        isExpired: c.isExpired(now),
        hasRemainingUses: c.hasRemainingUses(),
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/coupons error:", err);
    return NextResponse.json(
      { error: "Erro ao listar cupons." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await manageCoupons.create({
      code: String(body.code || ""),
      description: body.description ? String(body.description) : undefined,
      kind: body.kind as CouponKind,
      discountType: body.discountType as DiscountType,
      discountValue: Number(body.discountValue),
      applicableScope: (body.applicableScope || "SCHOOL_AND_COMBO") as CouponScope,
      maxUses:
        body.maxUses !== undefined && body.maxUses !== null && body.maxUses !== ""
          ? Number(body.maxUses)
          : null,
      expiresAt: body.expiresAt ? String(body.expiresAt) : null,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ id: result.value.id, code: result.value.code }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/coupons error:", err);
    return NextResponse.json(
      { error: "Erro ao criar cupom." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "ID e status isActive são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await manageCoupons.toggleActive(id, isActive);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/coupons error:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar cupom." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    const result = await manageCoupons.delete(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/coupons error:", err);
    return NextResponse.json(
      { error: "Erro ao excluir cupom." },
      { status: 500 }
    );
  }
}
