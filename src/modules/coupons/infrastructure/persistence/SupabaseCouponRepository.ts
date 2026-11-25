import {
  ICouponRepository,
  CouponRedemptionRecord,
} from "../../domain/repositories/ICouponRepository";
import {
  DiscountCoupon,
  CouponKind,
  DiscountType,
  CouponScope,
} from "../../domain/entities/DiscountCoupon";
import { supabaseServer } from "@/shared/infrastructure/supabase/server";
import { publicEnv } from "@/shared/config/env";
import crypto from "crypto";

interface CouponPersistenceRow {
  id: string;
  code: string;
  description: string | null;
  kind: string;
  discount_type: string;
  discount_value: number;
  applicable_scope: string;
  payment_method: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RedemptionPersistenceRow {
  id: string;
  coupon_id: string;
  registration_id: string;
  cpf: string;
  original_amount_cents: number;
  discount_cents: number;
  final_amount_cents: number;
  redeemed_at: string;
}

export class SupabaseCouponRepository implements ICouponRepository {
  private static couponStore = new Map<string, CouponPersistenceRow>();
  private static redemptionStore = new Map<string, RedemptionPersistenceRow>();

  private toRow(coupon: DiscountCoupon): CouponPersistenceRow {
    return {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description || null,
      kind: coupon.kind,
      discount_type: coupon.discountType,
      discount_value: coupon.discountValue,
      applicable_scope: coupon.applicableScope,
      payment_method: coupon.paymentMethod,
      max_uses: coupon.maxUses,
      current_uses: coupon.currentUses,
      expires_at: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      is_active: coupon.isActive,
      created_at: coupon.createdAt.toISOString(),
      updated_at: coupon.updatedAt.toISOString(),
    };
  }

  private toDomain(row: CouponPersistenceRow): DiscountCoupon {
    return DiscountCoupon.reconstitute(
      {
        code: row.code,
        description: row.description || undefined,
        kind: row.kind as CouponKind,
        discountType: row.discount_type as DiscountType,
        discountValue: row.discount_value,
        applicableScope: (row.applicable_scope || "SCHOOL_AND_COMBO") as CouponScope,
        paymentMethod: "PIX",
        maxUses: row.max_uses,
        currentUses: row.current_uses,
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.id
    );
  }

  async findByCode(code: string): Promise<DiscountCoupon | null> {
    const normalized = DiscountCoupon.normalizeCode(code);

    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("discount_coupons")
          .select("*")
          .eq("code", normalized)
          .maybeSingle();

        if (!error && data) {
          return this.toDomain(data as CouponPersistenceRow);
        }
      } catch (err) {
        console.warn("SupabaseCouponRepository.findByCode fallback:", err);
      }
    }

    for (const row of SupabaseCouponRepository.couponStore.values()) {
      if (row.code === normalized) {
        return this.toDomain(row);
      }
    }
    return null;
  }

