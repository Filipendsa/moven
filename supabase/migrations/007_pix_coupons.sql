-- ==============================================================================
-- MOVEN · Migration 007: Pix Discount Coupons & Per-CPF Redemptions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('SINGLE_USE', 'CAMPAIGN')),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('FIXED_AMOUNT', 'PERCENTAGE')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  applicable_scope TEXT NOT NULL DEFAULT 'SCHOOL_AND_COMBO'
    CHECK (applicable_scope IN ('SCHOOL', 'SCHOOL_AND_COMBO', 'ALL')),
  payment_method TEXT NOT NULL DEFAULT 'PIX' CHECK (payment_method = 'PIX'),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discount_coupons_code_idx
  ON public.discount_coupons (code);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE RESTRICT,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  cpf TEXT NOT NULL,
  original_amount_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL,
  final_amount_cents INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupon_redemptions_cpf_uidx UNIQUE (cpf),
  CONSTRAINT coupon_redemptions_registration_uidx UNIQUE (registration_id)
);

CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx
  ON public.coupon_redemptions (coupon_id);

-- Audit columns on registrations
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS original_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.discount_coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Enable RLS (accessed exclusively via server-side secret key)
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Atomic coupon redemption increment function
CREATE OR REPLACE FUNCTION public.redeem_discount_coupon(p_coupon_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_id UUID;
BEGIN
  UPDATE public.discount_coupons
  SET
    current_uses = current_uses + 1,
    updated_at = NOW()
  WHERE id = p_coupon_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
  RETURNING id INTO v_updated_id;

  RETURN v_updated_id IS NOT NULL;
END;
$$;
