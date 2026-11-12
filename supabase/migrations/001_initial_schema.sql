-- Migration inicial para o MOVEN
-- Tabelas: events_config e registrations com RLS e políticas de acesso

CREATE TABLE IF NOT EXISTS events_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modality TEXT UNIQUE NOT NULL CHECK (modality IN ('ESCOLA', 'MISSAO', 'AMBOS')),
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  max_slots INTEGER,
  even3_checkout_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed das configurações das modalidades do MOVEN
INSERT INTO events_config (modality, title, price_cents, max_slots, even3_checkout_url, is_active)
VALUES
  ('ESCOLA', 'Escola de Missões', 16842, NULL, 'https://ingressos.eventodaigreja.com.br/moven-nucleo-de-missoes-igreja-unasp-ht-404c03a0', true),
  ('MISSAO', 'Missão Amazonas 2027', 246316, 28, 'https://ingressos.eventodaigreja.com.br/missao-salva-vidas-amazonia-julho-2027-034970c3', true),
  ('AMBOS', 'Combo: Escola de Missões + Missão Amazonas', 263158, 28, 'https://ingressos.eventodaigreja.com.br/moven-nucleo-de-missoes-igreja-unasp-ht-404c03a0', true)
ON CONFLICT (modality) DO NOTHING;

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('ESCOLA', 'MISSAO', 'AMBOS')),
  amount_cents INTEGER NOT NULL,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('EVEN3', 'INFINITEPAY')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'CANCELED')),
  external_tx_id TEXT,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  terms_version TEXT NOT NULL DEFAULT '2026.1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_registrations_cpf ON registrations(cpf);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_modality ON registrations(modality);

-- Habilitação de RLS (Segurança e LGPD)
ALTER TABLE events_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Políticas events_config: Leitura pública
CREATE POLICY "Public read events config" ON events_config
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Políticas registrations:
-- Anon pode inserir (via Server Actions / API com service role)
-- Leitura e Atualização restritas para administradores logados (authenticated)
CREATE POLICY "Admin read all registrations" ON registrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin update registrations" ON registrations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