  async findById(id: string): Promise<DiscountCoupon | null> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("discount_coupons")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return this.toDomain(data as CouponPersistenceRow);
        }
      } catch (err) {
        console.warn("SupabaseCouponRepository.findById fallback:", err);
      }
    }

    const row = SupabaseCouponRepository.couponStore.get(id);
    return row ? this.toDomain(row) : null;
  }

  async listAll(): Promise<DiscountCoupon[]> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("discount_coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return (data as CouponPersistenceRow[]).map((r) => this.toDomain(r));
        }
      } catch (err) {
        console.warn("SupabaseCouponRepository.listAll fallback:", err);
      }
    }

    return Array.from(SupabaseCouponRepository.couponStore.values())
      .map((r) => this.toDomain(r))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async save(coupon: DiscountCoupon): Promise<void> {
    const row = this.toRow(coupon);
    SupabaseCouponRepository.couponStore.set(row.id, row);

    if (publicEnv.isSupabaseConfigured) {
      try {
        const { error } = await supabaseServer
          .from("discount_coupons")
          .upsert(row);

        if (error) {
          console.warn("SupabaseCouponRepository.save fallback:", error.message);
        }
      } catch (err) {
        console.warn("SupabaseCouponRepository.save error:", err);
      }
    }
  }

  async delete(id: string): Promise<void> {
    SupabaseCouponRepository.couponStore.delete(id);

    if (publicEnv.isSupabaseConfigured) {
      try {
        await supabaseServer.from("discount_coupons").delete().eq("id", id);
      } catch (err) {
        console.warn("SupabaseCouponRepository.delete error:", err);
      }
    }
  }

  async hasCpfRedeemed(cpfDigits: string): Promise<boolean> {
    const cleanCpf = cpfDigits.replace(/\D/g, "");

    if (publicEnv.isSupabaseConfigured) {
      try {
        const { count, error } = await supabaseServer
          .from("coupon_redemptions")
          .select("id", { count: "exact", head: true })
          .eq("cpf", cleanCpf);

        if (!error) {
          return (count ?? 0) > 0;
        }
      } catch (err) {
        console.warn("SupabaseCouponRepository.hasCpfRedeemed fallback:", err);
      }
    }

    for (const r of SupabaseCouponRepository.redemptionStore.values()) {
      if (r.cpf === cleanCpf) return true;
    }
    return false;
  }

  async redeemAtomically(params: {
    couponId: string;
    registrationId: string;
    cpfDigits: string;
    originalAmountCents: number;
    discountCents: number;
    finalAmountCents: number;
  }): Promise<boolean> {
    const cleanCpf = params.cpfDigits.replace(/\D/g, "");

    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data: redeemedOk, error: rpcError } = await supabaseServer.rpc(
          "redeem_discount_coupon",
          { p_coupon_id: params.couponId }
        );

        if (!rpcError) {
          if (!redeemedOk) return false;

          const { error: insertError } = await supabaseServer
            .from("coupon_redemptions")
            .insert({
              coupon_id: params.couponId,
              registration_id: params.registrationId,
              cpf: cleanCpf,
              original_amount_cents: params.originalAmountCents,
              discount_cents: params.discountCents,
              final_amount_cents: params.finalAmountCents,
            });

          if (insertError) {
            console.warn(
              "SupabaseCouponRepository.redeemAtomically insert error:",
              insertError.message
            );
            return false;
          }
          return true;
        }
      } catch (err) {
        console.warn("SupabaseCouponRepository.redeemAtomically fallback:", err);
      }
    }

    // In-memory fallback
    const row = SupabaseCouponRepository.couponStore.get(params.couponId);
    if (!row || !row.is_active) return false;
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
      return false;
    }
    if (row.max_uses !== null && row.current_uses >= row.max_uses) {
      return false;
    }
    for (const r of SupabaseCouponRepository.redemptionStore.values()) {
      if (r.cpf === cleanCpf) return false;
    }

    row.current_uses += 1;
    row.updated_at = new Date().toISOString();
    SupabaseCouponRepository.couponStore.set(row.id, row);

    const redemptionId = crypto.randomUUID();
    SupabaseCouponRepository.redemptionStore.set(redemptionId, {
      id: redemptionId,
      coupon_id: params.couponId,
      registration_id: params.registrationId,
      cpf: cleanCpf,
      original_amount_cents: params.originalAmountCents,
      discount_cents: params.discountCents,
      final_amount_cents: params.finalAmountCents,
      redeemed_at: new Date().toISOString(),
    });
    return true;
  }

  async listRedemptionsByCoupon(
    couponId: string
  ): Promise<CouponRedemptionRecord[]> {
    if (publicEnv.isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseServer
          .from("coupon_redemptions")
          .select("*")
          .eq("coupon_id", couponId)
          .order("redeemed_at", { ascending: false });

        if (!error && data) {
          return (data as RedemptionPersistenceRow[]).map((r) => ({
            id: r.id,
            couponId: r.coupon_id,
            registrationId: r.registration_id,
            cpf: r.cpf,
            originalAmountCents: r.original_amount_cents,
            discountCents: r.discount_cents,
            finalAmountCents: r.final_amount_cents,
            redeemedAt: new Date(r.redeemed_at),
          }));
        }
      } catch (err) {
        console.warn("listRedemptionsByCoupon fallback:", err);
      }
    }

    return Array.from(SupabaseCouponRepository.redemptionStore.values())
      .filter((r) => r.coupon_id === couponId)
      .map((r) => ({
        id: r.id,
        couponId: r.coupon_id,
        registrationId: r.registration_id,
        cpf: r.cpf,
        originalAmountCents: r.original_amount_cents,
        discountCents: r.discount_cents,
        finalAmountCents: r.final_amount_cents,
        redeemedAt: new Date(r.redeemed_at),
      }));
  }
}
