-- Migration 002: Dynamic Missions Catalog & Waitlist Support

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  min_slots INTEGER NOT NULL DEFAULT 28,
  max_slots INTEGER DEFAULT 28,
  waitlist_enabled BOOLEAN NOT NULL DEFAULT true,
  even3_checkout_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WAITLIST_ONLY', 'CLOSED', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial featured mission: Missao Amazonas 2027
INSERT INTO missions (
  slug,
  title,
  subtitle,
  description,
  location,
  start_date,
  end_date,
  price_cents,
  min_slots,
  max_slots,
  waitlist_enabled,
  even3_checkout_url,
  is_featured,
  is_active,
  status
)
VALUES (
  'amazon-2027',
  'Missão Amazonas 2027',
  'Projeto Salva-Vidas Amazônia · Missão Noroeste',
  '10 dias de barco pelos rios do Amazonas com ações de construção, evangelismo, saúde básica e apoio junto às comunidades ribeirinhas.',
  'Rios do Amazonas (Manaus e Comunidades Ribeirinhas)',
  '19/07/2027',
  '29/07/2027',
  246316,
  28,
  28,
  true,
  'https://ingressos.eventodaigreja.com.br/missao-salva-vidas-amazonia-julho-2027-034970c3',
  true,
  true,
  'OPEN'
)
ON CONFLICT (slug) DO NOTHING;

-- Update registrations table to support mission_id and WAITLIST status
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;

ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_payment_status_check;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_payment_status_check
  CHECK (payment_status IN ('PENDING', 'PAID', 'WAITLIST', 'CANCELED'));

CREATE INDEX IF NOT EXISTS idx_registrations_mission_id ON registrations(mission_id);

-- RLS Policies for missions
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active missions" ON missions
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin manage missions" ON missions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
